import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.MIRA_SUPABASE_TEST_EMAIL;
const password = process.env.MIRA_SUPABASE_TEST_PASSWORD;

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!url || !anonKey) {
  fail("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/web/.env.local.");
}

if (!email || !password) {
  fail("Missing MIRA_SUPABASE_TEST_EMAIL or MIRA_SUPABASE_TEST_PASSWORD in apps/web/.env.local.");
}

const supabase = createClient(url, anonKey);

async function getSession() {
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (!signIn.error && signIn.data.user) return signIn.data.user;

  const signUp = await supabase.auth.signUp({ email, password });
  if (!signUp.error && signUp.data.user) return signUp.data.user;

  throw new Error(signIn.error?.message || signUp.error?.message || "Could not authenticate test user.");
}

const user = await getSession();
const today = new Date().toISOString().slice(0, 10);
const payload = {
  cloudSchemaVersion: 3,
  verification: {
    source: "scripts/verify-supabase.mjs",
    ranAt: new Date().toISOString(),
  },
  healthSnapshot: {
    schemaVersion: 1,
    profile: {
      id: "verify-profile",
      onboardingCompleted: true,
      goal: "try",
      lastPeriodStart: today,
      periodStartUnknown: false,
      cycleRegularity: "regular",
      factors: [],
      trackerPreferences: ["cycle", "wellbeing", "mood", "energy", "water"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    cycles: [
      {
        id: `verify-cycle-${today}`,
        startDate: today,
        source: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    dailyEntries: [
      {
        id: `verify-entry-${today}`,
        date: today,
        checkIn: { value: "normal" },
        period: {
          id: `verify-period-${today}`,
          date: today,
          state: "started",
          createdAt: new Date().toISOString(),
        },
        symptoms: ["verification"],
        context: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    settings: {
      themeMode: "system",
      waterTargetMl: 1800,
      trackerPreferences: ["cycle", "wellbeing", "mood", "energy", "water"],
      demoDataEnabled: false,
      notificationsMode: "important_only",
      reminders: {
        periodWindow: true,
        cycleStartConfirm: true,
        water: false,
        sleep: false,
        basalTemperature: false,
        weeklyInsight: true,
        checkIn: true,
      },
      privacy: {
        pinEnabled: false,
        biometricsEnabled: false,
      },
      basalTemperature: {
        enabled: false,
        unit: "celsius",
      },
      customSymptoms: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};

const upsert = await supabase
  .from("user_data")
  .upsert(
    {
      user_id: user.id,
      data: payload,
      data_version: 3,
    },
    { onConflict: "user_id" }
  )
  .select("data, updated_at")
  .single();

if (upsert.error) throw new Error(`Supabase upsert failed: ${upsert.error.message}`);

const readBack = await supabase
  .from("user_data")
  .select("data, updated_at")
  .eq("user_id", user.id)
  .single();

if (readBack.error) throw new Error(`Supabase read failed: ${readBack.error.message}`);

const healthSnapshot = readBack.data.data?.healthSnapshot;
if (!healthSnapshot?.profile?.onboardingCompleted) throw new Error("healthSnapshot.profile was not persisted.");
if (healthSnapshot.dailyEntries?.[0]?.period?.state !== "started") throw new Error("healthSnapshot period entry was not persisted.");

await supabase.auth.signOut();

console.log(JSON.stringify({
  ok: true,
  userId: user.id,
  updatedAt: readBack.data.updated_at,
  persisted: {
    hasProfile: Boolean(healthSnapshot.profile),
    cycles: healthSnapshot.cycles?.length ?? 0,
    dailyEntries: healthSnapshot.dailyEntries?.length ?? 0,
    periodState: healthSnapshot.dailyEntries?.[0]?.period?.state ?? null,
  },
}, null, 2));
