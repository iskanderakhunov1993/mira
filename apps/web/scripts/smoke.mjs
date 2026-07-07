const baseUrl = process.env.MIRA_BASE_URL ?? "http://127.0.0.1:4173";

const routes = ["/onboarding", "/today", "/calendar", "/body", "/add", "/settings", "/track", "/profile", "/report", "/analysis"];

async function checkRoute(route) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(new URL(route, baseUrl), {
      signal: controller.signal,
      headers: { "user-agent": "mira-smoke/1.0" },
    });

    return {
      route,
      ok: response.ok,
      status: response.status,
    };
  } finally {
    clearTimeout(timeout);
  }
}

const results = [];

for (const route of routes) {
  try {
    results.push(await checkRoute(route));
  } catch (error) {
    results.push({
      route,
      ok: false,
      status: error instanceof Error ? error.message : String(error),
    });
  }
}

for (const result of results) {
  console.log(`${result.ok ? "ok" : "fail"} - ${result.route} (${result.status})`);
}

if (results.some((result) => !result.ok)) {
  console.error(`Smoke checks require a running app. Start it with npm run dev --workspace=@mira/web or npm run start --workspace=@mira/web.`);
  process.exitCode = 1;
}
