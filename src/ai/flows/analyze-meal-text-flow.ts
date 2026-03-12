
'use server';
/**
 * @fileOverview AI flow to analyze meal text and extract nutritional data.
 * Vị trí của Prompt: analyzeMealPrompt bên dưới.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AnalyzeMealInputSchema = z.object({
  text: z.string().describe('The user\'s description of what they ate.'),
  language: z.string().optional().default('vi'),
});
export type AnalyzeMealInput = z.infer<typeof AnalyzeMealInputSchema>;

const AnalyzeMealOutputSchema = z.object({
  name: z.string().describe('The identified name of the meal.'),
  calories: z.number().describe('Total calories in kcal.'),
  protein: z.number().describe('Protein in grams.'),
  carbs: z.number().describe('Carbohydrates in grams.'),
  fat: z.number().describe('Fat in grams.'),
  fiber: z.number().describe('Fiber in grams.'),
  explanation: z.string().describe('A brief explanation of the nutritional analysis in the requested language.'),
});
export type AnalyzeMealOutput = z.infer<typeof AnalyzeMealOutputSchema>;

// ĐÂY LÀ PHẦN PROMPT BẠN ĐANG TÌM KIẾM
const analyzeMealPrompt = ai.definePrompt({
  name: 'analyzeMealPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: AnalyzeMealInputSchema },
  output: { schema: AnalyzeMealOutputSchema },
  prompt: `
Bạn là một chuyên gia dinh dưỡng chuyên nghiệp. Người dùng đã mô tả những gì họ đã ăn: "{{{text}}}".

Nhiệm vụ của bạn:
1. Xác định tên món ăn (hoặc tóm tắt ngắn gọn các món).
2. Ước tính calo, protein, carbs, fat, và xơ (fiber) cho phần ăn được mô tả.
3. Cung cấp một lời giải thích ngắn gọn, thân thiện bằng tiếng {{language}}.

Nếu mô tả mơ hồ, hãy đưa ra ước tính hợp lý dựa trên khẩu phần ăn trung bình.
Quan trọng: Luôn trả về dữ liệu số cho các chỉ số dinh dưỡng (không để trống).

Trả về kết quả DUY NHẤT dưới dạng JSON có cấu trúc.
`,
});

export async function analyzeMealText(input: AnalyzeMealInput): Promise<AnalyzeMealOutput> {
  try {
    const { output } = await analyzeMealPrompt(input);
    if (!output) throw new Error('AI failed to provide analysis.');
    return output;
  } catch (error: any) {
    console.error('Analyze Meal Flow Error:', error);
    // Trả về lỗi chi tiết hơn để dễ debug
    throw new Error(error.message || 'Could not analyze your meal. Please try describing it differently.');
  }
}
