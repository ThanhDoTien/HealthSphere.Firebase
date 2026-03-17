'use server';
/**
 * @fileOverview AI flow to discover and suggest health articles based on user goals.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DiscoverArticlesInputSchema = z.object({
  goal: z.string().describe('User health goal.'),
  language: z.string().optional().default('vi'),
});
export type DiscoverArticlesInput = z.infer<typeof DiscoverArticlesInputSchema>;

const ArticleSchema = z.object({
  title: z.string().describe('Title of the article.'),
  description: z.string().describe('A brief summary of the article.'),
  source: z.string().describe('The source name (e.g., WHO, Harvard Health).'),
  url: z.string().describe('A simulated or real URL for more info.'),
  category: z.string().describe('Category like Nutrition, Fitness, Mental Health.'),
});

const DiscoverArticlesOutputSchema = z.object({
  articles: z.array(ArticleSchema).describe('List of recommended articles.'),
});
export type DiscoverArticlesOutput = z.infer<typeof DiscoverArticlesOutputSchema>;

const discoverArticlesPrompt = ai.definePrompt({
  name: 'discoverArticlesPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: DiscoverArticlesInputSchema },
  output: { schema: DiscoverArticlesOutputSchema },
  prompt: `
Bạn là chuyên gia nghiên cứu y khoa của HealthSphere. Dựa trên mục tiêu sức khỏe của người dùng là "{{goal}}", hãy thực hiện "tìm kiếm ảo" và đề xuất 5 bài báo hoặc bài viết khoa học uy tín nhất từ internet (như WHO, Mayo Clinic, Harvard Health, PubMed, v.v.).

Yêu cầu:
1. Mỗi đề xuất phải có tiêu đề (title), mô tả ngắn gọn (description), nguồn (source), và thể loại (category).
2. URL có thể là các trang uy tín tương ứng với chủ đề.
3. Toàn bộ nội dung trả về bằng tiếng {{language}}.
4. Đảm bảo các bài viết mang tính cập nhật và có giá trị khoa học cao.

Mục tiêu người dùng: {{goal}}
`,
});

export async function discoverArticles(input: DiscoverArticlesInput): Promise<DiscoverArticlesOutput> {
  try {
    const { output } = await discoverArticlesPrompt(input);
    if (!output) throw new Error('AI failed to find articles.');
    return output;
  } catch (error: any) {
    console.error('Discover Articles Flow Error:', error);
    throw new Error(error.message || 'Could not discover health articles.');
  }
}
