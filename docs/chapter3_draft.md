# CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

## 3.1. Kiến trúc tổng thể hệ thống

Hệ thống được thiết kế theo mô hình **Client-Server** hiện đại, đảm bảo tính tách biệt giữa giao diện người dùng và xử lý dữ liệu tập trung trên nền tảng đám mây.

### 3.1.1. Mô hình Client – Server
- **Client:** Xây dựng bằng React/Next.js 14, đóng vai trò tiếp nhận tương tác của người dùng, hiển thị dữ liệu và gửi yêu cầu (Requests) đến hệ thống.
- **Server:** Sử dụng hạ tầng Firebase (Baas - Backend as a Service) và các **Middleware API chuyên biệt** được triển khai trên môi trường Google Hosted ổn định cao để xử lý Logic nghiệp vụ, xác thực người dùng và đồng bộ dữ liệu.

### 3.1.2. Kiến trúc 3 tầng (3-layer Architecture)
Để đảm bảo tính linh hoạt và dễ bảo trì, hệ thống được chia thành 3 tầng logic:
1. **Tầng Trình diễn (Presentation Layer):** Bao gồm giao diện Dashboard đa làn, các Form nhập liệu nổi (Dialog) và hệ thống Chat AI tích hợp. Sử dụng Tailwind CSS với các hiệu ứng `backdrop-blur` và `animate-in` để tạo cảm giác cao cấp.
2. **Tầng Nghiệp vụ (Business Logic Layer):** Chứa các luồng (Flows) xử lý thông minh như: 
    - Tính toán BMR/TDEE theo chuẩn y khoa.
    - AI Reasoning (Gemini) để đưa ra gợi ý sức khỏe thời gian thực.
    - Thuật toán băm (Hashing) và Caching dữ liệu để tối ưu hiệu suất.
3. **Tầng Dữ liệu (Data Layer):** Chịu trách nhiệm lưu trữ và truy xuất dữ liệu từ Firebase Firestore và Firebase Storage, sử dụng các Sub-collections để quản lý nhật ký chi tiết.


#### Bảng 1: Users (Thông tin người dùng)
| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :---: | :---: | :--- |
| **uid** | string | **Khóa chính** | Mã định danh duy nhất từ Firebase Auth |
| **email** | string | Unique | Địa chỉ email người dùng |
| **name** | string | - | Tên hiển thị |
| **height** | number | > 0 | Chiều cao (cm) |
| **weight** | number | > 0 | Cân nặng ban đầu (kg) |
| **gender** | string | male/female | Giới tính |
| **goal** | string | - | Mục tiêu (Giảm cân, tăng cơ,...) |

#### Bảng 2: Meal_logs (Nhật ký bữa ăn)
| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :---: | :---: | :--- |
| **id** | string | **Khóa chính** | ID tài liệu tự động |
| **userId** | string | **Khóa ngoại** | Liên kết với Users(uid) |
| **name** | string | Not null | Tên món ăn |
| **calories** | number | Not null | Lượng calo nạp vào |
| **date** | string | Index | Ngày ghi nhận (YYYY-MM-DD) |

#### Bảng 3: Weight_logs (Nhật ký cân nặng)
| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :---: | :---: | :--- |
| **id** | string | **Khóa chính** | ID tài liệu tự động |
| **userId** | string | **Khóa ngoại** | Liên kết với Users(uid) |
| **weight** | number | Not null | Cân nặng ghi nhận (kg) |
| **date** | string | Index | Ngày ghi nhận |

#### Bảng 4: Activity_logs (Nhật ký tập luyện)
| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :---: | :---: | :--- |
| **id** | string | **Khóa chính** | ID tài liệu tự động |
| **userId** | string | **Khóa ngoại** | Liên kết với Users(uid) |
| **activityName** | string | Not null | Tên bài tập |
| **caloriesBurned** | number | Not null | Calo tiêu thụ |

#### Bảng 5: Today_Suggestions (Gợi ý AI hàng ngày)
| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :---: | :---: | :--- |
| **userId** | string | **Khóa chính (Sub)** | Liên kết với Users(uid) |
| **date** | string | **Khóa chính (Sub)** | Ngày tạo gợi ý |
| **caloriesAnalysis** | map | - | Phân tích dinh dưỡng của AI (Status, Analysis) |
| **activityAnalysis** | map | - | Phân tích vận động của AI (Status, Analysis) |
| **sleepAnalysis** | map | - | Phân tích giấc ngủ của AI (Status, Analysis) |

## 3.3. Thiết kế giao diện (UI Design Concept)

Hệ thống được thiết kế theo phong cách hiện đại (Modern UI) với các màn hình chính sau:

- **Thiết kế Header (Horizontal Icons Style):** 
    - Bố cục dàn hàng ngang với chiều cao cố định **h-20**.
    - Phân chia tỷ lệ vàng: **16%** cho Logo (Gradient text), **54%** cho hệ thống Icon điều hướng (kèm vạch chỉ thị Active bên dưới), và **30%** cho khu vực Profile/Avatar.
    - Sử dụng hiệu ứng `backdrop-blur` và `shadow-sm` để tách biệt với nội dung bên dưới.
- **Bố cục Dashboard đa làn (Multi-lane Layout):** 
    - **Làn trái:** Sidebar điều hướng phụ.
    - **Làn giữa (Main - 59%):** Khu vực hiển thị nội dung chính, Dashboard metrics.
    - **Làn phải:** Side panel dành riêng cho Trợ lý AI, có thể đóng/mở linh hoạt.
- **Các thành phần trực quan (Visual Components):**
    - **BmiMeter (SVG Gauge):** Đồng hồ đo chỉ số BMI dạng bán nguyệt với 5 dải màu theo tiêu chuẩn WHO, kim chỉ thời gian thực và gợi ý cân nặng lý tưởng.
    - **Metric Cards:** Các thẻ chỉ số (Calo, Cân nặng, Giấc ngủ) có tích hợp so sánh biến động so với ngày hôm trước (Trending indicators).
    - **AI Tip Card:** Thẻ gợi ý nổi bật sử dụng màu thương hiệu, hiển thị các lời khuyên từ Lightbulb AI một cách trang trọng.
