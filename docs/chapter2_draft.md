# CHƯƠNG 2: PHÂN TÍCH YÊU CẦU VÀ CHỨC NĂNG HỆ THỐNG

Việc phân tích yêu cầu là bước nền tảng để xác định phạm vi và hướng đi của dự án HealthSphere, đảm bảo sản phẩm cuối cùng đáp ứng đúng nhu cầu thực tế của người dùng.

## 2.1. Đối tượng sử dụng hệ thống
Việc xác định các tác nhân (Actors) là bước đầu tiên và quan trọng nhất để định hình phạm vi tương tác của phần mềm. Hệ thống tư vấn sức khỏe thông minh tập trung vào hai nhóm đối tượng chính:

- **Người dùng phổ thông (User):** Là đối tượng trọng tâm của ứng dụng. Đây là những cá nhân có nhu cầu theo dõi thể trạng, kiểm soát cân nặng và tìm kiếm các lời khuyên về dinh dưỡng. Người dùng tương tác trực tiếp với các chức năng như nhập liệu cân nặng, ghi chép bữa ăn và tiếp nhận phản hồi từ hệ thống tư vấn thông minh.
- **Quản trị viên (Administrator):** Đóng vai trò vận hành và duy trì hệ thống. Admin có quyền quản lý danh mục thực phẩm, quản lý tài khoản người dùng và cập nhật các quy tắc tư vấn. Việc có một Admin giúp hệ thống luôn đảm bảo tính chính xác và cập nhật của dữ liệu thực phẩm, đặc biệt là các thực phẩm thuần Việt.
- **Hệ thống Trí tuệ Nhân tạo (Gemini AI Service):** Đóng vai trò là một **Tác nhân hệ thống (External Actor)**. Gemini AI tiếp nhận các yêu cầu xử lý ngôn ngữ và hình ảnh từ ứng dụng, thực hiện các thuật toán suy luận phức tạp để trả về các gợi ý sức khỏe, phân tích calo và tạo hình ảnh minh họa chân thực. Việc tích hợp này giúp ứng dụng có khả năng "tư duy" như một chuyên gia y tế thực thụ.

## 2.2. Các chức năng chính của hệ thống
Hệ thống HealthSphere được thiết kế theo cấu trúc module hóa chặt chẽ, giúp tách biệt các nghiệp vụ và đảm bảo tính mạch lạc trong quá trình vận hành, bảo trì và nâng cấp.

### 2.2.1. Quản lý tài khoản
Cung cấp môi trường an toàn và bảo mật cho người dùng:
- **Đăng ký:** Tạo tài khoản mới gắn liền với định danh cá nhân.
- **Đăng nhập:** Truy cập hệ thống và đồng bộ dữ liệu trên các thiết bị.
- **Cập nhật thông tin cá nhân:** Thay đổi các chỉ số nền tảng (tuổi, giới tính, mục tiêu) để AI tối ưu hóa lộ trình.

### 2.2.2. Quản lý thông tin sức khỏe
Nơi lưu trữ và phân tích các chỉ số sinh học:
- **Nhập chiều cao:** Cung cấp thông số cơ bản cho việc tính toán BMI.
- **Nhập cân nặng:** Ghi nhận sự thay đổi trọng lượng định kỳ.
- **Theo dõi cân nặng theo thời gian:** Trực quan hóa tiến trình sức khỏe thông qua biểu đồ thống kê.

### 2.2.3. Ghi nhận chế độ ăn và vận động
Kiểm soát dòng năng lượng nạp vào và tiêu hao hàng ngày với hỗ trợ đa phương thức:
- **Nhập bữa ăn đa phương thức:** Ghi lại thực phẩm thông qua nhập liệu văn bản truyền thống hoặc sử dụng **nhận diện hình ảnh trực tiếp** từ camera/thư viện ảnh giúp đơn giản hóa việc tra cứu calo.
- **Tính lượng calo tự động:** Sử dụng AI để quy đổi thực phẩm hoặc hình ảnh thành chỉ số năng lượng (kcal) và các thành phần dinh dưỡng (Protein, Carbs, Fat, Fiber).
- **Lưu lịch sử ăn uống:** Xem lại nhật ký dinh dưỡng chi tiết theo thời gian thực.
- **Lưu lịch sử vận động:** Theo dõi các hoạt động thể chất và lượng calo đã đốt cháy thông qua mô tả ngôn ngữ tự nhiên (NLP).

### 2.2.4. Hệ thống tư vấn sức khỏe thông minh
Phân hệ cốt lõi sử dụng trí tuệ nhân tạo thế hệ mới:
- **Gợi ý chế độ ăn cá nhân hóa:** Đưa ra thực đơn dựa trên mục tiêu TDEE và sở thích cá nhân.
- **Bền vững hóa gợi ý (AI Persistence):** Hệ thống có khả năng lưu trữ và duy trì các phân tích AI trong suốt cả ngày, đảm bảo người dùng không bị mất dữ liệu khi tải lại trang hoặc chuyển đổi giữa các module khác nhau.
- **Cảnh báo vượt mức calo:** Thông báo trực quan khi lượng năng lượng nạp vào tiệm cận hoặc vượt ngưỡng an toàn.
- **Gợi ý tập luyện thông minh:** Đề xuất lộ trình dựa trên chỉ số BMI thực tế và mức tản nhiệt năng lượng hàng ngày.

### 2.2.5. Lưu lịch sử và thống kê
Tổng hợp kết quả sau quá trình theo dõi:
- **Lịch sử cân nặng:** Nhật ký chi tiết các lần thay đổi trọng lượng.
- **Lịch sử Calo:** Báo cáo mức chênh lệch năng lượng hàng ngày.
- **Biểu đồ thống kê:** Tái hiện sự thay đổi của các chỉ số sức khỏe một cách logic và khoa học.
