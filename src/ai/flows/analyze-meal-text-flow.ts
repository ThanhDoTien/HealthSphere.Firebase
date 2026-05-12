// ==========================================
// FILE: src/ai/flows/analyze-meal-text-flow.ts
// MỤC ĐÍCH: Phân tích Bữa ăn từ Văn bản (AI Meal Text Analysis)
// TỔNG QUAN: Nhận mô tả bữa ăn bằng text (VD: "Tôi ăn phở bò"),
// gửi tới Gemini AI qua Genkit để trích xuất tên món, calo, protein, carbs, fat, fiber.
// Hỗ trợ hội thoại nhiều lượt để tinh chỉnh thông tin.
// ==========================================

'use server';
/**
 * @fileOverview AI flow to analyze meal text and extract nutritional data.
 * Hỗ trợ hội thoại để tinh chỉnh thông tin món ăn.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AnalyzeMealInputSchema = z.object({
  text: z.string().describe('The user\'s description of what they ate.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional().describe('Previous chat history for context.'),
  language: z.string().optional().default('vi'),
});
export type AnalyzeMealInput = z.infer<typeof AnalyzeMealInputSchema>;

const AnalyzeMealOutputSchema = z.object({
  explanation: z.string().describe('A friendly response to the user in the requested language.'),
  mealData: z.object({
    name: z.string().describe('The identified name of the meal.'),
    calories: z.number().min(0).describe('Total calories in kcal.'),
    protein: z.number().min(0).describe('Protein in grams.'),
    carbs: z.number().min(0).describe('Carbohydrates in grams.'),
    fat: z.number().min(0).describe('Fat in grams.'),
    fiber: z.number().min(0).describe('Fiber in grams.'),
  }).nullable().describe('The structured nutritional data if a meal is identified, otherwise null.'),
});
export type AnalyzeMealOutput = z.infer<typeof AnalyzeMealOutputSchema>;

const analyzeMealPrompt = ai.definePrompt({
  name: 'analyzeMealPrompt',
  model: process.env.GENKIT_MODEL as string,
  input: { schema: AnalyzeMealInputSchema },
  output: { schema: AnalyzeMealOutputSchema },
  prompt: `
Bạn là chuyên gia dinh dưỡng HealthSphere. Nhiệm vụ của bạn là thảo luận và phân tích bữa ăn của người dùng.

Lịch sử trò chuyện:
{{#each history}}
{{role}}: {{content}}
{{/each}}

Người dùng nói: "{{{text}}}"

Yêu cầu:
1. Nếu người dùng mô tả món ăn, hãy tính toán calo, protein, carbs, fat và fiber. Đảm bảo tất cả các con số đều là số dương.
2. Nếu người dùng yêu cầu thay đổi (ví dụ: "thêm trứng", "ít cơm hơn"), hãy cập nhật các con số dựa trên ngữ cảnh trước đó.
3. Luôn trả lời bằng tiếng {{language}} một cách thân thiện.
4. Nếu không thể xác định món ăn, hãy đặt mealData là null và yêu cầu người dùng mô tả rõ hơn.

Trả về JSON có cấu trúc explanation và mealData.
`,
});

export async function analyzeMealText(input: AnalyzeMealInput): Promise<AnalyzeMealOutput> {
  try {
    const { output } = await analyzeMealPrompt(input);
    if (!output) throw new Error('AI failed to provide analysis.');
    return output;
  } catch (error: any) {
    if (error?.status === 'UNAVAILABLE' || error?.code === 503) {
      console.log('🔄 [Fallback] Model 3.1 Pro is unavailable, switching to 3 Flash...');
      try {
        const { output } = await analyzeMealPrompt(input, { model: 'googleai/gemini-3-flash-preview' });
        if (!output) throw new Error('AI failed to provide analysis.');
        return output;
      } catch (fallbackError) {
        console.error('Fallback Analyze Meal Flow Error:', fallbackError);
        throw new Error('Could not analyze your meal.');
      }
    }
    console.error('Analyze Meal Flow Error:', error);
    throw new Error(error.message || 'Could not analyze your meal.');
  }
}
