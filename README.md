
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
- **Link ứng dụng:** [https://studio--studio-8164753205-5553c.us-central1.hosted.app/dashboard](https://studio--studio-8164753205-5553c.us-central1.hosted.app/dashboard)

## 4. Sửa lỗi Backend (LỖI 500: m.content.find)
Nếu bạn gặp lỗi `m.content.find is not a function` ở Backend Express, nguyên nhân là do Genkit 1.x đã thay đổi cấu trúc phản hồi. Hãy sửa lại code Backend của bạn như sau:

```javascript
// TRONG FILE backend.js CỦA BẠN
const response = await ai.generate({ ... });

// CÁCH ĐÚNG CHO GENKIT 1.x:
// 1. Lấy dữ liệu đã parse sẵn (nếu bạn dùng responseSchema)
const suggestions = response.output; 

// 2. HOẶC lấy văn bản thô
const text = response.text;

// ĐỪNG DÙNG: response.content.find(...) -> LỖI NÀY DO BẠN ĐANG DÙNG CÚ PHÁP CŨ
```

## 5. Tối ưu hóa bộ nhớ đệm (Global AI Image Cache)
Hình ảnh AI tạo ra được lưu vào thư mục `images/ai/` với tên file là mã băm (hash) của Prompt. Điều này giúp tiết kiệm tài nguyên khi nhiều người dùng cùng nhận được một gợi ý tương tự.
