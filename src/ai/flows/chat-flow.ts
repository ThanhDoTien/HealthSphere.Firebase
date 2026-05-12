// ==========================================
// FILE: src/ai/flows/chat-flow.ts
// MỤC ĐÍCH: Trò chuyện AI Sức khỏe (Health Chat with RAG Context)
// TỔNG QUAN: Cho phép người dùng trò chuyện tự do với AI chuyên gia sức khỏe.
// AI được nạp ngữ cảnh cá nhân (hồ sơ, lịch sử bữa ăn, hoạt động, giấc ngủ)
// để đưa ra tư vấn cá nhân hóa thông qua kỹ thuật RAG.
// ==========================================

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

const ChatOutputSchema = z.object({
  content: z.string().describe('The textual response from the AI.'),
  extractedData: z.object({
    type: z.enum(['meal', 'activity']).optional(),
    data: z.object({
      name: z.string().optional(),
      calories: z.number().optional(),
      protein: z.number().optional(),
      carbs: z.number().optional(),
      fat: z.number().optional(),
      fiber: z.number().optional(),
      duration: z.number().optional(),
      caloriesBurned: z.number().optional(),
    }).optional(),
  }).nullable().optional().describe('Structured data for logging if an action is detected.'),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

const healthChatPrompt = ai.definePrompt({
  name: 'healthChatPrompt',
  model: process.env.GENKIT_MODEL as string,
  input: { schema: ChatInputSchema },
  output: { schema: ChatOutputSchema },

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

YÊU CẦU QUAN TRỌNG:
1. LUÔN TRẢ VỀ JSON theo cấu trúc: { "content": "text", "extractedData": { "type": "meal" | "activity", "data": { ... } } | null }.
2. Nếu người dùng bảo họ VỪA ĂN món gì đó (ví dụ: "Tôi vừa ăn bát phở"), hãy đặt type: "meal" và extractedData.data bao gồm: { name, calories, protein, carbs, fat, fiber }.
3. Nếu người dùng bảo họ VỪA TẬP gì đó (ví dụ: "Tôi vừa chạy 5km trong 30p"), hãy đặt type: "activity" và extractedData.data bao gồm: { name, duration (minutes), caloriesBurned }.
4. Nếu không có hành động cụ thể, đặt extractedData là null.
5. Nội dung 'content' trả lời ngắn gọn, chân thành, giàu động lực bằng tiếng {{#if language}}{{language}}{{else}}vi{{/if}}.
6. LUÔN xuống dòng giữa các ý trong 'content' để dễ đọc.

TIN NHẮN NGƯỜI DÙNG:
"{{{message}}}"
`,
});

export async function healthChat(input: ChatInput): Promise<ChatOutput> {
  try {
    const { output } = await healthChatPrompt(input);
    if (!output) return { content: 'AI hiện không phản hồi.', extractedData: null };
    return output;
  } catch (error: any) {
    if (error?.status === 'UNAVAILABLE' || error?.code === 503) {
      console.log('🔄 [Fallback] Model 3.1 Pro is unavailable, switching to 3 Flash...');
      try {
        const { output } = await healthChatPrompt(input, { model: 'googleai/gemini-3-flash-preview' });
        if (!output) return { content: 'AI hiện không phản hồi.', extractedData: null };
        return output;
      } catch (fallbackError) {
        console.error('Fallback Genkit Chat Error:', fallbackError);
        throw new Error('Could not connect to AI services.');
      }
    }
    console.error('Genkit Chat Error Details:', error);
    throw new Error('Could not connect to AI services.');
  }
}
