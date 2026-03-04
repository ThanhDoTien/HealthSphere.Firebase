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

## 4. Tối ưu hóa bộ nhớ đệm (Global AI Image Cache)
Để tiết kiệm chi phí GenAI, Backend Express nên được sửa đổi như sau:

### Logic gợi ý cho file backend.js:
```javascript
// 1. Hash cái imagePrompt
const hash = createHash(imagePrompt); 
const fileName = `images/ai/meals/${hash}.png`;
const file = bucket.file(fileName);

// 2. Kiểm tra xem file đã tồn tại chưa
const [exists] = await file.exists();

if (exists) {
  // 3. Nếu có rồi thì trả về URL luôn, không gọi AI nữa
  return `https://storage.googleapis.com/${bucket.name}/${file.name}`;
} else {
  // 4. Nếu chưa có mới gọi Imagen 4 để gen và save
  const imgRes = await ai.generate({ ... });
  // ... save file ...
}
```

## 5. Hướng phát triển
- Tích hợp thiết bị đeo (Apple Health, Google Fit).
- Phân tích chỉ số y tế chuyên sâu (DNA, Xét nghiệm máu).
