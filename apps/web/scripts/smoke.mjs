import { chromium } from "@playwright/test";

const baseUrl = process.env.MIRA_BASE_URL ?? "http://localhost:4173";

const checks = [];

async function check(name, fn) {
  try {
    await fn();
    checks.push({ name, ok: true });
  } catch (error) {
    checks.push({
      name,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function assertNoFailures(errors) {
  if (errors.length > 0) {
    throw new Error(`Browser errors:\n${errors.join("\n")}`);
  }
}

const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHROME_CHANNEL ?? "chrome" });
const page = await browser.newPage({
  acceptDownloads: true,
  viewport: { width: 430, height: 1200 },
});
const browserErrors = [];

page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") browserErrors.push(message.text());
});

await check("demo seed redirects to analysis", async () => {
  await page.goto(`${baseUrl}/demo`, { waitUntil: "networkidle" });
  await page.waitForURL("**/analysis", { timeout: 10_000 });
  await page.getByText("Что Mira заметила").waitFor({ timeout: 7_000 });
});

await check("analysis opens doctor report", async () => {
  await page.getByRole("button", { name: "6 циклов" }).click();
  await page.getByRole("button", { name: /Собрать отчёт врачу/ }).first().click();
  await page.waitForURL("**/report", { timeout: 10_000 });
  await page.getByText("Отчёт врачу").first().waitFor({ timeout: 7_000 });
});

await check("report privacy and export controls are present", async () => {
  await page.goto(`${baseUrl}/report`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Личные заметки/ }).waitFor({ timeout: 7_000 });
  await page.getByRole("button", { name: /Секс и контрацепция/ }).waitFor({ timeout: 7_000 });
  await page.getByRole("button", { name: /PDF \/ печать/ }).waitFor({ timeout: 7_000 });
  await page.getByRole("button", { name: /Скачать TXT/ }).click();
  await page.getByRole("button", { name: /^Вопросы$/ }).click();
});

await check("today calendar and period marking open", async () => {
  await page.getByRole("button", { name: "Сегодня" }).click();
  await page.waitForURL("**/today", { timeout: 10_000 });
  await page.getByRole("button", { name: "Открыть календарь" }).click();
  await page.getByText("Июль").first().waitFor({ timeout: 7_000 });
  await page.getByRole("button", { name: /Закрыть календарь|Закрыть/ }).first().click();
  await page.getByRole("button", { name: "Месячные" }).click();
  await page.getByText(/Отметить месячные|Нажимайте на даты/i).first().waitFor({ timeout: 7_000 });
  await page.getByRole("button", { name: /Закрыть календарь|Закрыть/ }).first().click();
});

await check("today lifestyle entries save", async () => {
  await page.getByRole("button", { name: "Добавить стакан воды" }).click();
  await page.getByRole("button", { name: "Сохранить воду" }).click();
  await page.getByPlaceholder("например 1800").fill("1800");
  await page.getByRole("button", { name: "Сохранить", exact: true }).first().click();
  await page.getByPlaceholder("например 62.5").fill("62.4");
  await page.getByRole("button", { name: "Сохранить", exact: true }).first().click();
});

await check("sex CTA saves through today modal", async () => {
  await page.goto(`${baseUrl}/today`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Секс" }).click();
  await page.getByRole("button", { name: "Секс с защитой" }).click();
  await page.locator("footer").getByRole("button", { name: "Сохранить", exact: true }).click();
  await page.getByText(/Записала/).waitFor({ timeout: 7_000 });
  await page.waitForTimeout(1_000);
  await page.getByRole("button", { name: "Анализ" }).last().click();
  await page.waitForURL("**/analysis", { timeout: 10_000 });
});

await check("profile report shortcut works", async () => {
  await page.goto(`${baseUrl}/profile`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Отчёт врачу Экспорт данных/ }).click();
  await page.waitForURL("**/report", { timeout: 10_000 });
});

await browser.close();

const failed = checks.filter((item) => !item.ok);
const lines = checks.map((item) => `${item.ok ? "ok" : "fail"} - ${item.name}${item.error ? `\n  ${item.error}` : ""}`);
console.log(lines.join("\n"));

assertNoFailures(browserErrors);

if (failed.length > 0) {
  process.exitCode = 1;
}
