'use server';
/**
 * @fileOverview Hệ thống tư vấn sức khỏe AI sử dụng Genkit v1.x.
 * 
 * - getHealthSuggestions - Hàm wrapper thực hiện lập kế hoạch và gen ảnh.
 * - Sử dụng Gemini 2.0 Flash để lý luận và Imagen 4 để tạo ảnh chất lượng cao.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// --- Định nghĩa Schemas ---

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
  imagePrompt: z.string().describe('English prompt for food photography.'),
  imageUrl: z.string().optional(),
});

const ExerciseSuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
  imagePrompt: z.string().describe('English prompt for workout demonstration.'),
  imageUrl: z.string().optional(),
});

const HealthSuggestionResponseSchema = z.object({
  generalTip: z.string(),
  mealSuggestions: z.array(MealSuggestionSchema),
  workoutSuggestion: z.array(ExerciseSuggestionSchema),
});
export type HealthSuggestionResponse = z.infer<typeof HealthSuggestionResponseSchema>;

// --- Đăng ký Prompt với Genkit (Ngoài hàm để tránh lỗi render) ---

const healthReasoningPrompt = ai.definePrompt({
  name: 'healthReasoningPrompt',
  model: 'googleai/gemini-2.0-flash-001', // Sử dụng mô hình Flash mới nhất
  input: { schema: HealthSuggestionRequestSchema },
  output: { schema: HealthSuggestionResponseSchema },
  prompt: `Bạn là một chuyên gia sức khỏe AI cao cấp. 
  Dựa trên dữ liệu người dùng:
  - Mục tiêu: {{{userProfile.goal}}}
  - Chỉ số: {{{userProfile.weight}}}kg, {{{userProfile.height}}}cm, {{{userProfile.age}}}tuổi, Giới tính: {{{userProfile.gender}}}
  - Cường độ vận động: {{{userProfile.activityLevel}}}
  - Tiến độ hôm nay: Nạp {{{dailySummary.caloriesConsumed}}}kcal, Đốt {{{dailySummary.caloriesBurned}}}kcal, Ngủ {{{dailySummary.sleepHours}}}h
  
  Nhiệm vụ:
  1. Sử dụng công thức Harris-Benedict chuẩn xác để tính toán TDEE và đưa ra lời khuyên calo thực tế.
  2. Đề xuất 3 bữa ăn (Sáng, Trưa, Tối) và 2 bài tập phù hợp với tình trạng thể lực hiện tại.
  3. Viết nội dung ngắn gọn, súc tích bằng ngôn ngữ: {{{language}}}.
  4. Viết 'imagePrompt' bằng tiếng Anh chi tiết cho Imagen 4 (Ví dụ: "Professional food photography of a healthy avocado toast, cinematic lighting, 8k").`,
});

// --- Hàm Wrapper Server Action ---

export async function getHealthSuggestions(
  input: HealthSuggestionRequest
): Promise<HealthSuggestionResponse> {
  // 1. Phân tích và lập kế hoạch với Gemini 2.0 Flash
  const { output: suggestions } = await healthReasoningPrompt(input);
  
  if (!suggestions) {
    throw new Error("AI không thể tạo ra kế hoạch cho hôm nay.");
  }

  // 2. Tạo hình ảnh minh họa song song bằng Imagen 4 (Base64)
  const mealImagePromises = suggestions.mealSuggestions.map(async (meal) => {
    try {
      const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: meal.imagePrompt,
      });
      return { ...meal, imageUrl: media?.url };
    } catch (e) {
      console.warn(`Lỗi khi tạo ảnh món ăn: ${meal.name}`, e);
      return meal;
    }
  });

  const workoutImagePromises = suggestions.workoutSuggestion.map(async (workout) => {
    try {
      const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: workout.imagePrompt,
      });
      return { ...workout, imageUrl: media?.url };
    } catch (e) {
      console.warn(`Lỗi khi tạo ảnh bài tập: ${workout.name}`, e);
      return workout;
    }
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
