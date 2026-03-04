'use server';
/**
 * @fileOverview Hệ thống tư vấn sức khỏe kết nối với Backend AI bên ngoài (Express + Genkit).
 * 
 * VỊ TRÍ CẤU HÌNH BACKEND:
 * - Biến BACKEND_URL bên dưới định nghĩa địa chỉ máy chủ AI của bạn.
 * - Mặc định là http://localhost:8080/ai.
 */

import { z } from 'zod';

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

/**
 * ĐỊA CHỈ BACKEND AI CỦA BẠN
 * Thay đổi giá trị này nếu bạn triển khai backend lên Cloud (như Cloud Run).
 */
const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8080/ai';

/**
 * Hàm gọi API Backend AI bên ngoài.
 */
export async function getHealthSuggestions(
  input: HealthSuggestionRequest
): Promise<HealthSuggestionResponse> {
  // Tạo prompt văn bản chi tiết từ dữ liệu đầu vào để gửi cho Gemini tại Backend
  const prompt = `Bạn là một chuyên gia sức khỏe AI cao cấp. 
  Dựa trên dữ liệu thực tế:
  - Mục tiêu: ${input.userProfile.goal}
  - Chỉ số: ${input.userProfile.weight}kg, ${input.userProfile.height}cm, ${input.userProfile.age}tuổi, Giới tính: ${input.userProfile.gender}
  - Cường độ vận động: ${input.userProfile.activityLevel || 'moderate'}
  - Tiến độ hôm nay: Nạp ${input.dailySummary.caloriesConsumed}kcal, Đã đốt tổng cộng ${input.dailySummary.caloriesBurned}kcal, Ngủ ${input.dailySummary.sleepHours}h
  
  Nhiệm vụ:
  1. Đưa ra lời khuyên dựa trên lượng calo thực tế. Hãy khuyến khích người dùng nếu họ đang đi đúng hướng.
  2. Đề xuất 3 bữa ăn (Sáng, Trưa, Tối) và 2 bài tập phù hợp nhất với mục tiêu.
  3. Viết nội dung ngắn gọn bằng ngôn ngữ: ${input.language || 'vi'}.
  4. Viết 'imagePrompt' bằng tiếng Anh cực kỳ chi tiết cho AI tạo ảnh (Ví dụ: "Top-down view of a healthy meal, professional food photography").

  TRẢ VỀ KẾT QUẢ DƯỚI DẠNG MỘT ĐỐI TƯỢNG JSON DUY NHẤT. KHÔNG BAO GỒM CÁC KHỐI MÃ (CODE FENCES) HOẶC VĂN BẢN THỪA.
  Cấu trúc JSON:
  {
    "generalTip": "...",
    "mealSuggestions": [{"name": "...", "recipe": "...", "calories": 0, "imagePrompt": "..."}],
    "workoutSuggestion": [{"name": "...", "description": "...", "imagePrompt": "..."}]
  }`;

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
      // Không cache để luôn lấy dữ liệu mới nhất
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`AI Backend Error: ${response.status} - ${errorMsg}`);
    }

    const suggestions = await response.json();
    
    // Kiểm chứng dữ liệu trả về với Zod để đảm bảo an toàn cho Server Component
    return HealthSuggestionResponseSchema.parse(suggestions);
  } catch (error) {
    console.error("Lỗi khi kết nối với Backend AI:", error);
    throw new Error("Không thể kết nối với máy chủ AI. Vui lòng kiểm tra lại backend.");
  }
}
