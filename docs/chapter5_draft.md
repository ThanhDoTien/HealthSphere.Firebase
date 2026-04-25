# CHƯƠNG 5: TRIỂN KHAI – KIỂM THỬ – ĐÁNH GIÁ

## 5.1. Môi trường triển khai
Hệ thống được thiết lập và vận hành trên môi trường đám mây hiện đại, đảm bảo tính sẵn sàng cao:
- **Hệ điều hành:** 
    - Phát triển: Windows 10/11.
    - Triển khai (Deployment): Linux (Ubuntu) - Môi trường máy ảo của Firebase App Hosting.
- **Server:** Node.js Runtime phiên bản 20.x, hỗ trợ xử lý bất đồng bộ mạnh mẽ cho các yêu cầu AI.
- **Hosting:** **Firebase App Hosting** - Giải pháp thế hệ mới của Google giúp tự động tối ưu hóa việc phân phối mã nguồn Next.js. Hệ thống được kết nối với Backend ổn định tại địa chỉ Hosted chuyên biệt, quản lý qua biến môi trường `.env`.

## 5.2. Các ca kiểm thử (Test Cases)
Quy trình kiểm thử được thực hiện nghiêm ngặt để đảm bảo chất lượng phần mềm:

| STT | Tên ca kiểm thử | Mô tả nội dung kiểm tra | Kết quả mong đợi | Trạng thái |
| :-- | :--- | :--- | :--- | :---: |
| 1 | **Test đăng nhập** | Nhập email/mật khẩu và kiểm tra phiên làm việc. | Chuyển hướng đúng vào Dashboard, bảo mật dữ liệu. | Thành công |
| 2 | **Test nhập dữ liệu** | Nhập thông tin bữa ăn, cân nặng và các hoạt động. | Dữ liệu xuất hiện ngay trên biểu đồ và nhật ký hàng ngày. | Thành công |
| 3 | **Test tính calo** | Nhập 02 bữa ăn (ví dụ: 1200 kcal) và 01 hoạt động tập luyện. | Hệ thống cộng dồn chính xác Calo nạp vào và trừ Calo tiêu thụ. | Thành công |
| 4 | **Test thuật toán BMI** | Nhập chiều cao 170cm, cân nặng 80kg (Thừa cân). | Hệ thống tự động tính BMI và gợi ý mục tiêu "Giảm cân" ngay lập tức. | Thành công |
| 5 | **Test độ ổn định AI** | Tải lại trang (Refresh) hoặc chuyển trang liên tục. | Gợi ý AI được giữ nguyên, không bị gọi lại dư thừa hoặc mất dữ liệu. | Thành công |

# KẾT LUẬN – HƯỚNG PHÁT TRIỂN

## 1. Kết luận
### 1.1. Tóm tắt quá trình thực hiện
Đồ án HealthSphere đã trải qua quy trình nghiên cứu và phát triển bài bản, từ khâu khảo sát nhu cầu người dùng, phân tích quy trình nghiệp vụ sức khỏe đến việc hiện thực hóa bằng các công nghệ hiện đại. Hệ thống đã tích hợp thành công các dịch vụ đám mây của **Firebase** phối hợp cùng trí tuệ nhân tạo **Gemini 3.1 Flash**, tạo ra một giải pháp chăm sóc sức khỏe toàn diện trên nền tảng Web.

### 1.2. Đánh giá mức độ hoàn thành mục tiêu
Dựa trên các mục tiêu đã đề ra ban đầu, đồ án đã hoàn thành các nhiệm vụ cốt lõi:
- **Xây dựng hệ thống quản lý chỉ số:** Lưu trữ và biểu diễn trực quan hóa dữ liệu cân nặng, calo, hoạt động và giấc ngủ với độ chính xác cao.
- **Tư vấn AI thông minh & Bền vững:** Triển khai thành công các luồng xử lý AI (Gemini 3 Flash) để đưa lại những gợi ý cá nhân hóa và đảm bảo tính bền vững của dữ liệu thông qua cơ chế Persistence thông minh.
- **Tối ưu hóa kỹ thuật:** Giải quyết triệt để bài toán chi phí và hiệu suất thông qua cơ chế bộ nhớ đệm hình ảnh và Loading Guards.
- **Trải nghiệm người dùng:** Đạt được độ hoàn thiện cao về giao diện (Premium Facebook-style Navbar), hỗ trợ đa ngôn ngữ và hoạt động ổn định trên môi trường thực tế.

## 2. Hướng phát triển
Để nâng tầm HealthSphere từ một đồ án khóa luận thành một sản phẩm thương mại thực tế, các hướng phát triển sau sẽ được ưu tiên:

### 2.1. Kết nối và hỗ trợ hệ sinh thái sức khỏe (Gyms & Health Centers)
Đây là hướng đi chiến lược nhằm đưa ứng dụng vào thực tế cuộc sống:
- **Hỗ trợ Phòng tập (Gyms):** Phát triển cổng thông tin dành riêng cho huấn luyện viên (PT) để theo dõi nhật ký dinh dưỡng và vận động của học viên trực tiếp trên hệ thống, từ đó đưa ra điều chỉnh giáo án kịp thời.
- **Kết nối Trung tâm chăm sóc sức khỏe:** Tích hợp tính năng chia sẻ dữ liệu sức khỏe (với sự đồng ý của người dùng) cho các bác sĩ dinh dưỡng hoặc chuyên gia y tế tại các trung tâm, giúp việc tư vấn trở nên chính xác và khoa học hơn.

### 2.2. Nâng cấp công nghệ và mở rộng dữ liệu
- **Tích hợp Machine Learning:** Xây dựng các mô hình học máy chuyên sâu để dự báo xu hướng sức khỏe và phát hiện sớm các dấu hiệu bất thường dựa trên dữ liệu lịch sử lâu dài của người dùng.
- **Kết nối Smartwatch & IoT:** Đồng bộ hóa dữ liệu thời gian thực từ Apple Watch, Garmin, Fitbit để việc theo dõi nhịp tim, giấc ngủ và calo tiêu thụ trở nên hoàn toàn tự động.
- **Phát triển phiên bản Mobile:** Xây dựng ứng dụng Native trên iOS và Android để tối ưu hóa thông báo nhắc nhở (Push Notifications) và trải nghiệm "On-the-go".
- **Mở rộng kho dữ liệu dinh dưỡng:** Liên kết với các API thực phẩm lớn để bổ sung dữ liệu dinh dưỡng chi tiết của hàng nghìn món ăn Việt Nam và quốc tế, tăng độ chính xác cho việc tính toán calo.
