import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const baseUrl = process.env.MIRA_BASE_URL ?? "http://127.0.0.1:4173";
const channel = process.env.PLAYWRIGHT_CHROME_CHANNEL ?? "chrome";
const outDir = new URL("../.qa/screenshots/", import.meta.url);

const routes = [
  { path: "/onboarding", name: "onboarding", text: /Mira|Продолжить/ },
  { path: "/add", name: "add", text: /Что хотите отметить|Вода/ },
  { path: "/calendar", name: "calendar", text: /Календарь|Прогноз/ },
  { path: "/report", name: "report", text: /Отчёт|Пока отчёт|Mira пока/ },
  { path: "/body", name: "body", text: /Моё тело|Сводка для врача/ },
  { path: "/profile", name: "profile", text: /Профиль|Настройки/ },
  { path: "/settings", name: "settings", text: /Настройки/ },
  { path: "/offline", name: "offline", text: /Ты офлайн/ },
];

async function seed(page) {
  await page.goto(`${baseUrl}/onboarding`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.evaluate(() => {
    const now = new Date();
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
    localStorage.setItem("mira-new-health-v1", JSON.stringify({
      schemaVersion: 1,
      profile: {
        id: "visual-profile",
        displayName: "Mira",
        onboardingCompleted: true,
        goal: "understand_cycle",
        lastPeriodStart: today,
        periodStartUnknown: false,
        cycleRegularity: "regular",
        factors: [],
        trackerPreferences: ["cycle", "wellbeing", "mood", "energy", "water", "symptoms"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      cycles: [{ id: `cycle-${today}`, startDate: today, source: "user", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      dailyEntries: [{
        id: `entry-${today}`,
        date: today,
        checkIn: { value: "normal" },
        period: { id: `period-${today}`, date: today, state: "started", createdAt: new Date().toISOString() },
        waterMl: 500,
        context: [],
        symptoms: ["головная боль"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }],
      settings: {
        themeMode: "system",
        waterTargetMl: 1800,
        trackerPreferences: ["cycle", "wellbeing", "mood", "energy", "water", "symptoms"],
        demoDataEnabled: false,
        notificationsMode: "important_only",
        reminders: { periodWindow: true, cycleStartConfirm: true, water: false, sleep: false, basalTemperature: false, weeklyInsight: true, checkIn: true },
        privacy: { pinEnabled: false, biometricsEnabled: false },
        basalTemperature: { enabled: false, unit: "celsius" },
        customSymptoms: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }));
  });
}

async function auditPage(page, route, colorScheme) {
  await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.getByText(route.text).first().waitFor({ timeout: 10_000 });

  const issues = await page.evaluate(() => {
    const result = [];
    const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    if (overflow > 2) result.push(`horizontal overflow ${overflow}px`);

    const controls = Array.from(document.querySelectorAll("button, a, input, textarea, select"));
    controls.forEach((element, index) => {
      const isSmallNativeChoice = element.matches('input[type="checkbox"], input[type="radio"]');
      const touchElement = isSmallNativeChoice ? element.closest("label") ?? element : element;
      const rect = touchElement.getBoundingClientRect();
      const style = getComputedStyle(element);
      const hidden = rect.width === 0 || rect.height === 0 || style.visibility === "hidden" || style.display === "none";
      if (hidden) return;
      const name = element.getAttribute("aria-label") || element.textContent?.trim() || element.getAttribute("placeholder") || element.getAttribute("title");
      if (!name) result.push(`control ${index + 1} has no accessible name`);
      if (rect.width < 40 || rect.height < 40) result.push(`control "${name || index + 1}" touch target ${Math.round(rect.width)}x${Math.round(rect.height)}`);
    });

    return result;
  });

  const screenshotPath = join(outDir.pathname, `${route.name}-${colorScheme}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return { route: route.path, colorScheme, screenshot: screenshotPath, issues };
}

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, channel });
const report = [];

try {
  for (const colorScheme of ["light", "dark"]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      colorScheme,
    });
    const page = await context.newPage();
    await seed(page);

    for (const route of routes) {
      report.push(await auditPage(page, route, colorScheme));
    }

    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(join(outDir.pathname, "visual-qa-report.json"), JSON.stringify({ baseUrl, generatedAt: new Date().toISOString(), report }, null, 2));

const failures = report.flatMap((item) => item.issues.map((issue) => `${item.route} (${item.colorScheme}): ${issue}`));
console.log(JSON.stringify({ baseUrl, screenshots: report.length, issues: failures }, null, 2));

if (failures.length) process.exitCode = 1;
