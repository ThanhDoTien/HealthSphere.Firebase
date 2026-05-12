// ==========================================
// FILE: src/ai/flows/analyze-sleep-quality-flow.ts
// MỤC ĐÍCH: Đánh giá Chất lượng Giấc ngủ (Sleep Quality Analysis)
// TỔNG QUAN: Dựa trên số giờ ngủ và độ tuổi, AI đưa ra đánh giá so với
// khuyến nghị WHO (7-9h cho người lớn), kèm mẹo cải thiện giấc ngủ.
// ==========================================

'use server';
/**
 * @fileOverview AI flow to analyze sleep quality and duration.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AnalyzeSleepInputSchema = z.object({
  duration: z.number().describe('Total sleep duration in hours for the last session.'),
  age: z.number().describe('User age.'),
  goal: z.string().optional().describe('User health goal.'),
  language: z.string().optional().default('vi'),
});
export type AnalyzeSleepInput = z.infer<typeof AnalyzeSleepInputSchema>;

const AnalyzeSleepOutputSchema = z.object({
  analysis: z.string().describe('Detailed analysis of the sleep quality.'),
  status: z.enum(['good', 'warning', 'bad']).describe('Overall status of the sleep quality.'),
});
export type AnalyzeSleepOutput = z.infer<typeof AnalyzeSleepOutputSchema>;

const analyzeSleepPrompt = ai.definePrompt({
  name: 'analyzeSleepPrompt',
  model: process.env.GENKIT_MODEL as string,
  input: { schema: AnalyzeSleepInputSchema },
  output: { schema: AnalyzeSleepOutputSchema },
  prompt: `
Bạn là chuyên gia về giấc ngủ và phục hồi của HealthSphere. Hãy đánh giá giấc ngủ của người dùng:

Dữ liệu giấc ngủ:
- Số giờ ngủ: {{duration}} giờ
- Tuổi: {{age}} tuổi
- Mục tiêu sức khỏe: {{goal}}

Nhiệm vụ:
1. Đánh giá thời gian ngủ so với khuyến nghị của tổ chức y tế thế giới cho độ tuổi {{age}}. (Thường là 7-9 giờ cho người trưởng thành).
2. Phân tích ảnh hưởng của thời gian ngủ này tới việc thực hiện mục tiêu "{{goal}}".
3. Đưa ra các mẹo ngắn gọn để cải thiện vệ sinh giấc ngủ bằng tiếng {{language}}.
   QUAN TRỌNG: Trình bày dưới dạng danh sách có đánh số (1, 2, 3...). 
   BẮT BUỘC: Sử dụng ký tự xuống dòng (\n) sau mỗi ý. TUYỆT ĐỐI KHÔNG sử dụng các thẻ HTML như <br/>.
4. Xác định trạng thái (status):
   - 'good': Ngủ đủ 7-9 giờ.
   - 'warning': Ngủ ít hơn 6 giờ hoặc nhiều hơn 10 giờ.
   - 'bad': Thiếu ngủ nghiêm trọng (dưới 4-5 giờ).

Trả về JSON có cấu trúc analysis và status.
`,
});

export async function analyzeSleepQuality(input: AnalyzeSleepInput): Promise<AnalyzeSleepOutput> {
  try {
    const { output } = await analyzeSleepPrompt(input);
    if (!output) throw new Error('AI failed to provide sleep analysis.');
    return output;
  } catch (error: any) {
    if (error?.status === 'UNAVAILABLE' || error?.code === 503) {
      console.log('🔄 [Fallback] Model 3.1 Pro is unavailable, switching to 3 Flash...');
      try {
        const { output } = await analyzeSleepPrompt(input, { model: 'googleai/gemini-3-flash-preview' });
        if (!output) throw new Error('AI failed to provide sleep analysis.');
        return output;
      } catch (fallbackError) {
        console.error('Fallback Analyze Sleep Flow Error:', fallbackError);
        throw new Error('Could not analyze your sleep.');
      }
    }
    console.error('Analyze Sleep Flow Error:', error);
    throw new Error(error.message || 'Could not analyze your sleep.');
  }
}
