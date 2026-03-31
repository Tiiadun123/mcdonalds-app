# 🍔 McDonald's Pro - Enterprise React Clone

![React](https://img.shields.io/badge/React-18.x-blue?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.x-purple?style=flat-square&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)
![Zustand](https://img.shields.io/badge/Zustand-State%20Management-orange?style=flat-square)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-cyan?style=flat-square&logo=tailwind-css)

Đây là dự án ứng dụng McDonald's Clone sử dụng công nghệ React mới nhất, kết hợp kiến trúc Client-Server hiện đại. Dự án bao gồm các luồng mua hàng thông minh (E-Receipt), quản lý trạng thái đồng bộ đám mây và giao diện tối ưu hóa hiệu năng.

## ✨ Tính năng chính (Features)

- **🛒 Chức năng thay đổi giao diện linh hoạt (Optimistic UI):** State cục bộ đồng bộ ngầm với Supabase thông qua **Zustand**. Hạn chế loading chờ đợi.
- **🍔 Flow Mua Hàng Chuẩn:** Hỗ trợ quét mã thanh toán, và màn hình E-Receipt đẹp mắt `OrderSuccess`.
- **🚀 Hiệu năng hệ thống (Enterprise Architecture):** Tối ưu hóa render bằng `React.lazy`, Code-Splitting và `ErrorBoundary`.
- **🔐 Xác thực nâng cao (Security):** Quản lý User/Admin với Row-Level Security (RLS) của PostgreSQL an toàn và tự động tối ưu truy vấn N+1 (STABLE db logic).
- **📋 Admin Dashboard:** Phân quyền dành riêng cho nhân viên cửa hàng để xem & duyệt đơn hàng thực tế.

## 🛠️ Công nghệ tích hợp (Tech Stack)

- **Frontend:** React.js, Vite, Tailwind CSS, Lucide React (Icons), Recharts (Biểu đồ số liệu).
- **State Management:** Zustand (Tích hợp kịch bản Auto Cloud Sync).
- **Backend & Database:** Supabase (PostgreSQL, Auth, Storage).
- **Routing:** React Router DOM v6.

## 🚀 Cài đặt trên máy (Installation)

1. Cài đặt các module cần thiết:
   ```bash
   npm install
   ```

2. Cấu hình biến môi trường bằng cách tạo file `.env.local`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Khởi chạy máy chủ phát triển (Development Server):
   ```bash
   npm run dev
   ```

## 👨‍💻 Tác giả
Source Code trên Github này thuộc sở hữu & quản lý bởi: [Tiiadun123](https://github.com/Tiiadun123)
