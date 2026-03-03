
'use server';
/**
 * @fileOverview Generates health suggestions and high-quality images using Genkit.
 * 
 * - getHealthSuggestions - A function that orchestrates reasoning and image generation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
  imagePrompt: z.string().describe('Prompt tiếng Anh chi tiết để Imagen 4 gen ảnh món ăn này.'),
  imageUrl: z.string().optional(), // Sẽ được điền sau khi gen ảnh
});

const ExerciseSuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
  imagePrompt: z.string().describe('Prompt tiếng Anh chi tiết để Imagen 4 gen ảnh bài tập này.'),
  imageUrl: z.string().optional(), // Sẽ được điền sau khi gen ảnh
});

const HealthSuggestionResponseSchema = z.object({
  generalTip: z.string(),
  mealSuggestions: z.array(MealSuggestionSchema),
  workoutSuggestion: z.array(ExerciseSuggestionSchema),
});
export type HealthSuggestionResponse = z.infer<typeof HealthSuggestionResponseSchema>;

export async function getHealthSuggestions(
  input: HealthSuggestionRequest
): Promise<HealthSuggestionResponse> {
  // 1. Gửi Prompt lý luận cho Gemini để lấy JSON cấu trúc
  const reasoningPrompt = ai.definePrompt({
    name: 'healthReasoning',
    input: { schema: HealthSuggestionRequestSchema },
    output: { schema: HealthSuggestionResponseSchema },
    prompt: `Bạn là một chuyên gia sức khỏe AI cao cấp. 
    Dựa trên dữ liệu người dùng:
    - Mục tiêu: {{{userProfile.goal}}}
    - Chỉ số: {{{userProfile.weight}}}kg, {{{userProfile.height}}}cm, {{{userProfile.age}}}tuổi, Giới tính: {{{userProfile.gender}}}
    - Cường độ vận động: {{{userProfile.activityLevel}}}
    - Tiến độ hôm nay: Nạp {{{dailySummary.caloriesConsumed}}}kcal, Đốt {{{dailySummary.caloriesBurned}}}kcal, Ngủ {{{dailySummary.sleepHours}}}h
    
    Nhiệm vụ:
    1. Sử dụng công thức Harris-Benedict để tính toán TDEE và đưa ra lời khuyên calo chính xác.
    2. Đề xuất 3 bữa ăn và 2 bài tập phù hợp.
    3. Viết nội dung ngắn gọn (tối đa 2 câu mỗi mục) bằng ngôn ngữ: {{{language}}}.
    4. Đối với mỗi món ăn/bài tập, viết một 'imagePrompt' bằng tiếng Anh cực kỳ chi tiết (ví dụ: "High-quality food photography of a grilled salmon steak with roasted asparagus on a white ceramic plate, soft natural lighting, 4k").`,
  });

  const { output: suggestions } = await reasoningPrompt(input);
  if (!suggestions) throw new Error("AI failed to generate suggestions.");

  // 2. Gen ảnh Base64 bằng Imagen 4 cho từng mục
  // Chúng ta sẽ thực hiện song song để tăng tốc
  const mealImagePromises = suggestions.mealSuggestions.map(async (meal) => {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: meal.imagePrompt,
    });
    return { ...meal, imageUrl: media?.url }; // media.url là data URI (Base64)
  });

  const workoutImagePromises = suggestions.workoutSuggestion.map(async (workout) => {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: workout.imagePrompt,
    });
    return { ...workout, imageUrl: media?.url };
  });

  const [mealResults, workoutResults] = await Promise.all([
    Promise.all(mealImagePromises),
    Promise.all(workoutImagePromises),
  ]);

  return {
    ...suggestions,
    mealSuggestions: mealResults,
    workoutSuggestion: workoutResults,
  };
}
