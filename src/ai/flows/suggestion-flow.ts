'use server';
/**
 * @fileOverview Generates health suggestions by calling an external backend API.
 * 
 * - getHealthSuggestions - A function that proxies the request to the external health AI backend.
 * - HealthSuggestionRequest - The schema for the input data.
 * - HealthSuggestionResponse - The schema for the expected AI suggestions.
 */

import { z } from 'zod';

const HealthSuggestionRequestSchema = z.object({
  userProfile: z.object({
    goal: z.string(),
    weight: z.number(),
    height: z.number(),
    age: z.number(),
    gender: z.string(),
    activityLevel: z.string().optional(),
  }),
  dailySummary: z.object({
    caloriesConsumed: z.number(),
    caloriesBurned: z.number(),
    sleepHours: z.number(),
  }),
  recentActivities: z.array(z.string()),
  language: z.string().optional(),
});
export type HealthSuggestionRequest = z.infer<typeof HealthSuggestionRequestSchema>;

const MealSuggestionSchema = z.object({
  name: z.string(),
  recipe: z.string(),
  calories: z.number(),
  imageUrl: z.string().optional(),
  imageKeyword: z.string().describe('Từ khóa tiếng Anh ngắn để tìm kiếm ảnh (vd: "grilled salmon").'),
});

const ExerciseSuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
  imageUrl: z.string().optional(),
  imageKeyword: z.string().describe('Từ khóa tiếng Anh ngắn để tìm kiếm ảnh (vd: "yoga stretch").'),
});

const HealthSuggestionResponseSchema = z.object({
  mealSuggestions: z.array(MealSuggestionSchema),
  workoutSuggestion: z.array(ExerciseSuggestionSchema),
  generalTip: z.string(),
});
export type HealthSuggestionResponse = z.infer<typeof HealthSuggestionResponseSchema>;

export async function getHealthSuggestions(
  input: HealthSuggestionRequest
): Promise<HealthSuggestionResponse> {
  const prompt = `
    Context:
    User Goal: ${input.userProfile.goal}
    Current Stats: ${input.userProfile.weight}kg, ${input.userProfile.height}cm, ${input.userProfile.age}yo, ${input.userProfile.gender}
    Activity Level: ${input.userProfile.activityLevel || 'moderate'}
    Today's Progress: In: ${input.dailySummary.caloriesConsumed}kcal, Out: ${input.dailySummary.caloriesBurned}kcal, Sleep: ${input.dailySummary.sleepHours}h
    Recent Activities: ${input.recentActivities.join(', ') || 'None'}
    Language: ${input.language || 'en'}

    Task: Cung cấp mẹo sức khỏe, 3 gợi ý bữa ăn và 3 gợi ý bài tập. 
    
    QUY TẮC QUAN TRỌNG:
    1. TÍNH TOÁN CALO: Sử dụng công thức Harris-Benedict để tính BMR và TDEE dựa trên thông số người dùng và Cường độ luyện tập. Gợi ý calo phải phù hợp với mục tiêu (Giảm cân/Tăng cân/Duy trì).
    2. NỘI DUNG: Viết NGẮN GỌN (tối đa 2 câu mỗi mục). Không dùng dấu xuống dòng trong text.
    3. HÌNH ẢNH: 
       - Trả về "imageKeyword" là từ khóa tiếng Anh cực ngắn (2-3 từ).
       - Trả về "imageUrl" theo định dạng: https://pollinations.ai/p/[keyword]?width=800&height=600&model=flux (Thay [keyword] bằng imageKeyword viết liền bằng dấu gạch ngang, ví dụ: "healthy-salad-bowl").
    4. Định dạng trả về duy nhất là JSON:
    {
      "generalTip": "string",
      "mealSuggestions": [{"name": "string", "calories": number, "recipe": "string", "imageKeyword": "string", "imageUrl": "string"}],
      "workoutSuggestion": [{"name": "string", "description": "string", "imageKeyword": "string", "imageUrl": "string"}]
    }
  `;

  try {
    const res = await fetch(
      "https://healthspherebackend--studio-8164753205-5553c.asia-southeast1.hosted.app/ai",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt }),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`Backend error: ${res.status}`);
    }

    const data = await res.json();
    
    let rawResult;
    if (typeof data === 'string') {
      rawResult = JSON.parse(data.replace(/```json|```/g, "").trim());
    } else if (data.message && typeof data.message === 'string') {
      rawResult = JSON.parse(data.message.replace(/```json|```/g, "").trim());
    } else if (data.output && typeof data.output === 'string') {
       rawResult = JSON.parse(data.output.replace(/```json|```/g, "").trim());
    } else if (data.output) {
       rawResult = data.output;
    } else {
      rawResult = data;
    }

    return HealthSuggestionResponseSchema.parse(rawResult);

  } catch (e: any) {
    console.error('AI Proxy Error:', e);
    throw new Error(e.message || 'Failed to generate suggestions.');
  }
}
