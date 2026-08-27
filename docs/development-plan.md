# Development Roadmap & Implementation Plan

## 1. Development Phases & Milestones

The project is structured into sequential development phases to ensure architectural integrity, domain correctness, and thorough testing:

```
[Phase 1: Foundation & Scaffolding] ─────► [Phase 2: Core Academics & Identity]
                                                          │
                                                          ▼
[Phase 4: Finance & Payroll] ◄────────────── [Phase 3: Attendance & Examination]
             │
             ▼
[Phase 5: Admissions, CMS & Notifications] ─► [Phase 6: Portals Polish & Production Hardening]
```

### Phase 1: Architecture, Monorepo Scaffolding & Shared Tooling (Current Phase)
- Establish strict TypeScript configuration for frontend and backend.
- Define comprehensive Prisma schema with all 13 core domain models.
- Set up NestJS global infrastructure (Pipes, Exception Filters, Response Interceptor, Audit Interceptor).
- Set up Next.js 16+ App Router, Tailwind CSS, shadcn/ui foundation, and TanStack Query client.
- Generate complete architectural and business rule documentation (`docs/`).

### Phase 2: Identity, RBAC & Core Academic Setup
- Authentication module with JWT Access + Refresh token rotation and device tracking.
- Role-based and Permission-based access control guards & CASL policies.
- User management and profile provisioning for Admin, Teacher, Student, Parent, Accountant.
- Academic structure CRUD (Academic Years, Terms, Classes, Sections, Subjects, Timetables).

### Phase 3: Student Lifecycle, Attendance & Examinations
- Student & Guardian profile linking with document attachments.
- Class enrollment workflows with roll number assignment.
- Daily student attendance matrix marking with bulk mutation endpoints.
- Staff biometric/manual clock-in & leave request approval workflows.
- Examination scheduling, marks entry interface, tabulation sheet calculation, and PDF report card generation.

### Phase 4: Financial Operations & Payroll
- Fee category and structure configuration per grade level.
- Automated monthly invoice generation engine with discount rules.
- Online payment integration (Stripe / Local Gateway) with webhook signature verification.
- Offline payment cash/bank recording and automated money receipt PDF generation.
- Staff salary structures, monthly payroll run calculation, and payslip PDF generation.

### Phase 5: Admissions, CMS & Multi-Channel Communications
- Public admission application wizard with file upload for birth certificates and transcripts.
- Admission application evaluation, interview scheduling, and 1-click conversion to enrolled student.
- CMS engine for public website news, events, notices, galleries, and contact inquiries.
- Notification engine dispatching in-app alerts, transactional emails (Resend), and SMS alerts (Twilio).

### Phase 6: Multi-Portal UX, Analytics & Production Hardening
- Tailored dashboards for Student, Parent, Teacher, Accountant, and Admin.
- Parent multi-ward switcher with unified fee payment interface.
- Institutional analytics dashboards (revenue charts, attendance trends, grade distributions).
- E2E testing with Supertest and Playwright.
- Production deployment configuration (Neon DB pooler, Dockerfile, Vercel/Render orchestration).

---

## 2. Testing Strategy

### 2.1 Unit Tests (Jest / Vitest)
- Test isolated business formulas:
  - GPA / CGPA computation logic
  - Fee late fine calculations
  - Payroll deduction & tax formulas
  - Attendance rate calculations

### 2.2 Integration Tests (NestJS Testing Module + Prisma Test DB)
- Test API endpoint contracts, DTO validation errors, and authorization guards.
- Verify relational cascade actions and unique constraint enforcement.

### 2.3 End-to-End (E2E) Tests
- User authentication and token refresh lifecycle.
- Admission submission to student conversion flow.
- Fee invoice generation to payment receipt generation flow.
- Exam marks submission to final report card PDF generation flow.

---

## 3. Production Readiness Checklist

| Category | Item | Status / Specification |
|---|---|---|
| **Database** | Neon Connection Pooling enabled | `pgbouncer=true` in `DATABASE_URL` |
| **Database** | Automated DB migrations & seeding | `prisma migrate deploy`, `prisma db seed` |
| **Security** | Rate Limiting configured | NestJS `@nestjs/throttler` (5 req/min on auth, 100 req/min on API) |
| **Security** | HTTP Security Headers | `helmet` configured with strict CSP |
| **Security** | CORS Policy | Whitelisted frontend origin |
| **Security** | Refresh Token Revocation | DB-backed revocation list on logout/password change |
| **API** | OpenAPI / Swagger Documentation | Accessible at `/api/docs` with Bearer auth support |
| **Observability** | Structured JSON Logging | Winston logger with Correlation ID tracking |
| **Observability** | Health Check Endpoint | `/api/v1/health` verifying DB connectivity |
