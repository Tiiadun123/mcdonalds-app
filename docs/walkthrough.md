# 🚀 Walkthrough: Hệ thống Auth PRO đã hoàn tất!

Tôi đã hoàn thiện toàn bộ hệ thống Xác thực (Authentication) và Phân quyền (Authorization) cho ứng dụng McDonald's của bạn. Dưới đây là những gì đã được thực hiện và cách bạn kiểm tra nó.

## 🛠️ Những gì đã được xây dựng
1.  **Auth Logic (`src/lib/authService.js`):** Xử lý Đăng ký, Đăng nhập, Google OAuth, và Quên mật khẩu.
2.  **State Management (`src/store/useAuthStore.js`):** Quản lý trạng thái người dùng bằng Zustand, tự động khôi phục phiên đăng nhập khi tải trang.
3.  **Hệ thống Profile:** Tự động đồng bộ hóa thông tin từ tài khoàn Supabase sang bảng `profiles` để quản lý vai trò (Admin/Customer).
4.  **Bảo mật:** Route `/admin` hiện đã được bảo mật. Chỉ có Admin mới được vào.

---

## 📝 Hướng dẫn kích hoạt (BẮT BUỘC)

### 1. Chạy SQL Migration
Bạn cần copy nội dung trong file [supabase-auth-schema.sql](file:///c:/Users/ADMIN/Downloads/TEST/mcdonalds-app/supabase-auth-schema.sql) và dán vào **SQL Editor** trên Dashboard của Supabase:
- Bảng `profiles` sẽ được tạo.
- Trigger `on_auth_user_created` sẽ được thiết lập để tự động tạo profile khi có người đăng ký.

### 2. Thiết lập Google Login (Nếu muốn dùng)
Trong Dashboard Supabase (Authentication -> Providers -> Google):
- **Redirect URL:** `http://127.0.0.1:5173/**`
- **Site URL:** `http://127.0.0.1:5173`

---

## 🧪 Cách kiểm tra (Testing)

### Bước 1: Đăng ký tài khoản Admin
1.  Truy cập trang `/login`. 
2.  Đăng ký một tài khoản mới.
3.  **Quan trọng:** Vào bảng `profiles` trong Supabase và sửa cột `role` của tài khoản bạn vừa tạo từ `customer` thành `admin`.

### Bước 2: Kiểm tra bảo mật
1.  Đăng xuất.
2.  Thử truy cập trực tiếp vào `http://127.0.0.1:5173/admin` -> Hệ thống sẽ tự động đẩy bạn ra trang Login.
3.  Đăng nhập lại bằng tài khoản Admin -> Bạn sẽ thấy thanh **"Admin Mode"** màu đỏ xuất hiện ở trên cùng và có thể vào trang quản lý.

### Bước 3: Quên mật khẩu
1.  Tại trang Login, nhập email và nhấn **"Quên mật khẩu?"**.
2.  Kiểm tra link khôi phục trong email của bạn (Supabase sẽ gửi).

---

## ✨ Thành quả cuối cùng
Dự án của bạn giờ đây đã sẵn sàng để vận hành thực tế với đầy đủ các tiêu chuẩn bảo mật hiện đại.

> [!TIP]
> Bạn có thể bảo Codex 5.3 kiểm tra lại file `LoginPage.jsx` để tinh chỉnh các hiệu ứng CSS cho nút Google hoặc thêm các thông báo (Toast) cho thân thiện hơn nữa!

Chúc mừng bạn đã hoàn thành một cột mốc quan trọng của dự án! 🎉🍔🔐
