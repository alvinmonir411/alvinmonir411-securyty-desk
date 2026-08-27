# 📌 Critical Fixes & Production Readiness Plan

This document outlines the priority-ranked fixes and operational steps required to transition **Noble Residential High School (নোবেল রেসিডেন্সিয়াল হাই স্কুল)** from development staging to full live production.

---

## Priority Matrix

- **P0 (Must Fix Before Testing)**: Blocker issues preventing core functionality or causing runtime crashes.
- **P1 (Must Fix Before Production Launch)**: Third-party credentials, payment gateway keys, telco SMS integration, and domain SSL.
- **P2 (Important Improvements)**: Automated daily cloud backups, Redis caching layer, and advanced search indexing.
- **P3 (Nice to Have / Future Enhancements)**: Multi-language switcher (Bangla/English toggle across all forms), dark-mode persistence, and native mobile wrapper (PWA/Capacitor).

---

## 🔴 P0 — Must Fix Before Testing (Status: RESOLVED ✅)

| Issue | Root Cause | Fix Applied | Status |
| :--- | :--- | :--- | :---: |
| **Neon Connection Reset (`P1017`)** | PgBouncer pooler connection drops on idle. | Switched `DATABASE_URL` to Direct Neon compute instance with `connection_limit=10&connect_timeout=30`. | **RESOLVED** |
| **CORS Policy on Port 3001** | Backend only permitted origin `http://localhost:3000`. | Configured dynamic regex matching for all `localhost:\d+` origins in `main.ts`. | **RESOLVED** |
| **Redirect Loop (`ERR_TOO_MANY_REDIRECTS`)** | Middleware auto-redirected `/login` based on stale cookies. | Allowed unblocked direct access to `/login`, `/forgot-password`, and `/reset-password` in `middleware.ts`. | **RESOLVED** |
| **Next.js 16 Client Handler Error** | Inline `onError` function in server-rendered logo. | Added `'use client'` to `logo.tsx` and removed inline handlers. | **RESOLVED** |

---

## 🟠 P1 — Must Fix Before Production Launch

| Task | Component | Description | Action Required |
| :--- | :--- | :--- | :--- |
| **Live SMS Gateway** | `NotificationsModule` | Connect real Bangladeshi SMS Gateway (e.g. Onnorokom SMS, Greenweb, BulkSMSBD) or Twilio. | Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` (or local gateway API key) in production `.env`. |
| **Live Payment Gateway** | `FinanceModule` | Connect real merchant payment gateway (bKash Checkout API, Nagad Gateway, or SSLCommerz/Stripe). | Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` or `BKASH_APP_KEY`, `BKASH_APP_SECRET` in `.env`. |
| **Institutional Email SMTP** | `EmailService` | Connect custom institutional domain email for invoice receipts and password resets. | Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` for SendGrid / AWS SES. |
| **Production Domain & SSL** | DevOps | Bind official domain `nobleschool.edu.bd` with Cloudflare / Nginx reverse proxy and Let's Encrypt SSL certificates. | Configure Nginx reverse proxy routing port 4000 (`/api`) and port 3000 (Next.js). |

---

## 🟡 P2 — Important Operational Enhancements

| Task | Component | Description | Benefit |
| :--- | :--- | :--- | :--- |
| **Automated Neon DB Backup** | DevOps | Configure automated daily snapshot backups to AWS S3 or Google Cloud Storage. | Disaster recovery & historical data protection. |
| **Redis Caching Layer** | Backend Core | Cache public notice board, syllabus lists, and CMS news articles in Redis. | Sub-millisecond response times under heavy traffic spikes during result publication days. |
| **Rate Limiting Tuning** | Security | Adjust Throttler settings for public Result search vs authenticated teacher marks entry. | Prevents automated scraping while allowing fast batch marks entry. |

---

## 🟢 P3 — Nice to Have / Future Additions

| Task | Component | Description |
| :--- | :--- | :--- |
| **Full UI Bangla Toggle** | Frontend | Add `next-intl` or `i18next` for 1-click toggle between English and Bengali across all dashboard menus. |
| **PWA Mobile App** | Frontend | Add `manifest.json` and service workers for 1-click "Install to Phone" on Android and iOS. |
| **Biometric Attendance Machine Sync** | Hardware Adapter | Provide webhook endpoint to receive real-time punches from ZKTeco biometric RFID/Fingerprint devices. |
