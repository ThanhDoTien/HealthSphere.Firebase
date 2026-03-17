
'use server';
/**
 * @fileOverview AI flow to analyze activity text and extract exercise data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AnalyzeActivityInputSchema = z.object({
  text: z.string().describe('The user\'s description of their physical activity.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional().describe('Previous chat history for context.'),
  language: z.string().optional().default('vi'),
});
export type AnalyzeActivityInput = z.infer<typeof AnalyzeActivityInputSchema>;

const AnalyzeActivityOutputSchema = z.object({
  explanation: z.string().describe('A friendly response to the user in the requested language.'),
  activityData: z.object({
    name: z.string().describe('The identified name of the activity.'),
    duration: z.number().min(1).describe('Duration in minutes.'),
    caloriesBurned: z.number().min(0).describe('Estimated calories burned.'),
  }).nullable().describe('The structured activity data if identified, otherwise null.'),
});
export type AnalyzeActivityOutput = z.infer<typeof AnalyzeActivityOutputSchema>;

const analyzeActivityPrompt = ai.definePrompt({
  name: 'analyzeActivityPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: AnalyzeActivityInputSchema },
  output: { schema: AnalyzeActivityOutputSchema },
  prompt: `
Bạn là chuyên gia thể hình HealthSphere. Nhiệm vụ của bạn là thảo luận và phân tích hoạt động thể chất của người dùng.

Lịch sử trò chuyện:
{{#each history}}
{{role}}: {{content}}
{{/each}}

Người dùng nói: "{{{text}}}"

Yêu cầu:
1. Nếu người dùng mô tả hoạt động (ví dụ: "chạy bộ 30p", "tập gym 1 tiếng"), hãy tính toán lượng calo đốt cháy dựa trên các yếu tố phổ biến. Luôn sử dụng số dương cho thời gian và calo.
2. Nếu người dùng yêu cầu thay đổi (ví dụ: "thực ra là 45 phút", "tôi tập nặng hơn"), hãy cập nhật các con số dựa trên ngữ cảnh trước đó.
3. Luôn trả lời bằng tiếng {{language}} một cách thân thiện và khích lệ.
4. Nếu không thể xác định hoạt động hoặc thiếu thời gian, hãy đặt activityData là null và yêu cầu người dùng mô tả rõ hơn.

Trả về JSON có cấu trúc explanation và activityData.
`,
});

export async function analyzeActivityText(input: AnalyzeActivityInput): Promise<AnalyzeActivityOutput> {
  try {
    const { output } = await analyzeActivityPrompt(input);
    if (!output) throw new Error('AI failed to provide analysis.');
    return output;
  } catch (error: any) {
    console.error('Analyze Activity Flow Error:', error);
    throw new Error(error.message || 'Could not analyze your activity.');
  }
}
