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
    sleepHours: z.number(),
  }).optional(),
  language: z.string().optional(),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const healthChatPrompt = ai.definePrompt({
  name: 'healthChatPrompt',
  model: 'googleai/gemini-3-flash-preview',
  input: { schema: ChatInputSchema },

  prompt: `
Bạn là HealthSphere AI - chuyên gia tư vấn sức khỏe.

Thông tin người dùng:
{{#if userProfile}}
Tên: {{userProfile.name}}
Mục tiêu: {{userProfile.goal}}
Cân nặng: {{userProfile.weight}} kg
Chiều cao: {{userProfile.height}} cm
Tuổi: {{userProfile.age}}
{{/if}}

Tiến độ hôm nay:
{{#if dailySummary}}
Calo nạp: {{dailySummary.caloriesConsumed}}
Calo đốt: {{dailySummary.caloriesBurned}}
Ngủ: {{dailySummary.sleepHours}} giờ
{{/if}}

Lịch sử hội thoại:
{{#each history}}
{{this.role}}: {{this.content}}
{{/each}}

Tin nhắn người dùng:
{{message}}

Trả lời ngắn gọn, dễ hiểu, xuống dòng giữa các ý.
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