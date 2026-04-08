# CHƯƠNG 4: CÀI ĐẶT VÀ THUẬT TOÁN TƯ VẤN

## 4.1. Công nghệ sử dụng
Hệ thống HealthSphere được xây dựng dựa trên các công nghệ hiện đại nhất để đảm bảo hiệu năng và độ tin cậy:
- **Framework & Ngôn ngữ:** Next.js 14 (App Router) kết hợp TypeScript.
- **Giao diện (UI/UX):** Tailwind CSS và bộ thư viện ShadCN UI mang lại giao diện cao cấp (Premium).
- **Trí tuệ nhân tạo (AI):** 
    - **Google Gemini 3 Flash Preview:** Dùng cho phân tích dữ liệu, reasoning và tư vấn văn bản chuyên sâu.
    - **Gemini 1.5 Flash (REST API):** Dùng để minh họa hình ảnh thực tế thông qua các luồng API tự động.
- **Cơ sở hạ tầng Cloud (Firebase):** 
    - **Authentication:** Quản lý truy cập an toàn.
    - **Firestore:** Lưu trữ dữ liệu thời gian thực (Real-time).
    - **Storage:** Lưu trữ bộ nhớ đệm hình ảnh (Shared Cache).

## 4.2. Cài đặt các chức năng chính

### 4.2.1. Cài đặt đăng ký / đăng nhập
Hệ thống triển khai xác thực người dùng thông qua **Firebase Authentication**. 
- **Quy trình:** Người dùng cung cấp Email và Mật khẩu -> Firebase SDK thực hiện xác thực và trả về Token (JWT).
- **Bảo mật:** Sử dụng cơ chế `onAuthStateChanged` để bảo vệ các tuyến (Routes) Dashboard, tự động chuyển hướng khi người dùng chưa đăng nhập.

### 4.2.2. Xây dựng API (AI Route Handlers)
Sử dụng các Route Handlers của Next.js để xây dựng cầu nối với AI:
- **Xử lý bất đồng bộ:** Tích hợp `AbortController` để quản lý thời gian chờ (Timeout 60s).
- **Cơ chế Retry (Tự động thử lại):** Khi gặp lỗi 503 (quá tải từ Google), hệ thống tự động thử lại 3 lần với trễ ngẫu nhiên (Exponential Backoff).
- **Lưu trữ Caching:** Áp dụng thuật toán băm (Hashing) chuỗi Prompt để lưu và truy xuất ảnh từ Storage, giúp tiết kiệm chi phí và tăng tốc độ tối đa.

### 4.2.3. Xử lý dữ liệu Calo (Meals & Calories)
Dữ liệu dinh dưỡng được quản lý qua Firestore Sub-collections (`meals`):
- **Phân tích:** Mỗi món ăn nạp vào đều được lưu trữ các chỉ số: Năng lượng (kcal), Carbs, Protein và Chất béo.
- **Tổng hợp:** Hệ thống tự động truy vấn tổng calo nạp vào trong ngày hôm nay bằng cách sử dụng các toán tử lọc (Where clause) của Firestore.

### 4.2.4. Lưu dữ liệu cân nặng (Weight Tracking)
Lịch sử cân nặng được lưu trữ trong Sub-collection `weights`:
- **Tính năng:** Người dùng cập nhật cân nặng hàng ngày.
- **Biểu diễn:** Dữ liệu được truy xuất theo thứ tự thời gian (`orderBy('date', 'desc')`) và hiển thị dưới dạng biểu đồ đường (Line Chart) sinh động bằng thư viện Recharts.

## 4.3. Thuật toán tư vấn sức khỏe cá nhân hóa

Hệ thống sử dụng các giải thuật y học tiêu chuẩn để phân tích thể trạng và nhu cầu năng lượng của người dùng, làm cơ sở cho các gợi ý AI.

### 4.3.1. Thuật toán tính chỉ số khối cơ thể (BMI)
Chỉ số BMI (Body Mass Index) giúp đánh giá nhanh tình trạng cân nặng của người dùng:
- **Công thức:**
$$BMI = \frac{Trọng lượng (kg)}{Chiều cao (m) \times Chiều cao (m)}$$
- **Phân loại trạng thái sức khỏe:**
    - **Gầy (Underweight):** BMI < 18.5
    - **Bình thường (Normal):** 18.5 ≤ BMI < 25.0
    - **Thừa cân (Overweight):** 25.0 ≤ BMI < 30.0
    - **Béo phì (Obese):** BMI ≥ 30.0

