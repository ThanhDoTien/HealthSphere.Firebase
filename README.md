
# HealthSphere - AI-Powered Health & Nutrition Companion

## 1. Tổng quan về đề tài
HealthSphere là một hệ sinh thái chăm sóc sức khỏe cá nhân thông minh, giúp người dùng theo dõi chỉ số cơ thể, dinh dưỡng, vận động và nhận tư vấn cá nhân hóa từ AI.

## 2. Phân tích thiết kế hệ thống
- **Dữ liệu:** Sử dụng Firestore với cấu trúc Sub-collections (`weights`, `meals`, `activities`, `sleep`, `todaysuggestions`).
- **Bảo mật:** Firebase Security Rules phân quyền: Thư mục `users/{id}` là riêng tư, thư mục `images/` là công khai dùng chung cho bộ nhớ đệm AI.
- **Giao diện:** Modern UI với ShadCN, Tailwind CSS, hỗ trợ đa ngôn ngữ (EN/VI).

## 3. Xây dựng và triển khai (Backend AI)
Hãy cập nhật tệp `backend.js` của bạn với cấu trúc Genkit 1.x sau đây để hoạt động với Imagen 4:

```javascript
const { genkit } = require('genkit');
const { googleAI } = require('@genkit-ai/google-genai');
const express = require('express');
const cors = require('cors');

const ai = genkit({
  plugins: [googleAI()], // Đảm bảo đã set GEMINI_API_KEY trong môi trường
});

const app = express();
app.use(cors());
app.use(express.json());

app.post('/ai', async (req, res) => {
  const { prompt } = req.body;

  try {
    // 1. Tạo gợi ý văn bản (Bữa ăn, Bài tập) bằng Gemini 1.5 Flash
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: prompt,
      config: { responseMimeType: 'application/json' }
    });

    // Genkit 1.x: Kết quả JSON nằm trong response.output
    const suggestions = response.output;

    // 2. Tạo hình ảnh bằng Imagen 4 cho từng gợi ý
    // Frontend sẽ xử lý việc lưu vào thư mục chung dựa trên imagePrompt
    if (suggestions.mealSuggestions) {
      for (let meal of suggestions.mealSuggestions) {
        const imageResult = await ai.generate({
          model: 'googleai/imagen-4.0-fast-generate-001',
          prompt: meal.imagePrompt,
        });
        // Trả về data URI (base64)
        meal.imageUrl = imageResult.media.url; 
      }
    }

    if (suggestions.workoutSuggestion) {
      for (let workout of suggestions.workoutSuggestion) {
        const imageResult = await ai.generate({
          model: 'googleai/imagen-4.0-fast-generate-001',
          prompt: workout.imagePrompt,
        });
        workout.imageUrl = imageResult.media.url;
      }
    }

    res.json(suggestions);
  } catch (error) {
    console.error("Lỗi Backend:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(8080, () => console.log('AI Backend running on port 8080'));
```

## 4. Tối ưu hóa bộ nhớ đệm (Global AI Image Cache)
Hình ảnh AI tạo ra được lưu vào thư mục `images/ai/` với tên file là mã băm (hash) của Prompt. 
- **Quy trình:** Frontend nhận ảnh (base64) -> Kiểm tra mã Hash trong Storage chung -> Nếu có ảnh rồi thì dùng URL cũ -> Nếu chưa có thì upload mới.
- **Lợi ích:** Tiết kiệm chi phí GenAI và dung lượng Storage cho tất cả người dùng.
