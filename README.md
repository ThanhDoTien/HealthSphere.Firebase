# HealthSphere - AI-Powered Health & Nutrition Companion

## 1. Tổng quan về đề tài
HealthSphere là một hệ sinh thái chăm sóc sức khỏe cá nhân thông minh, giúp người dùng theo dõi chỉ số cơ thể, dinh dưỡng, vận động và nhận tư vấn cá nhân hóa từ AI.

## 2. Phân tích thiết kế hệ thống
- **Dữ liệu:** Sử dụng Firestore với cấu trúc Sub-collections (`weights`, `meals`, `activities`, `sleep`, `forums`).
- **Bảo mật:** Firebase Security Rules phân quyền theo User ID.
- **Giao diện:** Modern UI với ShadCN, Tailwind CSS, hỗ trợ đa ngôn ngữ (EN/VI).

## 3. Xây dựng và triển khai
- **Frontend:** Next.js 14 (App Router) triển khai trên **Firebase Hosting**.
- **Backend AI:** Node.js Express Server độc lập xử lý GenAI.
- **GenAI Engine:**
    - **Google Genkit:** Điều phối Flows.
    - **Gemini 2.5 Flash Image (Nano Banana 2):** Tư vấn sức khỏe, tính calo Harris-Benedict & Nhận diện thực phẩm.
    - **Imagen 4:** Tạo ảnh minh họa bữa ăn/bài tập chuyên nghiệp.
- **Lưu trữ:** Firebase Storage cho hình ảnh AI & Người dùng.
- **Link ứng dụng:** [https://studio--studio-8164753205-5553c.us-central1.hosted.app/dashboard](https://studio--studio-8164753205-5553c.us-central1.hosted.app/dashboard)

## 4. Kết quả đạt được
- Tự động hóa tính calo qua ảnh (AI Food Recognition).
- Gợi ý kế hoạch sức khỏe cá nhân hóa hàng ngày kèm hình ảnh trực quan.
- Biểu đồ theo dõi tiến trình (Weight, Calories) sinh động.
- Diễn đàn cộng đồng tương tác thời gian thực.

## 5. Hướng phát triển
- Tích hợp thiết bị đeo (Apple Health, Google Fit).
- Phân tích chỉ số y tế chuyên sâu (DNA, Xét nghiệm máu).
