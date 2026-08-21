# Google Drive Random Photo Slideshow

Website chạy trên GitHub Pages, tự lấy ảnh từ một thư mục Google Drive rồi random ảnh và random hiệu ứng chuyển cảnh.

## 1. Chuẩn bị Google Drive
1. Tạo một folder chứa ảnh.
2. Chuột phải folder → **Share** → **General access: Anyone with the link → Viewer**.
3. Copy link folder.

## 2. Bật Google Drive API
1. Vào Google Cloud Console: https://console.cloud.google.com/
2. Tạo/chọn một Project.
3. Vào **APIs & Services → Library** → bật **Google Drive API**.
4. Vào **APIs & Services → Credentials → Create credentials → API key**.
5. Khuyến nghị giới hạn API key theo **Google Drive API** và HTTP referrer của GitHub Pages domain của bạn.

> API key dùng ở phía trình duyệt nên không phải bí mật tuyệt đối. Hãy đặt restriction để tránh bị lạm dụng.

## 3. Dùng trên website
Mở panel ⚙ → phần **Google Drive** → dán link folder + API key → **Tải ảnh từ Google Drive**.

Website sẽ tự tìm các file có MIME type `image/*` trong folder và hỗ trợ phân trang nếu có hơn 1000 file.

## Lưu ý
- Ảnh trong folder cần được chia sẻ công khai để trình duyệt có thể tải thumbnail.
- Google Drive không phải CDN chuyên dụng; với hàng nghìn ảnh hoặc truy cập rất lớn, nên dùng storage/CDN riêng.
- API key được lưu trong LocalStorage của trình duyệt để lần sau không cần nhập lại trên thiết bị đó.
