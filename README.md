# 🌸 Bonnie Food Support

ระบบลงทะเบียน Food Support สำหรับบ้านบอนนี่

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database**: Supabase (PostgreSQL + Realtime)
- **Hosting**: Vercel

---

## 📋 การ Deploy ทีละขั้นตอน

### ขั้นตอนที่ 1 — สร้าง Supabase Project

1. ไปที่ [supabase.com](https://supabase.com) และ Sign in / Sign up
2. กด **"New project"**
3. ตั้งชื่อ project เช่น `bonnie-food-support`
4. ตั้ง Database Password (เก็บไว้)
5. เลือก Region ใกล้ไทย: `Southeast Asia (Singapore)`
6. รอ project สร้างเสร็จ (~2 นาที)

### ขั้นตอนที่ 2 — สร้าง Database Tables

1. ใน Supabase Dashboard ไปที่ **SQL Editor**
2. คลิก **"New query"**
3. Copy ทั้งหมดจากไฟล์ `supabase-setup.sql` แล้ว Paste
4. กด **"Run"**

### ขั้นตอนที่ 3 — สร้าง Admin User

1. ใน Supabase Dashboard ไปที่ **Authentication > Users**
2. กด **"Add user"**
3. ใส่ Email และ Password สำหรับ Admin
4. กด **"Create user"**

### ขั้นตอนที่ 4 — หา API Keys

ใน Supabase Dashboard ไปที่ **Settings > API**:
- `Project URL` → คือ `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → คือ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → คือ `SUPABASE_SERVICE_ROLE_KEY`

---

### ขั้นตอนที่ 5 — Deploy บน Vercel

**วิธีที่ 1: Deploy ผ่าน GitHub (แนะนำ)**

1. สร้าง GitHub repository ใหม่
2. Push code ทั้งหมดขึ้น GitHub
3. ไปที่ [vercel.com](https://vercel.com) และ Sign in
4. กด **"New Project"** → Import GitHub repo
5. ใน **Environment Variables** ใส่:
   ```
   NEXT_PUBLIC_SUPABASE_URL = (ค่าจากขั้นตอนที่ 4)
   NEXT_PUBLIC_SUPABASE_ANON_KEY = (ค่าจากขั้นตอนที่ 4)
   SUPABASE_SERVICE_ROLE_KEY = (ค่าจากขั้นตอนที่ 4)
   ```
6. กด **"Deploy"**

**วิธีที่ 2: Deploy ผ่าน Vercel CLI**

```bash
npm i -g vercel
cd bonnie-food-support
vercel
# ตอบคำถาม แล้วใส่ Environment Variables ตาม prompt
```

---

## 🔑 การใช้งาน

| หน้า | URL | ใครเข้าได้ |
|------|-----|-----------|
| กติกา | `/` | ทุกคน |
| คิว | `/queue` | ทุกคน |
| ลงทะเบียน | `/register` | ทุกคน |
| Admin Login | `/admin/login` | Admin |
| Admin Dashboard | `/admin/dashboard` | Admin เท่านั้น |

## 🎨 สถานะคิว

| สถานะ | สีตัวอักษร | ตำแหน่งใน Queue |
|-------|-----------|----------------|
| รอดำเนินการ | ปกติ | ตามลำดับเวลา |
| ระหว่างการติดต่อ | น้ำเงิน | ตำแหน่งเดิม |
| ส่งแล้ว | เขียว | ต่อท้ายกลุ่ม active |
| ไม่สะดวกส่งในรอบ | ปกติ | ต่อท้ายคิว active |
| ยกเลิกคิว | แดง | ล่างสุด |
