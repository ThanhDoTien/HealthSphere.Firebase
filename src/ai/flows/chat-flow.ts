'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ChatInputSchema = z.object({
  message: z.string(),
  history: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
    })
  ).optional(),
  userProfile: z.object({
    name: z.string(),
    goal: z.string(),
    weight: z.number(),
    height: z.number(),
    age: z.number(),
    gender: z.string(),
    activityLevel: z.string(),
  }).optional(),
  dailySummary: z.object({
    caloriesConsumed: z.number(),
    caloriesBurned: z.number(),
    baseBurned: z.number(),
    exerciseBurned: z.number(),
    sleepHours: z.number(),
  }).optional(),
  // Thêm dữ liệu lịch sử
  weightHistory: z.array(z.object({ date: z.string(), weight: z.number() })).optional(),
  mealHistory: z.array(z.object({ date: z.string(), name: z.string(), calories: z.number(), mealType: z.string() })).optional(),
  activityHistory: z.array(z.object({ date: z.string(), name: z.string(), duration: z.number(), caloriesBurned: z.number() })).optional(),
  sleepHistory: z.array(z.object({ date: z.string(), duration: z.number() })).optional(),
  language: z.string().optional(),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const healthChatPrompt = ai.definePrompt({
  name: 'healthChatPrompt',
  model: 'googleai/gemini-3-flash-preview',
  input: { schema: ChatInputSchema },

  prompt: `
Bạn là HealthSphere AI - chuyên gia tư vấn sức khỏe cá nhân cao cấp. Bạn có quyền truy cập vào toàn bộ nhật ký sức khỏe của người dùng để đưa ra nhận xét chính xác nhất.

THÔNG TIN NGƯỜI DÙNG:
{{#if userProfile}}
- Tên: {{userProfile.name}}
- Mục tiêu: {{userProfile.goal}}
- Chỉ số: {{userProfile.weight}}kg, {{userProfile.height}}cm, {{userProfile.age}} tuổi
{{/if}}

TIẾN ĐỘ THỰC TẾ HÔM NAY:
{{#if dailySummary}}
- Calo nạp: {{dailySummary.caloriesConsumed}} kcal
- Tổng tiêu thụ: {{dailySummary.caloriesBurned}} kcal
- Trong đó: Tiêu thụ nền (TDEE): {{dailySummary.baseBurned}} kcal | Vận động: {{dailySummary.exerciseBurned}} kcal
- Ngủ: {{dailySummary.sleepHours}} giờ
{{/if}}

DỮ LIỆU LỊCH SỬ (Dùng để phân tích xu hướng):
{{#if weightHistory}}
- Xu hướng cân nặng: {{#each weightHistory}}{{date}}: {{weight}}kg | {{/each}}
{{/if}}
{{#if mealHistory}}
- Các bữa ăn gần đây: {{#each mealHistory}}{{date}} ({{mealType}}): {{name}} - {{calories}}kcal | {{/each}}
{{/if}}
{{#if activityHistory}}
- Các hoạt động gần đây: {{#each activityHistory}}{{date}}: {{name}} ({{duration}}p) - Đốt {{caloriesBurned}}kcal | {{/each}}
{{/if}}
{{#if sleepHistory}}
- Lịch sử giấc ngủ: {{#each sleepHistory}}{{date}}: {{duration}}h | {{/each}}
{{/if}}

LỊCH SỬ HỘI THOẠI HIỆN TẠI:
{{#each history}}
{{this.role}}: {{this.content}}
{{/each}}

YÊU CẦU:
1. Dựa vào dữ liệu lịch sử và hôm nay để trả lời câu hỏi của người dùng.
2. Nếu người dùng hỏi về tiến độ (ví dụ: "Tôi dạo này thế nào?"), hãy phân tích xu hướng từ dữ liệu lịch sử.
3. Trả lời ngắn gọn, chân thành, giàu động lực. 
4. Sử dụng tiếng {{#if language}}{{language}}{{else}}vi{{/if}}.
5. LUÔN xuống dòng giữa các ý để dễ đọc.

TIN NHẮN NGƯỜI DÙNG:
"{{{message}}}"
`,
});

export async function healthChat(input: ChatInput): Promise<string> {
  try {
    const { text } = await healthChatPrompt(input);
    return text ?? 'AI hiện không phản hồi.';
  } catch (error) {
    console.error('Genkit Chat Error:', error);
    throw new Error('Could not connect to AI services.');
  }
}
