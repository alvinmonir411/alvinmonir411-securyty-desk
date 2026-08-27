# 🏫 নোবেল রেসিডেনসিয়াল হাই স্কুল - পূর্ণাঙ্গ এন্টারপ্রাইজ স্কুল ম্যানেজমেন্ট সিস্টেম
### Noble Residential High School — Enterprise School Management System (SMS)

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=for-the-badge&logo=nestjs)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1?style=for-the-badge&logo=postgresql)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_Engine-3448C5?style=for-the-badge&logo=cloudinary)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)

একটি আধুনিক, সুরক্ষিত, আন্তর্জাতিক মানসম্পন্ন এবং পূর্ণাঙ্গ বিদ্যালয় ব্যবস্থাপনা সফটওয়্যার। এর মাধ্যমে শিক্ষার্থী ভর্তি, ভর্তি ফি কালেকশন (bKash, Nagad, Rocket), তাৎক্ষণিক প্রবেশপত্র (Admit Card) প্রিন্ট, উপস্থিতি, রেজাল্ট ও মার্কশিট, বেতন ও পে-রোল, ক্লাউডিনারি ফটো আপলোড এবং ডায়নামিক ওয়েবসাইট নিয়ন্ত্রণ করা যায়।

---

## 🌟 প্রধান ফিচারসমূহ (Key Features Overview)

### ১. 🌐 আধুনিক পাবলিক ওয়েবসাইট ও ভর্তি পোর্টাল (Public Portal & Online Admission)
* **ডায়নামিক হিরো স্লাইডার (Hero Banner Slides):** ক্লাউডিনারির মাধ্যমে স্কুলের ফটো গ্যালারি ও ব্যানার স্লাইডার নিয়ন্ত্রণ।
* **অনলাইন ভর্তি পোর্টাল (`/admissions`):**
  * **৬-ধাপের স্মার্ট আবেদন ফর্ম:** শিক্ষার্থী তথ্য, পিতা-মাতার তথ্য, ঠিকানা, পূর্ববর্তী স্কুলের তথ্য ও প্রয়োজনীয় সনদপত্র আপলোড।
  * **মোবাইল ব্যাংকিং ফি পেমেন্ট:** বিকাশ (bKash), নগদ (Nagad) ও রকেট (Rocket) নম্বরে ফি পাঠিয়ে TrxID, প্রেরক নম্বর ও পেমেন্ট স্ক্রিনশট জমা দেওয়ার সুবিধা।
  * **স্বয়ংক্রিয় প্রবেশপত্র ও রিসিট (Instant Admit Card):** আবেদন জমা দেওয়ার সাথে সাথে ডিজিটাল সিল ও বারকোড সহ অফিশিয়াল প্রবেশপত্র ডাউনলোড ও প্রিন্ট করার সুবিধা।
  * **আবেদন ট্র্যাকিং (`/admissions/track`):** আবেদন আইডি বা রোল দিয়ে আবেদনের সর্বশেষ অবস্থা যাচাই।
* **অনলাইন রেজাল্ট অনুসন্ধান (`/results`):** পরীক্ষার নাম, রোল ও রেজিস্ট্রেশন নম্বর দিয়ে বিষয়ভিত্তিক মার্কশিট ও জিপিএ (GPA) প্রদর্শন।
* **শিক্ষক ও ফ্যাকাল্টি ডিরেক্টরি (`/teachers`):** শিক্ষকদের তালিকা, বিভাগ, পদবী ও ছবি সহ প্রোফাইল।
* **নোটিশ বোর্ড, সংবাদ ও ইভেন্ট (`/notices`, `/news`, `/events`):** নোটিশ ডাউনলোড এবং স্কুলের বিভিন্ন ইভেন্টের তথ্য।

---

### ২. 🛠️ অ্যাডমিন কন্ট্রোল প্যানেল (Admin Control Panel - `/admin`)
* **ভর্তি অনুমোদন ও অটো-এনরোলমেন্ট (`/admin/admissions`):**
  * আবেদন পর্যালোচনা, শিক্ষার্থীর জন্মসনদ ও বিকাশ/নগদ/রকেট পেমেন্ট স্লিপ যাচাই।
  * **"Approve" বাটন:** অনুমোদনের সাথে সাথে স্বয়ংক্রিয়ভাবে স্টুডেন্ট প্রোফাইল তৈরি, সেকশনে এনরোল এবং পরবর্তী ক্রমিক রোল নম্বর (Auto Roll Generation) নির্ধারণ।
