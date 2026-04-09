# Tổng hợp Chức năng Website HealthSphere

Tài liệu này tổng hợp các chức năng chính của hệ thống HealthSphere và các file mã nguồn tương ứng.

## 1. Xác thực người dùng (Authentication)
*   **Đăng nhập (Login):** [page.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/app/login/page.tsx)
*   **Đăng ký (Signup):** [page.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/app/signup/page.tsx)
*   **Tiện ích Auth:** [utils.ts](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/firebase/auth/utils.ts)

## 2. Bảng điều khiển chính (Dashboard)
*   **Trang tổng quan:** [page.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/app/dashboard/page.tsx)
*   **Thống kê BMI:** [BmiMeter.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/components/dashboard/BmiMeter.tsx)

## 3. Quản lý Dinh dưỡng & Calo (Nutrition Tracking)
*   **Trang Calo:** [page.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/app/dashboard/calories/page.tsx)
*   **Form thêm bữa ăn:** [AddMealForm.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/components/dashboard/AddMealForm.tsx)
*   **Form sửa bữa ăn:** [EditMealForm.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/components/dashboard/EditMealForm.tsx)
*   **Ghi chép bữa ăn qua AI:** [LogMealWithAiDialog.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/components/dashboard/LogMealWithAiDialog.tsx)
*   **Phân tích AI:**
    *   Phân tích text: [analyze-meal-text-flow.ts](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/ai/flows/analyze-meal-text-flow.ts)
    *   Cân bằng dinh dưỡng: [analyze-nutrition-balance-flow.ts](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/ai/flows/analyze-nutrition-balance-flow.ts)
    *   Nhận diện món ăn: [recognize-food-flow.ts](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/ai/flows/recognize-food-flow.ts)

## 4. Theo dõi Hoạt động Thể chất (Activity Tracking)
*   **Trang hoạt động:** [page.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/app/dashboard/activity/page.tsx)
*   **Form thêm hoạt động:** [AddActivityForm.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/components/dashboard/AddActivityForm.tsx)
*   **Form sửa hoạt động:** [EditActivityForm.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/components/dashboard/EditActivityForm.tsx)
*   **Phân tích AI:**
    *   Phân tích text: [analyze-activity-text-flow.ts](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/ai/flows/analyze-activity-text-flow.ts)
    *   Cân bằng hoạt động: [analyze-activity-balance-flow.ts](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/ai/flows/analyze-activity-balance-flow.ts)

## 5. Theo dõi Giấc ngủ (Sleep Tracking)
*   **Trang giấc ngủ:** [page.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/app/dashboard/sleep/page.tsx)
*   **Form thêm giấc ngủ:** [AddSleepForm.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/components/dashboard/AddSleepForm.tsx)
*   **Phân tích chất lượng giấc ngủ AI:** [analyze-sleep-quality-flow.ts](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/ai/flows/analyze-sleep-quality-flow.ts)

## 6. Chỉ số Sức khỏe Hình thể (Physical Health Metrics)
*   **Theo dõi cân nặng:** [AddWeightForm.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/components/dashboard/AddWeightForm.tsx)
*   **Theo dõi Huyết áp:** [AddBloodPressureForm.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/components/dashboard/AddBloodPressureForm.tsx)
*   **Theo dõi Nhịp tim:** [AddHeartRateForm.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/components/dashboard/AddHeartRateForm.tsx)

## 7. Trợ lý AI & Chatbot (AI Assistant)
*   **Luồng xử lý Chat:** [chat-flow.ts](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/ai/flows/chat-flow.ts)
*   **Giao diện Chat:** [AiChatBubble.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/components/dashboard/AiChatBubble.tsx)
*   **Lịch sử chat gợi ý:** 
    *   Hoạt động: [AiActivityChatLog.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/components/dashboard/AiActivityChatLog.tsx)
    *   Bữa ăn: [AiMealChatLog.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/components/dashboard/AiMealChatLog.tsx)

## 8. Khám phá & Tin tức Sức khỏe (Discovery)
*   **Trang khám phá:** [page.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/app/dashboard/discover/page.tsx)
*   **Health Shorts (Tin nhanh/Video):** [HealthShorts.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/components/dashboard/HealthShorts.tsx)
*   **Gợi ý bài viết AI:** [discover-articles-flow.ts](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/ai/flows/discover-articles-flow.ts)

## 9. Cộng đồng & Hồ sơ (Community & Profile)
*   **Cộng đồng (Forums):** `src/app/dashboard/forums`
*   **Trang hồ sơ:** [page.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/app/dashboard/profile/page.tsx)
*   **Chỉnh sửa hồ sơ:** [EditProfileForm.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/components/dashboard/EditProfileForm.tsx)

## 10. Đa ngôn ngữ (Localization)
*   **Tiếng Anh:** [en.json](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/locales/en.json)
*   **Tiếng Việt:** [vi.json](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/locales/vi.json)

---

# Cơ chế hoạt động chi tiết (Technical Insights)

Phần này phân tích sâu hơn về logic kỹ thuật đằng sau các tính năng thông minh của HealthSphere.

## A. Trí tuệ nhân tạo Cá nhân hóa (Deep Context AI)
Hệ thống sử dụng mô hình **Gemini 3 Flash** thông qua framework **Genkit** để cung cấp phản hồi có tính cá nhân hóa cao.
*   **Retrieved Context:** Khi người dùng đặt câu hỏi, hệ thống tự động thu thập:
    *   `userProfile`: Mục tiêu, chỉ số cơ thể hiện tại.
    *   `dailySummary`: Tiến độ Calo nạp/đốt trong ngày thực tế.
    *   `historicalTrends`: Xu hướng cân nặng và hoạt động trong quá khứ.
*   **Logic Phân tích:** AI không chỉ trả lời theo mẫu mà thực hiện so sánh số liệu thực tế với mục tiêu của người dùng để đưa ra lời khuyên "mang tính hành động" (Actionable Advice).

## B. Nhận diện Thực phẩm bằng Computer Vision
Chức năng Log bữa ăn qua AI ([LogMealWithAiDialog.tsx](file:///d%3A/Thanh/HealthSphere/final/finalproject/src/components/dashboard/LogMealWithAiDialog.tsx)) hoạt động theo quy trình:
1.  **Capture:** Thu giữ hình ảnh từ Camera hoặc File upload dưới dạng Base64 (Data URI).
2.  **Vision Analysis:** Gửi image data tới AI flow `recognize-food-flow`. AI thực hiện nhận diện đối tượng (Object Detection) và ước tính hàm lượng calo dựa trên loại thực phẩm.
3.  **Real-time Log:** Dữ liệu sau khi xác nhận sẽ được ghi vào Firebase Cloud Firestore, kích hoạt cập nhật UI tức thì trên Dashboard mà không cần tải lại trang.

## C. Đồng bộ hóa Dữ liệu (Backend Sync)
Hệ thống áp dụng mô hình **Hybrid Backend**:
*   **Firebase:** Dùng cho các thao tác thời gian thực, lưu trữ dữ liệu người dùng, cấu hình và lịch sử nhanh.
*   **Backend API (Render):** Được sử dụng để đồng bộ hóa dữ liệu lâu dài và có thể phục vụ cho các dịch vụ phân tích chuyên sâu khác ngoài Firebase.

## D. Theo dõi Chỉ số Sinh tồn (Medical Vitals)
Các tính năng theo dõi Huyết áp và Nhịp tim mới được thiết kế để mở rộng khả năng giám sát sức khỏe từ "thể hình" (fitness) sang "y tế" (medical), giúp xây dựng hệ sinh thái sức khỏe toàn diện.
