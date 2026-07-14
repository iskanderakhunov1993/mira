import { describe, expect, it } from 'vitest';
import { knowledgeArticles } from './knowledge';

describe('knowledge library', () => {
  it('contains 30 unique source-backed articles with an explicit review status', () => {
    expect(knowledgeArticles).toHaveLength(30);
    expect(new Set(knowledgeArticles.map((article) => article.id)).size).toBe(30);
    expect(new Set(knowledgeArticles.map((article) => article.title)).size).toBe(30);
    expect(knowledgeArticles.every((article) => article.reviewStatus === 'source-backed-unreviewed')).toBe(true);
  });

  it('keeps every article readable, actionable and linked to medical sources', () => {
    for (const article of knowledgeArticles) {
      expect(article.summary.length).toBeGreaterThan(40);
      expect(article.readingMinutes).toBeGreaterThanOrEqual(3);
      expect(article.sections.length).toBeGreaterThanOrEqual(2);
      expect(article.example.length).toBeGreaterThan(40);
      expect(article.whenToSeekCare.length).toBeGreaterThan(40);
      expect(article.sources.length).toBeGreaterThanOrEqual(1);
      expect(article.sources.every((source) => source.url.startsWith('https://'))).toBe(true);
      expect(article.sources.every((source) => source.publisher.length > 0)).toBe(true);
    }
  });
});
