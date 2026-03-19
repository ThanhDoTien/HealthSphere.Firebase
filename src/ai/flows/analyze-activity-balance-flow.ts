'use server';
/**
 * @fileOverview AI flow to analyze daily physical activity balance.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AnalyzeActivityBalanceInputSchema = z.object({
  totalBurned: z.number().describe('Total calories burned through activities today.'),
  tdee: z.number().describe('Total Daily Energy Expenditure of the user.'),
  activities: z.array(z.string()).describe('List of activity names performed today.'),
  goal: z.string().optional().describe('User health goal.'),
  language: z.string().optional().default('vi'),
});
export type AnalyzeActivityBalanceInput = z.infer<typeof AnalyzeActivityBalanceInputSchema>;

const AnalyzeActivityBalanceOutputSchema = z.object({
  analysis: z.string().describe('Detailed analysis of the physical activity balance.'),
  status: z.enum(['good', 'warning', 'bad']).describe('Overall status of the activity level.'),
});
export type AnalyzeActivityBalanceOutput = z.infer<typeof AnalyzeActivityBalanceOutputSchema>;

const analyzeActivityBalancePrompt = ai.definePrompt({
  name: 'analyzeActivityBalancePrompt',
  model: 'googleai/gemini-3-flash-preview',
  input: { schema: AnalyzeActivityBalanceInputSchema },
  output: { schema: AnalyzeActivityBalanceOutputSchema },
  prompt: `
Bạn là chuyên gia thể hình và vận động của HealthSphere. Hãy phân tích các hoạt động thể chất của người dùng hôm nay:

Dữ liệu hoạt động hôm nay:
- Tổng calo đốt cháy (từ tập luyện): {{totalBurned}} kcal
- Mức tiêu thụ năng lượng hàng ngày (TDEE): {{tdee}} kcal
- Các hoạt động đã thực hiện: {{#each activities}}{{{this}}}, {{/each}}
- Mục tiêu người dùng: {{goal}}

Nhiệm vụ:
1. Đánh giá cường độ vận động hôm nay so với mức tiêu thụ năng lượng nền (TDEE).
2. Kiểm tra xem các hoạt động có phù hợp với mục tiêu "{{goal}}" không.
3. Đưa ra lời khuyên khích lệ hoặc điều chỉnh cường độ tập luyện một cách khoa học bằng tiếng {{language}}.
   QUAN TRỌNG: Trình bày dưới dạng danh sách có đánh số (1, 2, 3...). 
   BẮT BUỘC: Sử dụng ký tự xuống dòng (\n) sau mỗi ý. TUYỆT ĐỐI KHÔNG sử dụng các thẻ HTML như <br/>.
4. Xác định trạng thái (status):
   - 'good': Vận động tốt, phù hợp mục tiêu.
   - 'warning': Vận động hơi ít hoặc quá sức so với thể trạng.
   - 'bad': Không vận động hoặc vận động sai hướng mục tiêu.

Trả về JSON có cấu trúc analysis và status.
`,
});

export async function analyzeActivityBalance(input: AnalyzeActivityBalanceInput): Promise<AnalyzeActivityBalanceOutput> {
  try {
    const { output } = await analyzeActivityBalancePrompt(input);
    if (!output) throw new Error('AI failed to provide activity analysis.');
    return output;
  } catch (error: any) {
    console.error('Analyze Activity Balance Flow Error:', error);
    throw new Error(error.message || 'Could not analyze your activity balance.');
  }
}
