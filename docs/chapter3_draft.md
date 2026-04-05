# CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

## 3.1. Kiến trúc tổng thể hệ thống

Hệ thống được thiết kế theo mô hình **Client-Server** hiện đại, đảm bảo tính tách biệt giữa giao diện người dùng và xử lý dữ liệu tập trung trên nền tảng đám mây.

### 3.1.1. Mô hình Client – Server
- **Client:** Xây dựng bằng React/Next.js 14, đóng vai trò tiếp nhận tương tác của người dùng, hiển thị dữ liệu và gửi yêu cầu (Requests) đến hệ thống.
- **Server:** Sử dụng hạ tầng Firebase (Baas - Backend as a Service) và các Next.js API Routes để xử lý Logic nghiệp vụ, xác thực người dùng và tích hợp AI.

### 3.1.2. Kiến trúc 3 tầng (3-layer Architecture)
Để đảm bảo tính linh hoạt và dễ bảo trì, hệ thống được chia thành 3 tầng logic:
1. **Tầng Trình diễn (Presentation Layer):** Bao gồm giao diện Dashboard, các Form nhập liệu và hệ thống Chat AI. Sử dụng Tailwind CSS để tối ưu hóa hiển thị trên mọi thiết bị.
2. **Tầng Nghiệp vụ (Business Logic Layer):** Chứa các luồng (Flows) xử lý thông minh như: 
    - Tính toán BMR/TDEE.
    - AI Reasoning (Gemini) để đưa ra gợi ý sức khỏe.
    - Cơ chế Caching hình ảnh minh họa bằng giải thuật Hashing.
3. **Tầng Dữ liệu (Data Layer):** Chịu trách nhiệm lưu trữ và truy xuất dữ liệu từ Firebase Firestore và Firebase Storage, đảm bảo tính toàn vẹn và bảo mật thông tin.

## 3.2. Thiết kế Cơ sở dữ liệu

Mặc dù hệ thống sử dụng cơ sở dữ liệu NoSQL (Firestore), cấu trúc dữ liệu vẫn tuân thủ các ràng buộc chặt chẽ để đảm bảo tính quan hệ giữa các thực thể.

### 3.2.1. Sơ đồ thực thể quan hệ (ERD - Mapping)
Sơ đồ mô tả mối quan hệ 1-N (một - nhiều) từ thực thể User đến các nhật ký sức khỏe:

- **User (1) <---> (N) Meal_logs**
- **User (1) <---> (N) Weight_logs**
- **User (1) <---> (N) Activity_logs**

### 3.2.2. Thiết kế bảng chi tiết

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

## 3.3. Thiết kế giao diện (UI Design Concept)

Hệ thống được thiết kế theo phong cách hiện đại (Modern UI) với các màn hình chính sau:

- **Mockup màn hình đăng nhập:** Thiết kế tối giản với Form nhập liệu trung tâm, tích hợp thông báo lỗi thời gian thực và liên kết chuyển đổi giữa Đăng nhập/Đăng ký.
- **Mockup trang Dashboard:** 
    - Phía trên: Các thẻ chỉ số tổng quan (BMI Meter, Calo nạp, Calo tiêu thụ).
    - Phía dưới: Biểu đồ theo dõi tiến độ cân nặng (Line Chart) và Nhật ký hoạt động gần đây.
- **Mockup trang nhập dữ liệu:** Sử dụng các Dialog (hộp thoại) nổi để người dùng nhập nhanh cân nặng, bữa ăn mà không phải rời trang Dashboard.
- **Mockup trang tư vấn AI:** Khu vực hiển thị kết quả phân tích từ AI với các thẻ "Suggest" chứa hình ảnh minh họa chân thực và mô tả chi tiết bài tập/món ăn.
