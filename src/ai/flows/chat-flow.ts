'use server';
/**
 * @fileOverview Luồng xử lý Chatbot Sức khỏe thông minh.
 */

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
  token: z.string().optional(),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8080/ai/chat';

export async function healthChat(input: ChatInput): Promise<string> {
  try {

    const historyText =
      input.history
        ?.map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
        .join('\n') || '';

    const prompt = `
Bạn là HealthSphere AI - Chuyên gia tư vấn sức khỏe và dinh dưỡng.

Thông tin người dùng:
${input.userProfile ? `
Tên: ${input.userProfile.name}
Mục tiêu: ${input.userProfile.goal}
Chỉ số: ${input.userProfile.weight}kg, ${input.userProfile.height}cm, ${input.userProfile.age} tuổi
Cường độ vận động: ${input.userProfile.activityLevel}
` : ''}

Tiến độ hôm nay:
${input.dailySummary ? `
Calo nạp: ${input.dailySummary.caloriesConsumed} kcal
Calo đốt: ${input.dailySummary.caloriesBurned} kcal
Ngủ: ${input.dailySummary.sleepHours} giờ
` : ''}

Lịch sử trò chuyện:
${historyText}

Tin nhắn mới của người dùng:
${input.message}

Yêu cầu:
- Trả lời ngắn gọn
- Đưa lời khuyên sức khỏe khoa học
- Ngôn ngữ: ${input.language || 'vi'}
`;

    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': input.token ? `Bearer ${input.token}` : '',
      },
      body: JSON.stringify({ prompt }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`AI Backend Error: ${response.status} - ${errorMsg}`);
    }

    const data = await response.json();

    // backend có thể trả {text: "..."} hoặc {response: "..."}
    return data.text || data.response || "AI không trả lời.";

  } catch (error: any) {
    console.error("Chatbot AI Error:", error);
  
    return `AI ERROR:
  ${error?.message || error}
  
  Stack:
  ${error?.stack || "no stack"}`;
  }
}