### 4.3.2. Công thức tính tỷ lệ trao đổi chất cơ bản (BMR)
Hệ thống áp dụng công thức **Harris-Benedict cải tiến** (Roza and Shizgal, 1984) để tính năng lượng cơ bản cơ thể cần:
- **Đối với Nam giới:**
$$BMR = 88.362 + (13.397 \times W) + (4.799 \times H) - (5.677 \times A)$$
- **Đối với Nữ giới:**
$$BMR = 447.593 + (9.247 \times W) + (3.098 \times H) - (4.330 \times A)$$
*(Trong đó: W: Trọng lượng (kg), H: Chiều cao (cm), A: Tuổi)*

### 4.3.3. Tính tổng năng lượng tiêu hao hàng ngày (TDEE)
TDEE giúp xác định tổng calo cần thiết dựa trên cường độ vận động thực tế:
- **Công thức:**
$$TDEE = BMR \times PAL$$
*(Trong đó: PAL - Physical Activity Level là hệ số hoạt động thể chất)*

- **Bảng hệ số PAL được áp dụng trong hệ thống:**

| Mức độ vận động | Hệ số PAL | Mô tả |
| :--- | :---: | :--- |
| **Sedentary** | 1.2 | Ít vận động, chỉ làm việc văn phòng |
| **Light** | 1.375 | Vận động nhẹ (Tập thể dục 1-3 ngày/tuần) |
| **Moderate** | 1.55 | Vận động vừa (Tập thể dục 3-5 ngày/tuần) |
| **Active** | 1.725 | Vận động mạnh (Tập thể thao 6-7 ngày/tuần) |
| **Extra** | 1.9 | Vận động cực mạnh (Lao động nặng, VĐV) |

### 4.3.4. Thuật toán gợi ý thông minh (AI Reasoning)
Dựa trên các chỉ số **BMI**, **TDEE** và **Mục tiêu cá nhân** (Giảm cân/Duy trì/Tăng cân), hệ thống thực hiện Logic:
1. **Phân tích khoảng cách năng lượng:** AI tính toán sự chênh lệch giữa Calo nạp vào thực tế và TDEE mục tiêu.
2. **Gợi ý thực đơn (Meal Suggestions):** Lựa chọn món ăn đảm bảo phân bổ tỷ lệ: Carbs (50-60%), Protein (20-25%), Fats (20-25%).
3. **Gợi ý tập luyện (Workout Suggestion):** Đề xuất các bài tập đốt cháy calo dựa trên chỉ số BMI hiện tại (ưu tiên Cardio cho BMI cao, ưu tiên Yoga/Streching cho BMI thấp hoặc trung bình).

### 4.2.5. Cơ chế lưu trữ bền vững gợi ý AI (Persistence)
Nhằm cải thiện trải nghiệm và tối ưu hóa tài nguyên, hệ thống triển khai cơ chế kiểm tra trạng thái trước khi gọi AI:
- **Loading Guards:** Sử dụng trạng thái `suggestionLoading` để đồng bộ với Firestore. AI chỉ được kích hoạt nếu dữ liệu trong ngày hôm nay chưa tồn tại hoặc bị lỗi.
- **Race-condition Prevention:** Đảm bảo các tiến trình không ghi đè dữ liệu lẫn nhau khi người dùng chuyển đổi trang nhanh hoặc tải lại trang liên tục.

### 4.2.6. Xử lý đa ngôn ngữ và bản địa hóa (i18n)
Hệ thống hỗ trợ hoàn toàn tiếng Việt (VI) và tiếng Anh (EN):
- **Cấu trúc:** Sử dụng các tệp JSON tập trung để quản lý toàn bộ nhãn (Labels), thông báo và nội dung giao diện.
- **Logic:** Context Provider (`LanguageContext`) quản lý trạng thái ngôn ngữ toàn cục, cho phép thay đổi tức thì mà không cần tải lại trình duyệt.
