import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnv(path) {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv(resolve(process.cwd(), ".env.local"));

const baseUrl = process.env.MIRA_BASE_URL ?? "http://127.0.0.1:4173";
const channel = process.env.PLAYWRIGHT_CHROME_CHANNEL ?? "chrome";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.MIRA_SUPABASE_TEST_EMAIL ?? "mira-local-test@example.com";
const password = process.env.MIRA_SUPABASE_TEST_PASSWORD ?? "mira-local-test-password-2026";

if (!supabaseKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Load apps/web/.env.local before running this script.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

function todayIso() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function lastPeriodSeed() {
  const date = new Date();
  date.setDate(date.getDate() - 25);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

async function click(page, name) {
  await page.getByRole("button", { name }).click();
}

async function ensureTestUser() {
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (!signIn.error && signIn.data.user) return signIn.data.user.id;

  const signUp = await supabase.auth.signUp({ email, password });
  if (signUp.error) throw signUp.error;
  if (!signUp.data.user) throw new Error("Could not create Supabase test user.");
  return signUp.data.user.id;
}

async function readCloudSnapshot(userId) {
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;

  const { data, error } = await supabase
    .from("user_data")
    .select("data, updated_at")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}

const userId = await ensureTestUser();
await supabase.from("user_data").delete().eq("user_id", userId);
await supabase.auth.signOut();

const browser = await chromium.launch({ headless: true, channel });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
const result = { baseUrl, userId, steps: [] };

try {
  await page.goto(`${baseUrl}/profile`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  result.steps.push("opened clean profile");

  await page.getByRole("button", { name: /Включить резервную копию|Синхронизация/ }).first().click();
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder(/Пароль/).fill(password);
  await click(page, /Войти/);
  await page.getByText(/Синхронизация включена|Синхронизировано/).first().waitFor({ timeout: 20_000 });
  result.steps.push("signed in through app sync UI");

  await page.goto(`${baseUrl}/onboarding`, { waitUntil: "networkidle", timeout: 30_000 });
  await click(page, /Продолжить/);
  await click(page, /Цель: Понимать цикл/);
  await click(page, /Продолжить/);
  await page.getByLabel(/Дата первого дня последних месячных/).fill(lastPeriodSeed());
  await click(page, /Продолжить/);
  await click(page, /Регулярность: Обычно регулярный/);
  await click(page, /Продолжить/);
  await click(page, /Фактор: Ничего из этого/);
  await click(page, /Продолжить/);
  await click(page, /Продолжить/);
  await click(page, /Первый check-in: Обычно/);
  await click(page, /Завершить онбординг/);
  await page.waitForURL("**/today", { timeout: 15_000 });
  result.steps.push("completed onboarding while signed in");

  await click(page, /Быстро отметить: Месячные/);
  await page.waitForURL("**/add?action=period", { timeout: 10_000 });
  await click(page, /Записать/);
  await page.waitForURL("**/today", { timeout: 15_000 });
  result.steps.push("saved period start while signed in");

  await click(page, /Быстро отметить: Симптом/);
  await page.waitForURL("**/add?action=symptom", { timeout: 10_000 });
  await click(page, /Записать/);
  await page.waitForURL("**/today", { timeout: 15_000 });
  result.steps.push("saved symptom while signed in");

  await page.waitForTimeout(1500);
  const cloud = await readCloudSnapshot(userId);
  const snapshot = cloud.data?.healthSnapshot;
  const todayEntry = snapshot?.dailyEntries?.find((entry) => entry.date === todayIso());
  result.cloud = {
    updatedAt: cloud.updated_at,
    hasProfile: Boolean(snapshot?.profile?.onboardingCompleted),
    cycles: snapshot?.cycles?.length ?? 0,
    dailyEntries: snapshot?.dailyEntries?.length ?? 0,
    todayHasPeriodStart: todayEntry?.period?.state === "started",
    todaySymptoms: todayEntry?.symptoms ?? [],
  };

  if (!result.cloud.hasProfile) throw new Error("Cloud healthSnapshot profile missing.");
  if (!result.cloud.todayHasPeriodStart) throw new Error("Cloud period start missing.");
  if (!result.cloud.todaySymptoms.length) throw new Error("Cloud symptom missing.");

  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
