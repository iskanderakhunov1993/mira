type ReminderSettings = {
  pms: boolean;
  missedLogs: boolean;
  water: boolean;
  vitamins: boolean;
};

const defaultSettings: ReminderSettings = {
  pms: true,
  missedLogs: true,
  water: true,
  vitamins: true,
};

function getSettings(): ReminderSettings {
  try {
    const raw = window.localStorage.getItem("mira-reminders");
    return { ...defaultSettings, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return defaultSettings;
  }
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function canNotify() {
  return "Notification" in window && Notification.permission === "granted";
}

function triggerNotification(title: string, body: string, url = "/today") {
  if (!canNotify()) return;
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: { url },
      });
    }).catch(() => new Notification(title, { body, icon: "/icons/icon-192.png" }));
    return;
  }
  new Notification(title, { body, icon: "/icons/icon-192.png" });
}

function wasSentToday(key: string) {
  return window.localStorage.getItem(`mira-reminder-${key}`) === getTodayKey();
}

function markSentToday(key: string) {
  window.localStorage.setItem(`mira-reminder-${key}`, getTodayKey());
}

export function saveReminderSettings(settings: Partial<ReminderSettings>) {
  window.localStorage.setItem("mira-reminders", JSON.stringify({ ...getSettings(), ...settings }));
}

export function readReminderSettings() {
  return getSettings();
}

export function scheduleReminders() {
  if (typeof window === "undefined") return;
  const settings = getSettings();
  const now = new Date();
  const hour = now.getHours();

  if (settings.water && hour >= 12 && !wasSentToday("water")) {
    triggerNotification("💧 Пора пить воду", "Выпей стакан воды. Маленький шаг тоже считается.");
    markSentToday("water");
  }

  if (settings.vitamins && hour >= 21 && !wasSentToday("vitamins")) {
    triggerNotification("🌙 Время вечерней заботы", "Если тебе подходит магний, не забудь принять его по своей схеме.");
    markSentToday("vitamins");
  }

  if (settings.missedLogs && !wasSentToday("missedLogs")) {
    const lastLog = window.localStorage.getItem("mira-last-log-date");
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    if (lastLog && lastLog < twoDaysAgo.toISOString().slice(0, 10)) {
      triggerNotification("📝 Mira скучает", "Отметь состояние за минуту, чтобы аналитика стала точнее.");
      markSentToday("missedLogs");
    }
  }

  if (settings.pms && !wasSentToday("pms")) {
    const daysUntil = Number(window.localStorage.getItem("mira-days-until-period") ?? "99");
    if (daysUntil <= 3 && daysUntil >= 1) {
      triggerNotification("🌸 Скоро месячные", "Проверь аптечку, воду и удобную одежду на ближайшие дни.");
      markSentToday("pms");
    }
  }
}