* **শ্রেণী ও বিষয় ব্যবস্থাপনা (`/admin/academics`):**
  * নতুন শ্রেণী (Class), শাখা (Section) ও বিষয় (Subject) তৈরি, সম্পাদনা ও ক্যাস্কেডিং সুরক্ষা সহ ডিলিট।
* **শিক্ষার্থী ব্যবস্থাপনা (`/admin/students`):**
  * শিক্ষার্থী তালিকা, নতুন শিক্ষার্থী ভর্তি, ছবি আপলোড, রক্তের গ্রুপ, জরুরি অভিভাবক যোগাযোগ ও আইডি কার্ড জেনারেট।
* **শিক্ষক ও স্টাফ ব্যবস্থাপনা (`/admin/teachers`):**
  * শিক্ষক ও স্টাফ যোগ, ক্লাউডিনারি প্রোফাইল ছবি আপলোড/এডিট, পদবী ও বেতন কাঠামো নির্ধারণ।
* **উপস্থিতি ও বায়োমেট্রিক (`/admin/attendance`, `/admin/biometric`):**
  * শিক্ষার্থীদের দৈনিক উপস্থিতি ও ZKTeco/ডিজিটাল বায়োমেট্রিক মেশিন ইন্টিগ্রেশন।
* **পরীক্ষা ও ফলাফল প্রস্তুতকরণ (`/admin/exams`, `/admin/results`):**
  * পরীক্ষার রুটিন প্রস্তুত, নম্বর ইনপুট ও স্বয়ংক্রিয় গ্রেডিং স্কেল অনুযায়ী মেধা তালিকা তৈরি।
* **হিসাব ও পে-রোল ব্যবস্থাপনা (`/admin/finance`, `/admin/payroll`):**
  * ফি হেড নির্ধারণ, মাসিক ইনভয়েস জেনারেট, বেতন আদায় ও পে-স্লিপ প্রিন্ট।
* **সিএমএস নিয়ন্ত্রণ (`/admin/cms`, `/admin/hero-slides`):**
  * ওয়েবসাইট ব্যানার, নোটিশ, নিউজ ও ইভেন্ট সরাসরি আপলোড ও নিয়ন্ত্রণ।

---

### ৩. 👨‍🏫 শিক্ষক পোর্টাল (Teacher Portal - `/teacher`)
* দৈনিক ক্লাসের রোল কল / ডিজিটাল হাজিরা গ্রহণ (`/teacher/attendance`)
* পরীক্ষার প্রাপ্ত নম্বর এন্ট্রি ও মূল্যায়ন (`/teacher/marks`)
* ছুটির আবেদন পাঠানো ও স্ট্যাটাস ট্র্যাকিং (`/teacher/leaves`)
* মাসিক বেতনের পে-স্লিপ দেখা ও ডাউনলোড (`/teacher/salary`)

---

### ৪. 🎓 শিক্ষার্থী ও অভিভাবক পোর্টাল (`/student`, `/parent`)
* শিক্ষার্থীর দৈনিক উপস্থিতি ও ছুটির রেকর্ড
* সেমিস্টার পরীক্ষার ফলাফল, গ্রেড ও মার্কশিট ভিউ
* টিউশন ফি বকেয়া, রসিদ ও লেনদেনের ইতিহাস

---

## 🔐 ডিফল্ট লগইন ইউজার তথ্য (Demo / Initial Credentials)

| রোল (Role) | ইমেইল (Email) | পাসওয়ার্ড (Password) | পোর্টাল লিংক |
| :--- | :--- | :--- | :--- |
| **সুপার অ্যাডমিন** | `superadmin@nobleschool.edu.bd` | `Pass@123456` | `/login` বা `/admin` |
| **অ্যাডমিন / প্রিন্সিপাল** | `principal@nobleschool.edu.bd` | `Pass@123456` | `/login` বা `/admin` |
| **অ্যাকাউন্ট্যান্ট** | `accountant@nobleschool.edu.bd` | `Pass@123456` | `/login` বা `/accountant` |
| **শিক্ষক (Teacher)** | `teacher1@nobleschool.edu.bd` | `Pass@123456` | `/login` বা `/teacher` |
| **শিক্ষার্থী (Student)** | `student1@nobleschool.edu.bd` | `Pass@123456` | `/login` বা `/student` |
| **অভিভাবক (Parent)** | `parent1@nobleschool.edu.bd` | `Pass@123456` | `/login` বা `/parent` |

---

