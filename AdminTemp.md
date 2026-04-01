# Hướng dẫn mấy cái liên quan tới admin

## Tổng quan luồng hoạt động

```
User nhập email + password
        ↓
NextAuth authorize() → tìm user trong DB, kiểm tra password
        ↓
jwt callback → đưa role vào token
        ↓
session callback → đưa role vào session
        ↓
login/page.tsx nhận session → kiểm tra role
        ↓
role === "admin"  →  /admin/dashboard  (giao diện admin riêng)
role === "user"   →  /                 (giao diện thường)
```

---

## Bước 1: Tạo tài khoản admin trong DB

Chạy script sau từ thư mục `server/`:

```bash
cd server
node scripts/seedAdmin.js
```

Kết quả: tài khoản `admin@gmail.com` / `123456` được tạo với `role = "admin"`.

---

## Bước 2: Copy các file vào đúng vị trí

```
admin-setup/
├── middleware.ts                      → copy vào ROOT của project (cùng cấp với next.config.mjs)
├── server/scripts/seedAdmin.js        → copy vào server/scripts/seedAdmin.js
├── app/
│   ├── login/page.tsx                 → THAY THẾ app/login/page.tsx hiện tại
│   └── admin/
│       ├── layout.tsx                 → TẠO MỚI
│       ├── page.tsx                   → TẠO MỚI (redirect về /admin/dashboard)
│       └── dashboard/
│           └── page.tsx               → TẠO MỚI
```

---

## Bước 3: Kiểm tra middleware.ts hiện tại

Project đã có `middleware.ts` ở root. Bạn cần **merge** nội dung:

Nếu `middleware.ts` hiện tại chỉ xử lý NextAuth thông thường, hãy thay toàn bộ bằng file mới.

Nếu có logic khác, merge phần `matcher` và logic `/admin` vào.

---

## Bước 4: Đảm bảo NextAuth trả role vào session

File `app/api/auth/[...nextauth]/route.ts` của bạn **đã đúng** — không cần sửa.
Đã có:
```typescript
async jwt({ token, user }) {
  if (user) {
    token.role = user.role;  // ✅
  }
  return token;
},
async session({ session, token }) {
  session.user.role = token.role as string;  // ✅
  return session;
},
```

---

## Bước 5: Thêm các trang admin còn lại (tuỳ chọn)

Tạo thêm các trang trong `app/admin/`:
- `app/admin/products/page.tsx`
- `app/admin/orders/page.tsx`
- `app/admin/users/page.tsx`
- `app/admin/categories/page.tsx`
- `app/admin/merchants/page.tsx`

Tất cả đều sẽ tự động dùng `app/admin/layout.tsx` làm layout.

---

## Bước 6: Kiểm tra types (nếu dùng TypeScript)

Nếu TypeScript báo lỗi `session.user.role does not exist`, thêm vào `types/next-auth.d.ts`:

```typescript
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
    };
  }
  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
  }
}
```

---

## Kết quả sau khi tích hợp

| Email               | Password | Role  | Sau login          |
|---------------------|----------|-------|--------------------|
| admin@gmail.com     | 123456   | admin | /admin/dashboard   |
| user@example.com    | ***      | user  | /                  |

- `/admin/*` được bảo vệ bởi middleware — user thường vào sẽ bị redirect về `/`
- Admin dashboard có sidebar collapsible, dark theme với giao diện riêng biệt

---

## Lưu ý bảo mật

⚠️ **Đổi password admin ngay sau khi deploy lên production!**
- Script `seedAdmin.js` chỉ dùng cho development/setup ban đầu
- Cân nhắc đặt password mạnh hơn trong production