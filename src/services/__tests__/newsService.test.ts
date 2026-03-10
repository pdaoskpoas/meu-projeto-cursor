import { describe, test, expect, beforeEach, vi } from 'vitest';
import { newsService } from '../newsService';

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                id: '1',
                title: 'Test Article',
                slug: 'test-article',
                content: '<p>Test content</p>',
                excerpt: 'Test excerpt',
                author_id: '1',
                category: 'Test',
                tags: ['test'],
                cover_image_url: 'http://test.com/image.jpg',
                published_at: new Date().toISOString(),
                is_published: true,
                views: 100,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                author: { name: 'Test Author' }
              },
              error: null
            }),
          }),
          order: () => ({
            limit: () => Promise.resolve({
              data: [],
              error: null
            })
          }),
        }),
      }),
    }),
    rpc: () => Promise.resolve({ error: null }),
  },
}));

describe('newsService', () => {
  test('getArticleBySlug retorna artigo corretamente', async () => {
    const article = await newsService.getArticleBySlug('test-article');
    
    expect(article).not.toBeNull();
    expect(article?.slug).toBe('test-article');
    expect(article?.title).toBe('Test Article');
  });

  test('getPublishedArticles retorna array de artigos', async () => {
    const articles = await newsService.getPublishedArticles();
    
    expect(Array.isArray(articles)).toBe(true);
  });

  test('incrementArticleViews não lança erro', async () => {
    await expect(
      newsService.incrementArticleViews('1')
    ).resolves.not.toThrow();
  });
});



