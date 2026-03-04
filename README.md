
# HealthSphere - AI-Powered Health & Nutrition Companion

## 1. Tổng quan về đề tài
HealthSphere là một hệ sinh thái chăm sóc sức khỏe cá nhân thông minh, giúp người dùng theo dõi chỉ số cơ thể, dinh dưỡng, vận động và nhận tư vấn cá nhân hóa từ AI.

## 2. Phân tích thiết kế hệ thống
- **Dữ liệu:** Sử dụng Firestore với cấu trúc Sub-collections (`weights`, `meals`, `activities`, `sleep`, `todaysuggestions`).
- **Bảo mật:** Firebase Security Rules phân quyền: Thư mục `users/{id}` là riêng tư, thư mục `images/` là công khai dùng chung cho bộ nhớ đệm AI.
- **Giao diện:** Modern UI với ShadCN, Tailwind CSS, hỗ trợ đa ngôn ngữ (EN/VI).

## 3. Xây dựng và triển khai
- **Frontend:** Next.js 14 (App Router) triển khai trên **Firebase Hosting**.
- **Backend AI (External):** Node.js Express Server xử lý GenAI (Gemini + Imagen).

## 4. Hướng dẫn sửa lỗi Backend (Imagen 4 & Shared Cache)
Hãy cập nhật tệp `backend.js` của bạn với cấu trúc sau để hoạt động với Imagen 4 và hỗ trợ logic thư mục chung:

```javascript
// TRONG FILE backend.js CỦA BẠN
const { genkit } = require('genkit');
const { googleAI } = require('@genkit-ai/google-genai');

const ai = genkit({
  plugins: [googleAI()],
});

app.post('/ai', async (req, res) => {
  const { prompt } = req.body;

  try {
    // 1. Tạo gợi ý văn bản (Bữa ăn, Bài tập, Image Prompts)
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash', // Hoặc model bạn đang dùng
      prompt: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const suggestions = response.output;

    // 2. Tạo hình ảnh bằng Imagen 4 cho từng gợi ý
    // Lưu ý: Frontend sẽ đảm nhận việc lưu vào thư mục chung dựa trên imagePrompt
    for (let meal of suggestions.mealSuggestions) {
      const imageResult = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: meal.imagePrompt,
      });
      // Trả về data URI để Frontend xử lý cache vào Storage chung
      meal.imageUrl = imageResult.media.url; 
    }

    for (let workout of suggestions.workoutSuggestion) {
      const imageResult = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: workout.imagePrompt,
      });
      workout.imageUrl = imageResult.media.url;
    }

    res.json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
```

## 5. Tối ưu hóa bộ nhớ đệm (Global AI Image Cache)
Hình ảnh AI tạo ra được lưu vào thư mục `images/ai/` với tên file là mã băm (hash) của Prompt. 
- **Quy trình:** Frontend nhận ảnh (base64) -> Kiểm tra mã Hash trong Storage chung -> Nếu có ảnh rồi thì dùng URL cũ -> Nếu chưa có thì upload mới.
- **Lợi ích:** Tiết kiệm chi phí GenAI và dung lượng Storage.
