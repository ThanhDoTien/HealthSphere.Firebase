'use server';
/**
 * @fileOverview AI flow to analyze daily nutrition balance.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AnalyzeNutritionInputSchema = z.object({
  totalCalories: z.number().describe('Total calories consumed today.'),
  protein: z.number().describe('Total protein in grams.'),
  carbs: z.number().describe('Total carbohydrates in grams.'),
  fat: z.number().describe('Total fat in grams.'),
  fiber: z.number().describe('Total fiber in grams.'),
  goal: z.string().optional().describe('User health goal.'),
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
  model: 'googleai/gemini-3-flash-preview',
  input: { schema: AnalyzeNutritionInputSchema },
  output: { schema: AnalyzeNutritionOutputSchema },
  prompt: `
Bạn là chuyên gia dinh dưỡng cao cấp của HealthSphere. Hãy phân tích các chỉ số dinh dưỡng của người dùng trong ngày hôm nay để đưa ra lời khuyên cân bằng:

Dữ liệu dinh dưỡng hôm nay:
- Tổng Calo: {{totalCalories}} kcal
- Protein (Đạm): {{protein}}g
- Carbs (Tinh bột): {{carbs}}g
- Fat (Chất béo): {{fat}}g
- Fiber (Chất xơ): {{fiber}}g
- Mục tiêu người dùng: {{goal}}

Nhiệm vụ:
1. Đánh giá tỉ lệ các chất sinh năng lượng (Protein/Carbs/Fat). Tỉ lệ chuẩn thường là 30/40/30 hoặc 25/50/25 tùy mục tiêu.
2. Kiểm tra lượng chất xơ (Fiber). Mục tiêu lý tưởng là 25-30g mỗi ngày.
3. So sánh với mục tiêu "{{goal}}" của người dùng để đưa ra lời khuyên thực tế.
4. Trình bày nội dung phân tích (analysis) ngắn gọn, súc tích, chia thành các ý rõ ràng bằng tiếng {{language}}.
   QUAN TRỌNG: Trình bày dưới dạng danh sách có đánh số (1, 2, 3...). 
   BẮT BUỘC: Sử dụng ký tự xuống dòng (\n) sau mỗi ý. TUYỆT ĐỐI KHÔNG sử dụng các thẻ HTML như <br/>.
5. Xác định trạng thái chung (status):
   - 'good': Cân bằng tốt, đủ chất xơ, calo hợp lý.
   - 'warning': Có một vài chỉ số chưa ổn (ví dụ: quá nhiều fat, quá ít xơ).
   - 'bad': Mất cân bằng nghiêm trọng hoặc nạp quá ít/nhiều so với nhu cầu.

Trả về JSON có cấu trúc analysis và status.
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
