
'use server';
/**
 * @fileOverview Luồng xử lý Chatbot Sức khỏe thông minh.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ChatInputSchema = z.object({
  message: z.string().describe('Tin nhắn mới nhất từ người dùng.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional().describe('Lịch sử cuộc trò chuyện.'),
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
    sleepHours: z.number(),
  }).optional(),
  language: z.string().optional(),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const healthChatPrompt = ai.definePrompt({
  name: 'healthChatPrompt',
  model: 'googleai/gemini-2.0-flash-exp',
  input: { schema: ChatInputSchema },
  prompt: `Bạn là HealthSphere AI - Chuyên gia tư vấn sức khỏe, dinh dưỡng và thể hình cao cấp.

Thông tin người dùng:
{{#if userProfile}}
- Tên: {{userProfile.name}}
- Mục tiêu: {{userProfile.goal}}
- Chỉ số: {{userProfile.weight}}kg, {{userProfile.height}}cm, {{userProfile.age}} tuổi
- Cường độ: {{userProfile.activityLevel}}
{{/if}}

Tiến độ hôm nay:
{{#if dailySummary}}
- Calo nạp: {{dailySummary.caloriesConsumed}} kcal
- Calo đốt: {{dailySummary.caloriesBurned}} kcal
- Ngủ: {{dailySummary.sleepHours}} giờ
{{/if}}

Ngôn ngữ ưu tiên: {{language}}

Nhiệm vụ:
1. Trả lời các thắc mắc về sức khỏe, dinh dưỡng dựa trên dữ liệu thực tế của họ.
2. Đưa ra lời khuyên khoa học, khích lệ và dễ thực hiện.
3. Trả lời ngắn gọn, súc tích nhưng đầy đủ thông tin.

Tin nhắn người dùng: {{message}}`,
});

export async function healthChat(input: ChatInput): Promise<string> {
  try {
    const { text } = await healthChatPrompt(input);
    return text || 'Xin lỗi, tôi gặp chút trục trặc khi xử lý câu hỏi này.';
  } catch (error) {
    console.error('Genkit Chat Error:', error);
    throw new Error('Could not connect to AI services.');
  }
}