## 🏗️ প্রজেক্ট স্ট্রাকচার (Repository Architecture)

```
school-management-system/
├── backend/                  # NestJS API Server
│   ├── prisma/               # Prisma ORM Schema & Migrations
│   │   └── schema.prisma     # Neon PostgreSQL Database Models & Enums
│   └── src/
│       ├── database/         # Prisma Service Provider
│       ├── modules/          # Core Domain Modules
│       │   ├── academics/    # Classes, Sections, Subjects
│       │   ├── admissions/   # Admission Application & Auto-enrollment
│       │   ├── attendance/   # Daily & Biometric Attendance
│       │   ├── auth/         # JWT Authentication & RBAC Guards
│       │   ├── cms/          # Notices, Events, Hero Banners, Gallery
│       │   ├── exams/        # Exams, Marks & Automated Grading
│       │   ├── finance/      # Invoices, Fee Structures & Receipts
│       │   ├── payroll/      # Staff Payroll, Allowances & Deductions
│       │   ├── students/     # Student Profiles & Enrollments
│       │   └── teachers/     # Teacher Profiles & Designations
│       └── main.ts           # Backend Bootstrap & Swagger Setup
├── frontend/                 # Next.js 15 App Router Frontend
│   ├── public/               # Static Assets & Icons
│   └── src/
│       ├── app/              # Next.js App Router Pages
│       │   ├── (auth)/       # Login & Authentication Routes
│       │   ├── (dashboard)/  # Admin, Teacher, Student & Parent Dashboards
│       │   ├── admissions/   # 6-step Admission Form & Admit Card Print
│       │   ├── results/      # Public Online Result Search
│       │   ├── teachers/     # Public Faculty Directory
│       │   ├── notices/      # Public Notices
│       │   └── page.tsx      # Public Homepage with Dynamic Slider
│       ├── components/       # Reusable UI & Layout Components
│       └── lib/              # API Client, Axios & Utility Functions
└── README.md                 # Documentation
```

---

## 🚀 লোকাল মেশিনে চালানোর নিয়ম (Local Development Setup)

### পূর্বশর্ত (Prerequisites):
* **Node.js**: v18 বা তার পরবর্তী সংস্করণ
* **PostgreSQL**: Neon Serverless অথবা লোকাল PostgreSQL

### ১. ব্যাকএন্ড সেটআপ ও চালু করা (Backend Setup):
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```
* **ব্যাকএন্ড API:** `http://localhost:4000`
* **Swagger API Docs:** `http://localhost:4000/api/docs`

### ২. ফ্রন্টএন্ড সেটআপ ও চালু করা (Frontend Setup):
```bash
cd frontend
npm install
npm run dev
```
* **ফ্রন্টএন্ড ওয়েবসাইট:** `http://localhost:3000`

---

## ☁️ ক্লাউডিনারি ফটো আপলোড কনফিগারেশন (Cloudinary Credentials)
* **Cloud Name:** `dgaiqqh7k`
* **API Key:** `415555729322332`
* **API Secret:** `Cqkj0E-JfT1Gb0s_ab3Gwxy1nZE`

---

## 🌐 Vercel-এ ফ্রন্টএন্ড ডিপ্লয়মেন্ট গাইড (Vercel Deployment)

1. **Vercel-এ ডিপ্লয় করুন:**
   * **Root Directory:** `./frontend`
   * **Framework Preset:** `Next.js`
   * **Build Command:** `npm run build`
   * **Output Directory:** `.next`
2. **Environment Variables:**
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-api-url.onrender.com/api/v1
   ```
3. **Deploy** বাটনে ক্লিক করলে স্বয়ংক্রিয়ভাবে লাইভ সাইট তৈরি হয়ে যাবে।

---

## 🛠️ প্রযুক্তি স্ট্যাক (Tech Stack)
* **Frontend:** Next.js (App Router, Turbopack), React 19, TypeScript, Tailwind CSS, Lucide Icons, TanStack Query.
* **Backend:** NestJS, TypeScript, Prisma ORM, Neon Serverless PostgreSQL, JWT Authentication, Class Validator.
* **Media & Cloud Storage:** Cloudinary SDK v2.
* **Security & Reliability:** Role-Based Access Control (RBAC), bcryptjs, Helmet, Rate Limiting, Soft Deletes, Audit Logging.

---
© ২০২৬ নোবেল রেসিডেনসিয়াল হাই স্কুল (Noble Residential High School). সর্বস্বত্ব সংরক্ষিত।
