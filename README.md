# 🏫 নোবেল রেসিডেনসিয়াল হাই স্কুল - সম্পূর্ণ স্কুল ম্যানেজমেন্ট সিস্টেম
### Noble Residential High School — Enterprise School Management System (SMS)

একটি আধুনিক, সুরক্ষিত ও আন্তর্জাতিক মানের পূর্ণাঙ্গ বিদ্যালয় ব্যবস্থাপনা সফটওয়্যার। এর মাধ্যমে শিক্ষার্থী ভর্তি, উপস্থিতি, রেজাল্ট, বেতন, হিসাব-নিকাশ, ক্লাউডিনারি ফটো আপলোড এবং ডায়নামিক ওয়েবসাইট নিয়ন্ত্রণ করা যায়।

---

## 🌟 প্রধান ফিচারসমূহ (Key Features Overview)

### ১. 🌐 আধুনিক পাবলিক ওয়েবসাইট (Public Portal)
* **ডায়নামিক ব্যানার স্লাইডার (Hero Banner Slides):** ক্লাউডিনারির মাধ্যমে স্কুলের ফটো গ্যালারি ও স্লাইডার পরিবর্তন।
* **অনলাইন ভর্তি পোর্টাল (Online Admissions):**
  * ৬-ধাপের স্মার্ট আবেদন ফর্ম (শিক্ষার্থী, অভিভাবক, শ্রেণী ও সনদপত্র আপলোড)।
  * **মোবাইল ব্যাংকিং ফি পেমেন্ট:** বিকাশ (bKash), নগদ (Nagad) ও রকেট (Rocket) নম্বরে টাকা পাঠিয়ে TrxID ও স্ক্রিনশট জমা দেওয়ার সুবিধা।
  * **স্বয়ংক্রিয় প্রবেশপত্র ও রিসিট (Admit Card):** আবেদন শেষে তাৎক্ষণিক প্রবেশপত্র প্রিন্ট করার সুবিধা।
  * **আবেদন ট্র্যাকিং:** আবেদন নম্বর দিয়ে আবেদনের অবস্থা ও অনুমোদনের ফলাফল যাচাই।
* **অনলাইন রেজাল্ট যাচাই (`/results`):** রোল ও রেজি নম্বর দিয়ে মার্কশিট ও গ্রেড পয়েন্ট বের করা।
* **ফ্যাকাল্টি ডিরেক্টরি (`/teachers`):** শিক্ষকদের তালিকা ও ছবি সহ প্রোফাইল।
* **নোটিশ বোর্ড, সংবাদ ও ইভেন্টস (`/notices`, `/news`, `/events`):** নোটিশ ডাউনলোড ও ইভেন্ট রেজিস্ট্রেশন।

---

### ২. 🛠️ অ্যাডমিন ড্যাশবোর্ড (Admin Control Panel)
* **ভর্তি অনুমোদন ও অটো-এনরোলমেন্ট (`/admin/admissions`):**
  * আবেদন পর্যালোচনা, শিক্ষার্থীর সনদপত্র ও বিকাশ/নগদ পেমেন্ট স্ক্রিনশট যাচাই।
  * **"Approve" বাটন:** অনুমোদনের সাথে সাথে স্বয়ংক্রিয়ভাবে স্টুডেন্ট প্রোফাইল তৈরি, সেকশনে এনরোল এবং পরবর্তী ক্রমিক রোল নম্বর (Auto Roll) নির্ধারণ।
* **শ্রেণী ও বিষয় ব্যবস্থাপনা (`/admin/academics`):**
  * নতুন শ্রেণী (Class), শাখা (Section) ও বিষয় (Subject) যোগ (Add), সংশোধন (Edit) এবং নিরাপদভাবে মুছে ফেলা (Delete)।
* **শিক্ষার্থী ব্যবস্থাপনা (`/admin/students`):**
  * নতুন শিক্ষার্থী ভর্তি, ছবি আপলোড, রক্তের গ্রুপ, জরুরি যোগাযোগ এবং আইডি কার্ড জেনারেট।
* **শিক্ষক ও স্টাফ ব্যবস্থাপনা (`/admin/teachers`):**
  * শিক্ষক যোগ, ক্লাউডিনারি প্রোফাইল ফটো আপলোড/এডিট, পদবী ও বেতন কাঠামো নির্ধারণ।
* **উপস্থিতি ও বায়োমেট্রিক (`/admin/attendance`, `/admin/biometric`):**
  * শিক্ষার্থীদের দৈনিক উপস্থিতি ও ZKTeco/ডিজিটাল বায়োমেট্রিক মেশিন ইন্টিগ্রেশন।
