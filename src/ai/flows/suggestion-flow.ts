'use server';
/**
 * @fileOverview Hệ thống tư vấn sức khỏe sử dụng Gemini 2.5 Flash Image (Nano Banana 2).
 * 
 * - getHealthSuggestions - Thực hiện lập kế hoạch và tạo ảnh Base64.
 * - Đã sửa lỗi JSON Mode bằng cách parse thủ công văn bản trả về.
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
  imagePrompt: z.string().describe('Detailed English prompt for high-quality food photography.'),
  imageUrl: z.string().optional(),
});

const ExerciseSuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
  imagePrompt: z.string().describe('Detailed English prompt for high-quality fitness demonstration.'),
  imageUrl: z.string().optional(),
});

const HealthSuggestionResponseSchema = z.object({
  generalTip: z.string(),
  mealSuggestions: z.array(MealSuggestionSchema),
  workoutSuggestion: z.array(ExerciseSuggestionSchema),
});
export type HealthSuggestionResponse = z.infer<typeof HealthSuggestionResponseSchema>;

// --- Đăng ký Prompt với Genkit ---

const healthReasoningPrompt = ai.definePrompt({
  name: 'healthReasoningPrompt',
  model: 'googleai/gemini-2.5-flash-image', 
  input: { schema: HealthSuggestionRequestSchema },
  // Không dùng output schema trực tiếp ở đây vì lỗi JSON Mode
  prompt: `Bạn là một chuyên gia sức khỏe AI cao cấp. 
  Dựa trên dữ liệu thực tế (Harris-Benedict đã được tính sẵn):
  - Mục tiêu: {{{userProfile.goal}}}
  - Chỉ số: {{{userProfile.weight}}}kg, {{{userProfile.height}}}cm, {{{userProfile.age}}}tuổi, Giới tính: {{{userProfile.gender}}}
  - Cường độ vận động: {{{userProfile.activityLevel}}}
  - Tiến độ hôm nay: Nạp {{{dailySummary.caloriesConsumed}}}kcal, Đã đốt tổng cộng {{{dailySummary.caloriesBurned}}}kcal, Ngủ {{{dailySummary.sleepHours}}}h
  
  Nhiệm vụ:
  1. Đưa ra lời khuyên dựa trên lượng calo thực tế. Hãy khuyến khích người dùng nếu họ đang đi đúng hướng.
  2. Đề xuất 3 bữa ăn (Sáng, Trưa, Tối) và 2 bài tập phù hợp nhất với mục tiêu.
  3. Viết nội dung ngắn gọn bằng ngôn ngữ: {{{language}}}.
  4. Viết 'imagePrompt' bằng tiếng Anh cực kỳ chi tiết cho AI tạo ảnh (Ví dụ: "Top-down view of a healthy meal, professional food photography").

  TRẢ VỀ KẾT QUẢ DƯỚI DẠNG MỘT ĐỐI TƯỢNG JSON DUY NHẤT. KHÔNG BAO GỒM CÁC KHỐI MÃ (CODE FENCES) HOẶC VĂN BẢN THỪA.
  Cấu trúc JSON:
  {
    "generalTip": "...",
    "mealSuggestions": [{"name": "...", "recipe": "...", "calories": 0, "imagePrompt": "..."}],
    "workoutSuggestion": [{"name": "...", "description": "...", "imagePrompt": "..."}]
  }`,
});

// --- Hàm Wrapper Server Action ---

export async function getHealthSuggestions(
  input: HealthSuggestionRequest
): Promise<HealthSuggestionResponse> {
  // 1. Phân tích với Gemini 2.5 Flash Image
  const response = await healthReasoningPrompt(input);
  const text = response.text;
  
  let suggestions: HealthSuggestionResponse;
  try {
    // Làm sạch chuỗi JSON nếu AI vô tình thêm markdown
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    suggestions = JSON.parse(cleanJson);
  } catch (e) {
    console.error("Lỗi parse JSON từ AI:", text);
    throw new Error("AI trả về định dạng không hợp lệ. Vui lòng thử lại.");
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
      console.error("Lỗi tạo ảnh bữa ăn:", e);
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
      console.error("Lỗi tạo ảnh bài tập:", e);
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
