import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";

const baseUrl = process.env.MIRA_BASE_URL ?? "http://127.0.0.1:4173";
const channel = process.env.PLAYWRIGHT_CHROME_CHANNEL ?? "chrome";

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

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 2) throw new Error(`${label} has horizontal overflow: ${overflow}px.`);
}

async function assertMobileRoute(page, route, pattern, label) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.getByText(pattern).first().waitFor({ timeout: 10_000 });
  await assertNoHorizontalOverflow(page, label);
}

const browser = await chromium.launch({ headless: true, channel });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: "light",
  acceptDownloads: true,
});
const page = await context.newPage();

const result = {
  baseUrl,
  steps: [],
  today: todayIso(),
};

try {
  await page.goto(`${baseUrl}/onboarding`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  result.steps.push("opened clean onboarding");
  await assertNoHorizontalOverflow(page, "Onboarding mobile");

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
  await page.getByText("Что отметить быстро?").waitFor({ timeout: 10_000 });
  await assertNoHorizontalOverflow(page, "Today mobile");
  result.steps.push("completed onboarding and reached Today");

  await page.goto(`${baseUrl}/add`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.getByRole("button", { name: "Вода" }).click();
  await page.getByRole("button", { name: "Свой объём" }).click();
  await click(page, /Записать/);
  await page.getByText("Введите объём воды больше 0 мл.").first().waitFor({ timeout: 10_000 });
  result.steps.push("Add shows validation error for invalid water amount");
  await page.goto(`${baseUrl}/today`, { waitUntil: "networkidle", timeout: 30_000 });

  await click(page, /Быстро отметить: Месячные/);
  await page.waitForURL("**/add?action=period", { timeout: 10_000 });
  await click(page, /Записать/);
  await page.waitForURL("**/today", { timeout: 15_000 });
  result.steps.push("saved period start from Today quick action");

  await click(page, /Быстро отметить: Симптом/);
  await page.waitForURL("**/add?action=symptom", { timeout: 10_000 });
  await click(page, /Записать/);
  await page.waitForURL("**/today", { timeout: 15_000 });
  result.steps.push("saved symptom from Today quick action");

  await page.goto(`${baseUrl}/calendar`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.getByText(/Месячные начались|Симптомы:/).first().waitFor({ timeout: 10_000 });
  await assertNoHorizontalOverflow(page, "Calendar mobile");
  result.steps.push("Calendar shows saved entry");

  await page.goto(`${baseUrl}/analysis`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.getByText(/Mira заметила|Аналитика|Текущий цикл/).first().waitFor({ timeout: 10_000 });
  await assertNoHorizontalOverflow(page, "Analytics mobile");
  result.steps.push("Analytics route renders after saved entries");

  await page.goto(`${baseUrl}/report`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.getByText("Что включить").first().waitFor({ timeout: 10_000 });
  await assertNoHorizontalOverflow(page, "Report mobile");
  const privateNotesToggle = page.getByRole("button", { name: /Личные заметки/ }).first();
  const sexToggle = page.getByRole("button", { name: /Секс и контрацепция/ }).first();
  await privateNotesToggle.waitFor({ timeout: 10_000 });
  await sexToggle.waitFor({ timeout: 10_000 });
  await page.evaluate(() => {
    const raw = localStorage.getItem("mira:data");
    if (!raw) return;
    const data = JSON.parse(raw);
    const now = new Date();
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
    data.checkIns ??= {};
    data.checkIns[today] = {
      ...(data.checkIns[today] ?? { date: today, savedAt: new Date().toISOString() }),
      note: { text: "PRIVATE_NOTE_SHOULD_NOT_EXPORT" },
      intimacy: { happened: true, protection: "unprotected", feeling: "pain", bleedingAfter: true },
      meals: [{ type: "snack", size: "small", components: ["sweets"], estimatedKcal: { min: 777, max: 777 } }],
    };
    localStorage.setItem("mira:data", JSON.stringify(data));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Что включить").first().waitFor({ timeout: 10_000 });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Скачать TXT/ }).first().click();
  const download = await downloadPromise;
  const reportText = await readFile(await download.path(), "utf8");
  if (reportText.includes("PRIVATE_NOTE_SHOULD_NOT_EXPORT")) throw new Error("Report exported private note by default.");
  if (/СЕКС И СВЯЗАННЫЕ СИМПТОМЫ|незащищ|контрацеп|секс:/i.test(reportText)) throw new Error("Report exported sex data by default.");
  if (/Питание|777/.test(reportText)) throw new Error("Report exported nutrition/calorie data by default.");
  result.steps.push("Report privacy controls default to excluding notes, sex, and nutrition from TXT");
  await page.getByRole("button", { name: /Скопировать вопросы/ }).first().click();
  await page.getByText(/Вопросы врачу скопированы|Не удалось скопировать вопросы/).first().waitFor({ timeout: 10_000 });
  result.steps.push("Report question copy action responds");

  await page.goto(`${baseUrl}/body`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.getByText("Сводка для врача").first().waitFor({ timeout: 10_000 });
  await assertNoHorizontalOverflow(page, "Body mobile");
  const bodyDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /^TXT$/ }).click();
  const bodyDownload = await bodyDownloadPromise;
  const bodyText = await readFile(await bodyDownload.path(), "utf8");
  if (!bodyText.includes("Mira — сводка для врача")) throw new Error("Body TXT export did not include doctor summary.");
  const popupPromise = context.waitForEvent("page");
  await page.getByRole("button", { name: /^PDF$/ }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded", { timeout: 10_000 }).catch(() => undefined);
  await popup.waitForFunction(() => document.body?.innerText?.length > 0, null, { timeout: 10_000 }).catch(() => undefined);
  const popupText = await popup.locator("body").innerText({ timeout: 10_000 });
  if (!popupText.includes("Mira — сводка для врача")) throw new Error(`Body PDF/print popup did not render doctor summary: ${popupText.slice(0, 160)}`);
  await popup.close();
  result.steps.push("Body renders doctor report CTA and exports TXT/PDF");

  await page.goto(`${baseUrl}/settings`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.getByText("Настройки").first().waitFor({ timeout: 10_000 });
  await assertNoHorizontalOverflow(page, "Settings mobile");
  await page.getByRole("main").getByRole("button", { name: "Добавить" }).click();
  await page.getByText("Напишите симптом перед добавлением.").waitFor({ timeout: 10_000 });
  result.steps.push("Settings shows validation error for empty custom symptom");

  await assertMobileRoute(page, "/offline", /Ты офлайн/, "Offline mobile");
  result.steps.push("Offline route renders");

  const darkContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
  });
  const darkPage = await darkContext.newPage();
  await assertMobileRoute(darkPage, "/today", /Что отметить быстро?|Мы начинаем узнавать|Сегодня/, "Today dark mobile");
  const darkBackground = await darkPage.evaluate(() => getComputedStyle(document.body).backgroundColor);
  if (!darkBackground || darkBackground === "rgba(0, 0, 0, 0)") throw new Error("Dark theme background was not applied.");
  await darkContext.close();
  result.steps.push("Dark theme mobile route renders");

  const snapshot = await page.evaluate(() => JSON.parse(localStorage.getItem("mira-new-health-v1") || "null"));
  const todayEntry = snapshot?.dailyEntries?.find((entry) => entry.date === new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10));
  result.healthSnapshot = {
    hasProfile: Boolean(snapshot?.profile?.onboardingCompleted),
    cycles: snapshot?.cycles?.length ?? 0,
    dailyEntries: snapshot?.dailyEntries?.length ?? 0,
    todayEntry,
    todayHasPeriodStart: todayEntry?.period?.state === "started",
    todaySymptoms: todayEntry?.symptoms ?? [],
  };

  console.log(JSON.stringify(result, null, 2));

  if (!result.healthSnapshot.hasProfile) throw new Error("Health snapshot profile was not saved.");
  if (!result.healthSnapshot.todayHasPeriodStart) throw new Error("Today period start was not saved.");
  if (!result.healthSnapshot.todaySymptoms.length) throw new Error("Today symptom was not saved.");
} finally {
  await browser.close();
}
