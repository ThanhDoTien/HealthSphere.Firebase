'use server';
/**
 * @fileOverview AI flow to analyze daily nutrition balance.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AnalyzeNutritionInputSchema = z.object({
  totalCalories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number(),
  goal: z.string().optional(),
  language: z.string().optional().default('vi'),
});
export type AnalyzeNutritionInput = z.infer<typeof AnalyzeNutritionInputSchema>;

const AnalyzeNutritionOutputSchema = z.object({
  analysis: z.string().describe('Detailed analysis of the nutrition balance.'),
  status: z.enum(['good', 'warning', 'bad']).describe('Overall status of the nutrition balance.'),
});
export type AnalyzeNutritionOutput = z.infer<typeof AnalyzeNutritionOutputSchema>;

const analyzeNutritionPrompt = ai.definePrompt({
  name: 'analyzeNutritionPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: AnalyzeNutritionInputSchema },
  output: { schema: AnalyzeNutritionOutputSchema },
  prompt: `
Bạn là chuyên gia dinh dưỡng cao cấp của HealthSphere. Hãy phân tích các chỉ số dinh dưỡng của người dùng trong ngày hôm nay:

- Tổng Calo: {{totalCalories}} kcal
- Protein: {{protein}}g
- Carbs: {{carbs}}g
- Fat: {{fat}}g
- Fiber: {{fiber}}g
- Mục tiêu: {{goal}}

Nhiệm vụ:
1. Đánh giá xem tỉ lệ các chất (Macros) đã cân bằng chưa dựa trên mục tiêu của người dùng.
2. Kiểm tra lượng chất xơ (Fiber) đã đủ chưa (thường cần ~25-30g).
3. Trả về một phân tích ngắn gọn, súc tích và đưa ra lời khuyên thực tế bằng tiếng {{language}}.
4. Xác định trạng thái chung (status): 'good' nếu cân bằng, 'warning' nếu hơi lệch, 'bad' nếu quá lệch hoặc nạp quá ít/nhiều.

Trả về JSON có cấu trúc: analysis (string), status (enum).
`,
});

export async function analyzeNutritionBalance(input: AnalyzeNutritionInput): Promise<AnalyzeNutritionOutput> {
  try {
    const { output } = await analyzeNutritionPrompt(input);
    if (!output) throw new Error('AI failed to provide nutrition analysis.');
    return output;
  } catch (error: any) {
    console.error('Analyze Nutrition Flow Error:', error);
    throw new Error(error.message || 'Could not analyze your nutrition.');
  }
}
