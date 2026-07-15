import { describe, expect, it, vi } from 'vitest';
import { deliverFeedback, feedbackAsText, normalizeFeedbackPayload } from './feedback';

const payload = {
  category: 'idea' as const,
  message: '  Хочу сравнение боли по циклам  ',
  contact: '  @mira-user  ',
  clientVersion: '0.1.0',
};

describe('feedback delivery', () => {
  it('normalizes a payload without attaching health records', () => {
    expect(normalizeFeedbackPayload(payload)).toEqual({
      category: 'idea',
      message: 'Хочу сравнение боли по циклам',
      contact: '@mira-user',
      clientVersion: '0.1.0',
    });
  });

  it('posts the same contract when an endpoint is configured', async () => {
    const fetcher = vi.fn(async () => new Response('{}', { status: 202 }));
    await expect(deliverFeedback(payload, { endpoint: 'https://example.test/feedback', fetcher })).resolves.toBe('api');
    expect(fetcher).toHaveBeenCalledWith('https://example.test/feedback', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(normalizeFeedbackPayload(payload)),
    }));
  });

  it('uses native share and falls back to clipboard without an API', async () => {
    const share = vi.fn(async () => undefined);
    await expect(deliverFeedback(payload, { navigatorApi: { share } })).resolves.toBe('share');
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ text: feedbackAsText(payload) }));

    const writeText = vi.fn(async () => undefined);
    await expect(deliverFeedback(payload, { navigatorApi: { clipboard: { writeText } } })).resolves.toBe('clipboard');
    expect(writeText).toHaveBeenCalledWith(feedbackAsText(payload));
  });
});
