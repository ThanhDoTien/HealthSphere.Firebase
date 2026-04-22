// ==========================================
// FILE: src/ai/flows/suggestion-flow.ts
// MỤC ĐÍCH: Hệ thống Tư vấn Sức khỏe Tổng hợp (Health Suggestion System)
// TỔNG QUAN: Gửi toàn bộ dữ liệu sức khỏe trong ngày (calo nạp/đốt, giấc ngủ,
// hoạt động) tới Backend AI bên ngoài để nhận lời khuyên tổng quan,
// gợi ý 4 bữa ăn phù hợp và 2-3 bài tập thể dục cá nhân hóa.
// ==========================================

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
    baseBurned: z.number(),
    exerciseBurned: z.number(),
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
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  fiber: z.number().optional(),
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

const BACKEND_URL = process.env.BACKEND_API_URL || 'https://healthspherebackend--studio-8164753205-5553c.asia-southeast1.hosted.app/ai';

export async function getHealthSuggestions(
  input: HealthSuggestionRequest
): Promise<HealthSuggestionResponse> {
  const prompt = `Bạn là một chuyên gia sức khỏe AI cao cấp. 
  Dựa trên dữ liệu thực tế và tiến độ hiện tại của người dùng:
  - Mục tiêu: ${input.userProfile.goal}
  - Chỉ số cơ thể: ${input.userProfile.weight}kg, ${input.userProfile.height}cm, ${input.userProfile.age} tuổi, Giới tính: ${input.userProfile.gender}
  - Mức độ hoạt động cơ bản (Mục tiêu): ${input.userProfile.activityLevel || 'moderate'}
  
  - TIẾN ĐỘ THỰC TẾ HÔM NAY:
    + Đã nạp: ${input.dailySummary.caloriesConsumed} kcal
    + Tổng tiêu thụ: ${input.dailySummary.caloriesBurned} kcal
    + TRONG ĐÓ: Tiêu thụ nền (TDEE): ${input.dailySummary.baseBurned} kcal và Tiêu thụ qua vận động: ${input.dailySummary.exerciseBurned} kcal.
    + Đã ngủ: ${input.dailySummary.sleepHours}h
  
  Nhiệm vụ của bạn:
  1. Đưa ra 1 lời khuyên (generalTip) cụ thể dựa trên TIẾN ĐỘ THỰC TẾ. 
     ĐẶC BIỆT: Phân tích sự cân bằng giữa Calo nạp vào và 2 loại Calo tiêu thụ. 
     - Nếu 'Tiêu thụ qua vận động' (exerciseBurned) thấp so với mục tiêu, hãy nhắc nhở họ tập luyện thêm.
     - Nếu 'Tiêu thụ qua vận động' cao nhưng 'Đã nạp' (caloriesConsumed) thấp, hãy nhắc họ ăn bổ sung để phục hồi.
  QUAN TRỌNG: Hãy sử dụng ký tự xuống dòng (\\n) để phân tách các ý trong 'generalTip', 'recipe' và 'description'. Sau mỗi ý hoặc mỗi bước, HÃY XUỐNG DÒNG.
  
  2. Đề xuất đúng 4 bữa ăn (Sáng, Trưa, Tối, Bữa phụ) phù hợp. Ghi rõ chỉ số dinh dưỡng cho mỗi món (protein, carbs, fat, fiber - tính bằng gram).
  3. Đề Xuất 2-3 bài tập phù hợp.
  4. Đối với 'recipe' , 'workoutSuggestion' và 'description', trình bày theo từng bước và sử dụng \\n sau mỗi bước.
  5. Ngôn ngữ phản hồi: ${input.language || 'vi'}.
  6. Đối với 'imagePrompt': Viết bằng tiếng Anh, mô tả chi tiết.
 
  TRẢ VỀ KẾT QUẢ DƯỚI DẠNG MỘT ĐỐI TƯỢNG JSON DUY NHẤT. KHÔNG BAO GỒM CÁC KHỐI MÃ (CODE FENCES).
  {
    "generalTip": "Nội dung lời khuyên...\\nÝ tiếp theo...",
    "mealSuggestions": [{"name": "Tên món", "recipe": "Bước 1...\\nBước 2...", "calories": 350, "protein": 25, "carbs": 40, "fat": 10, "fiber": 5, "imagePrompt": "..."}],
    "workoutSuggestion": [{"name": "Tên bài tập", "description": "Hướng dẫn...\\n- Bước...\\n- Bước...", "imagePrompt": "..."}]
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
      signal: AbortSignal.timeout(60000),
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
