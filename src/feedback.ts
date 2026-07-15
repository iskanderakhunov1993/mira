export type FeedbackCategory = 'idea' | 'problem' | 'question';

export type FeedbackPayload = {
  category: FeedbackCategory;
  message: string;
  contact?: string;
  clientVersion: string;
};

export type FeedbackDelivery = 'api' | 'share' | 'clipboard';

type FeedbackNavigator = {
  share?: (data: { title: string; text: string }) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
};

const categoryLabels: Record<FeedbackCategory, string> = {
  idea: 'Идея',
  problem: 'Проблема',
  question: 'Вопрос',
};

export function normalizeFeedbackPayload(payload: FeedbackPayload): FeedbackPayload {
  const message = payload.message.trim().slice(0, 1200);
  if (!message) throw new Error('EMPTY_FEEDBACK');
  const contact = payload.contact?.trim().slice(0, 160);
  return {
    category: payload.category,
    message,
    contact: contact || undefined,
    clientVersion: payload.clientVersion.slice(0, 40),
  };
}

export function feedbackAsText(payload: FeedbackPayload): string {
  const safe = normalizeFeedbackPayload(payload);
  return [
    `Mira · ${categoryLabels[safe.category]}`,
    '',
    safe.message,
    safe.contact ? `\nКонтакт: ${safe.contact}` : '',
    `\nВерсия: ${safe.clientVersion}`,
  ].join('\n').trim();
}

export async function deliverFeedback(
  payload: FeedbackPayload,
  options: {
    endpoint?: string;
    fetcher?: typeof fetch;
    navigatorApi?: FeedbackNavigator;
  } = {},
): Promise<FeedbackDelivery> {
  const safe = normalizeFeedbackPayload(payload);
  const endpoint = options.endpoint?.trim();

  if (endpoint) {
    const fetcher = options.fetcher ?? fetch;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetcher(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safe),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`FEEDBACK_HTTP_${response.status}`);
      return 'api';
    } finally {
      clearTimeout(timeout);
    }
  }

  const navigatorApi = options.navigatorApi ?? (typeof navigator === 'undefined' ? undefined : navigator);
  const text = feedbackAsText(safe);
  if (navigatorApi?.share) {
    await navigatorApi.share({ title: 'Обратная связь Mira', text });
    return 'share';
  }
  if (navigatorApi?.clipboard) {
    await navigatorApi.clipboard.writeText(text);
    return 'clipboard';
  }
  throw new Error('FEEDBACK_CHANNEL_UNAVAILABLE');
}
