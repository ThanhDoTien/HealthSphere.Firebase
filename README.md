
# HealthSphere - AI-Powered Health & Nutrition Companion

## 1. Tổng quan về đề tài
HealthSphere là một hệ sinh thái chăm sóc sức khỏe cá nhân thông minh, giúp người dùng theo dõi chỉ số cơ thể, dinh dưỡng, vận động và nhận tư vấn cá nhân hóa từ AI.

## 2. Phân tích thiết kế hệ thống
- **Dữ liệu:** Sử dụng Firestore với cấu trúc Sub-collections (`weights`, `meals`, `activities`, `sleep`, `todaysuggestions`).
- **Bảo mật:** Firebase Security Rules phân quyền: Thư mục `users/{id}` là riêng tư, thư mục `images/` là công khai dùng chung.
- **Giao diện:** Modern UI với ShadCN, Tailwind CSS, hỗ trợ đa ngôn ngữ (EN/VI).

## 3. Xây dựng và triển khai
- **Frontend:** Next.js 14 (App Router) triển khai trên **Firebase Hosting**.
- **Backend AI (External):** Node.js Express Server xử lý GenAI (Gemini + Imagen).
- **Link ứng dụng:** [https://studio--studio-8164753205-5553c.us-central1.hosted.app/dashboard](https://studio--studio-8164753205-5553c.us-central1.hosted.app/dashboard)

## 4. Sửa lỗi Backend (Quan trọng)
Nếu bạn gặp lỗi `m.content.find is not a function` ở Backend Express, hãy sửa lại đoạn code xử lý phản hồi Genkit 1.x như sau:

```javascript
// TRONG FILE backend.js CỦA BẠN
const response = await ai.generate({ ... });

// CÁCH 1: Nếu bạn dùng Structured Output (khuyên dùng)
const suggestions = response.output; // Đây trực tiếp là object JSON

// CÁCH 2: Nếu bạn dùng Text và JSON.parse (nếu CÁCH 1 không được)
const suggestions = JSON.parse(response.text);

// LỖI 'find' THƯỜNG DO BẠN GỌI:
// const data = response.content.find(...) -> SAI
// ĐÚNG PHẢI LÀ:
// const data = response.message.content.find(...) -> NHƯNG NÊN DÙNG .output HOẶC .text CHO NHANH
```

## 5. Tối ưu hóa bộ nhớ đệm (Global AI Image Cache)
```javascript
const hash = createHash(imagePrompt); 
const fileName = `images/ai/meals/${hash}.png`;
// ... kiểm tra file tồn tại trong Storage trước khi gen mới ...
```
