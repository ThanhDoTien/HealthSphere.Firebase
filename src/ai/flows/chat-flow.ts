
'use server';
/**
 * @fileOverview Luồng xử lý Chatbot Sức khỏe thông minh.
 *
 * - healthChat - Hàm xử lý hội thoại AI.
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

export async function healthChat(input: ChatInput): Promise<string> {
  const prompt = ai.definePrompt({
    name: 'healthChatPrompt',
    input: { schema: ChatInputSchema },
    prompt: `Bạn là HealthSphere AI - Chuyên gia tư vấn sức khỏe, dinh dưỡng và thể hình cao cấp.

Thông tin người dùng:
- Tên: {{userProfile.name}}
- Mục tiêu: {{userProfile.goal}}
- Chỉ số: {{userProfile.weight}}kg, {{userProfile.height}}cm, {{userProfile.age}} tuổi
- Cường độ: {{userProfile.activityLevel}}

Tiến độ hôm nay:
- Calo nạp: {{dailySummary.caloriesConsumed}} kcal
- Calo đốt: {{dailySummary.caloriesBurned}} kcal
- Ngủ: {{dailySummary.sleepHours}} giờ

Ngôn ngữ ưu tiên: {{language}}

Nhiệm vụ:
1. Trả lời các thắc mắc của người dùng về sức khỏe dựa trên dữ liệu thực tế của họ.
2. Đưa ra các lời khuyên mang tính khích lệ, khoa học và dễ thực hiện.
3. Nếu người dùng hỏi ngoài lĩnh vực sức khỏe, hãy khéo léo đưa cuộc trò chuyện trở lại chủ đề chính.

Tin nhắn người dùng: {{message}}`,
  });

  const { text } = await prompt(input);
  return text || 'Xin lỗi, tôi gặp chút trục trặc khi xử lý câu hỏi này.';
}