* **পরীক্ষা ও গ্রেডিং (`/admin/exams`, `/admin/results`):**
  * পরীক্ষার রুটিন তৈরি, শিক্ষক কর্তৃক নম্বর ইনপুট এবং স্বয়ংক্রিয় রেজাল্ট ও মেধাক্রম প্রস্তুত।
* **হিসাব ও অর্থ ব্যবস্থাপনা (`/admin/finance`, `/admin/payroll`):**
  * বেতন কাঠামো, মাসিক পে-রোল তৈরি, শিক্ষার্থীদের বেতন আদায় ও ভাউচার প্রিন্ট।
* **সিএমএস নিয়ন্ত্রণ (`/admin/cms`, `/admin/hero-slides`):**
  * ওয়েবসাইট ব্যানার, নোটিশ, নিউজ ও ইভেন্ট সরাসরি আপলোড ও নিয়ন্ত্রণ।

---

### ৩. 👨‍🏫 শিক্ষক পোর্টাল (Teacher Portal - `/teacher`)
* দৈনিক ক্লাসের রোল কল / হাজিরা গ্রহণ (`/teacher/attendance`)
* পরীক্ষার প্রাপ্ত নম্বর এন্ট্রি (`/teacher/marks`)
* ছুটির আবেদন পাঠানো ও স্ট্যাটাস ট্র্যাকিং (`/teacher/leaves`)
* মাসিক বেতনের পে-স্লিপ ডাউনলোড (`/teacher/salary`)

---

### ৪. 🎓 শিক্ষার্থী ও অভিভাবক পোর্টাল (`/student`, `/parent`)
* শিক্ষার্থীর দৈনিক উপস্থিতি ও ছুটির রেকর্ড
* সেমিস্টার পরীক্ষার ফলাফল, গ্রেড ও মার্কশিট
* টিউশন ফি বকেয়া, রশিদ ও পেমেন্ট হিস্ট্রি

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

## 🚀 লোকাল মেশিনে চালানোর নিয়ম (Local Development Setup)

### পূর্বশর্ত (Prerequisites):
* **Node.js**: v18 বা তার পরবর্তী সংস্করণ
* **PostgreSQL**: Neon Serverless অথবা লোকাল PostgreSQL

### ১. ব্যাকএন্ড চালু করা (Backend Setup):
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```
* ব্যাকএন্ড এপিআই চালু হবে: `http://localhost:4000`
* সোয়াগার ডকস: `http://localhost:4000/api/docs`

### ২. ফ্রন্টএন্ড চালু করা (Frontend Setup):
```bash
cd frontend
npm install
npm run dev
```
* ওয়েবসাইট ব্রাউজারে ওপেন করুন: `http://localhost:3000`

---

## ☁️ ক্লাউডিনারি ফটো আপলোড কনফিগারেশন (Cloudinary Credentials)
* **Cloud Name:** `dgaiqqh7k`
* **API Key:** `415555729322332`
* **API Secret:** `Cqkj0E-JfT1Gb0s_ab3Gwxy1nZE`

---

## 🌐 Vercel-এ ফ্রন্টএন্ড ডিপ্লয়মেন্ট গাইড (Vercel Deployment)

1. **Vercel-এ লগইন করুন:** [https://vercel.com](https://vercel.com)
2. **Add New Project** ক্লিক করে এই গিট রিপোজিটরিটি সিলেক্ট করুন।
3. **Framework Preset:** `Next.js`
4. **Root Directory:** `./frontend` নির্বাচন করুন।
5. **Environment Variables:**
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-api-url.onrender.com/api/v1
   ```
6. **Deploy** বাটনে ক্লিক করুন!

---

## 🛠️ প্রযুক্তি স্ট্যাক (Tech Stack)
* **Frontend:** Next.js (App Router, Turbopack), React 19, TypeScript, Tailwind CSS, Lucide Icons, TanStack Query.
* **Backend:** NestJS, TypeScript, Prisma ORM, Neon Serverless PostgreSQL, JWT Authentication, Class Validator.
* **Media & Storage:** Cloudinary SDK v2.
* **Security:** Role-Based Access Control (RBAC), bcryptjs, Helmet, Rate Limiting, Audit Logging.

---
© ২০২৬ নোবেল রেসিডেনসিয়াল হাই স্কুল। সর্বস্বত্ব সংরক্ষিত।
