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
  imageUrl: z.string().describe('A URL for a high-quality relevant thumbnail image.'),
  category: z.string().describe('Category like Nutrition, Fitness, Mental Health.'),
});

const DiscoverArticlesOutputSchema = z.object({
  articles: z.array(ArticleSchema).describe('List of recommended articles.'),
});
export type DiscoverArticlesOutput = z.infer<typeof DiscoverArticlesOutputSchema>;

const discoverArticlesPrompt = ai.definePrompt({
  name: 'discoverArticlesPrompt',
  model: 'googleai/gemini-3-flash-preview',
  input: { schema: DiscoverArticlesInputSchema },
  output: { schema: DiscoverArticlesOutputSchema },
  prompt: `
Bạn là chuyên gia nghiên cứu y khoa và sức khỏe của HealthSphere. Dựa trên mục tiêu sức khỏe của người dùng là "{{goal}}", hãy thực hiện "tìm kiếm ảo" và đề xuất 5 bài báo hoặc bài viết khoa học uy tín, mang tính ứng dụng cao nhất từ internet (như WHO, Mayo Clinic, Harvard Health, PubMed, Vinmec, Bệnh viện 108, v.v.).

Yêu cầu:
1. Mỗi đề xuất phải có tiêu đề (title), mô tả ngắn gọn (description), nguồn (source), địa chỉ ảnh minh họa (imageUrl) và thể loại (category).
2. URL phải dẫn đến các trang uy tín hoặc các bài viết liên quan thực tế.
3. Hình ảnh (imageUrl) phải là liên kết ảnh chất lượng cao (từ Unsplash hoặc các nguồn ảnh y tế uy tín) mô tả đúng nội dung bài viết.
4. Toàn bộ nội dung trả về bằng tiếng {{language}}. Ưu tiên các kiến thức y khoa đã được Việt hóa hoặc phù hợp với người Việt Nam.
5. Đảm bảo các bài viết mang tính cập nhật, khoa học và dễ hiểu cho người dùng phổ thông.

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
