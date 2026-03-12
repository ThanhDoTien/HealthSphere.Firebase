'use server';
/**
 * @fileOverview Hệ thống tư vấn sức khỏe kết nối với Backend AI bên ngoài.
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
  token: z.string().optional(),
});
export type HealthSuggestionRequest = z.infer<typeof HealthSuggestionRequestSchema>;

const MealSuggestionSchema = z.object({
  name: z.string(),
  recipe: z.string(),
  calories: z.number(),
  imagePrompt: z.string(),
  imageUrl: z.string().optional(),
});

const ExerciseSuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
  imagePrompt: z.string(),
  imageUrl: z.string().optional(),
});

const HealthSuggestionResponseSchema = z.object({
  generalTip: z.string(),
  mealSuggestions: z.array(MealSuggestionSchema),
  workoutSuggestion: z.array(ExerciseSuggestionSchema),
});
export type HealthSuggestionResponse = z.infer<typeof HealthSuggestionResponseSchema>;

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8080/ai';

export async function getHealthSuggestions(
  input: HealthSuggestionRequest
): Promise<HealthSuggestionResponse> {
  const prompt = `Bạn là một chuyên gia sức khỏe AI cao cấp. 
  Dựa trên dữ liệu thực tế của người dùng:
  - Mục tiêu: ${input.userProfile.goal}
  - Chỉ số: ${input.userProfile.weight}kg, ${input.userProfile.height}cm, ${input.userProfile.age} tuổi, Giới tính: ${input.userProfile.gender}
  - Cường độ vận động: ${input.userProfile.activityLevel || 'moderate'}
  - Tiến độ hôm nay: Đã nạp ${input.dailySummary.caloriesConsumed} kcal, Đã đốt tổng cộng ${input.dailySummary.caloriesBurned} kcal, Đã ngủ ${input.dailySummary.sleepHours}h
  
  Nhiệm vụ của bạn:
  1. Đưa ra 1 lời khuyên (generalTip) cực kỳ chi tiết, tập trung vào việc họ có đang đạt chỉ tiêu calo hôm nay không.
  2. Đề xuất đúng 4 bữa ăn (Sáng, Trưa, Tối, Bữa phụ) phù hợp với mục tiêu ${input.userProfile.goal}, Hướng dẫn cách chế biến và cung cấp thông tin chi tiết về từng món ăn, bao nhiêu gram fat, carb, protein và chất xơ. 
  3. Đề xuất 2-3 bài tập (workoutSuggestion) giúp tối ưu hóa sức khỏe.
  4. Ngôn ngữ phản hồi: ${input.language || 'vi'}.
  5. Đối với 'imagePrompt': Viết bằng tiếng Anh, mô tả cực kỳ chi tiết về món ăn/bài tập theo phong cách nhiếp ảnh chuyên nghiệp (ví dụ: "high-quality food photography of a healthy grilled chicken salad, soft lighting, 4k").

  TRẢ VỀ KẾT QUẢ DƯỚI DẠNG MỘT ĐỐI TƯỢNG JSON DUY NHẤT. KHÔNG BAO GỒM CÁC KHỐI MÃ (CODE FENCES) HOẶC VĂN BẢN THỪA.
  Cấu trúc JSON yêu cầu:
  {
    "generalTip": "Nội dung lời khuyên...",
    "mealSuggestions": [{"name": "Tên món", "recipe": "Cách làm", "calories": 350, "imagePrompt": "Detailed English prompt for Imagen 4"}],
    "workoutSuggestion": [{"name": "Tên bài tập", "description": "Hướng dẫn thực hiện", "imagePrompt": "Detailed English prompt for Imagen 4"}]
  }`;

  try {
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

    const suggestions = await response.json();
    return HealthSuggestionResponseSchema.parse(suggestions);
  } catch (error: any) {
    console.error("Lỗi khi kết nối với Backend AI:", error);
    throw new Error("Không thể kết nối với AI. Vui lòng kiểm tra lại máy chủ hoặc kết nối mạng.");
  }
}
