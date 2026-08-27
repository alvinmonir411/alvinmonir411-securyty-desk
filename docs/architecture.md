# School Management System — System Architecture Document

## 1. Executive Summary & Architectural Philosophy

The **School Management System (SMS)** is a production-grade, enterprise-ready educational resource planning (ERP) platform. It is engineered to handle the complete academic and operational lifecycle of K-12 schools, academies, and multi-campus educational institutions.

### Core Architectural Decisions:
1. **Modular Monolith**: Rather than adopting microservices—which introduce distributed transaction overhead, network latency, and complex deployment coordination—the system uses a domain-driven **Modular Monolith**. Each domain is strictly encapsulated in its own NestJS module with explicit boundaries and interfaces.
2. **Type Safety Across Layers**: End-to-end strict TypeScript across both backend (NestJS, Prisma) and frontend (Next.js 16+, Zod, TanStack Query).
3. **Multi-Portal Experience**: Distinct user experiences optimized for 5 primary personas (Public, Admin, Teacher, Student, Parent/Guardian) through Next.js App Router route groups.
4. **Neon Serverless PostgreSQL & Prisma ORM**: Cloud-native relational database leveraging connection pooling, transactional safety, and type-safe data access.
5. **Security-First Design**: Multi-layer security including Argon2/Bcrypt password hashing, JWT Access + HttpOnly Refresh Token rotation, CASL-based Attribute-Based & Role-Based Access Control (RBAC/ABAC), rate limiting, helmet security headers, and comprehensive audit logging.

```
+----------------------------------------------------------------------------------------------------+
|                                      CLIENT APPLICATION (Next.js 16+)                              |
|                                                                                                    |
|  +--------------------+  +--------------------+  +--------------------+  +----------------------+  |
|  |   Public Website   |  |   Student Portal   |  |   Parent Portal    |  | Teacher/Admin Portal |  |
|  +--------------------+  +--------------------+  +--------------------+  +----------------------+  |
|  | React Hook Form    |  | TanStack Query     |  | Tailwind + shadcn  |  | Zod Validation       |  |
|  +--------------------+  +--------------------+  +--------------------+  +----------------------+  |
+-------------------------------------------------+--------------------------------------------------+
                                                  | HTTPS / REST / JSON / OpenAPI
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                    NESTJS MODULAR MONOLITH SERVER                                  |
|                                                                                                    |
|  [Security Layer: Helmet, CORS, Rate-Limiting, Global Exception Filter, Response Interceptor]     |
|  [Auth & RBAC: JWT Strategy, Refresh Tokens, CASL Policy Guards, Audit Interceptor]                |
|                                                                                                    |
|  +------------------+  +------------------+  +------------------+  +------------------+            |
|  | Auth & Users     |  | Academics        |  | Students & Guard.|  | Attendance       |            |
|  +------------------+  +------------------+  +------------------+  +------------------+            |
|  | Examinations     |  | Finance & Fees   |  | Payroll          |  | Admissions       |            |
|  +------------------+  +------------------+  +------------------+  +------------------+            |
|  | CMS              |  | Notifications    |  | Audit & Security |  | Reports          |            |
|  +------------------+  +------------------+  +------------------+  +------------------+            |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Integrations Layer: Payment (Stripe/SSL), SMS (Twilio), Email (Resend), PDF, File Storage   |  |
|  +----------------------------------------------------------------------------------------------+  |
+-------------------------------------------------+--------------------------------------------------+
                                                  | Connection Pooling / Prisma ORM
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                NEON POSTGRESQL (Serverless Cloud DB)                               |
|                                                                                                    |
|  - 13 Domain Schemas   - Foreign Key Constraints   - Composite Indexes   - Audit Trail Tables      |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. System Domain Decomposition (13 Core Modules)

The system strictly excludes Library, Hostel, and Transport management, focusing deeply on core academic, administrative, and financial workflows:

| # | Domain Module | Primary Responsibilities |
|---|---|---|
| 1 | **Public School Website** | Landing page, About Us, Academic offerings, Faculty directory, News, Events calendar, Photo/Video gallery, Contact form. |
| 2 | **Student Portal** | Personalized dashboard, Class schedules/timetables, Attendance history, Grades/Report cards, Assignments, Fee dues/receipts, School notices. |
| 3 | **Parent Portal** | Multi-child switcher, Real-time attendance alerts, Fee invoices & instant online payment, Academic progress reports, Direct teacher communication. |
| 4 | **Teacher Portal** | Daily student attendance marking, Subject-wise grade & marks entry, Assignment management, Timetable viewing, Exam marks submission, Leave requests. |
| 5 | **Admin Dashboard** | Institution configuration, Academic year/term setup, Class/Section/Subject allocation, Staff management, Role & Permission delegation, Analytics. |
| 6 | **Accounting & Finance** | Fee head & structure management, Student fee invoicing, Online/Offline payment processing, Money receipts, Expense tracking, Financial statements. |
| 7 | **Examination & Results** | Exam creation, Grading scales (GPA/Letter/Percentage), Marksheets, Tabulation sheets, Transcript generation, Automated GPA/CGPA calculations. |
| 8 | **Attendance Management** | Student daily & subject-wise attendance, Staff/Teacher biometric/manual clock-in, Leave management (apply, approve, reject), Absence alerts. |
| 9 | **Admission Management** | Online public application form, Application processing pipeline, Entrance test/interview scheduling, Document verification, Auto-enrollment. |
| 10 | **Payroll** | Employee salary structures (Base + Allowances - Deductions), Monthly pay run, Payslip PDF generation, Tax calculation, Payment disbursement records. |
| 11 | **CMS** | Dynamic page content, Hero sliders, Notice board announcements, School news/articles, Photo albums, Testimonials, Contact inquiries. |
| 12 | **Notification & SMS** | Multi-channel dispatch (In-App WebSocket/SSE, Email via Resend/SMTP, SMS via Twilio/SMS Gateway), Templating with placeholder variables. |
| 13 | **Audit & Security** | Granular change-data audit logging (Actor, Entity, Action, Before/After Diff, IP, User-Agent), Role & Permission engine, Session tracking. |

---

## 3. High-Level Folder Structure

```
school-management-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Complete database schema across all 13 domains
│   │   ├── migrations/                # Version-controlled database migrations
│   │   └── seed.ts                    # Idempotent seed data (Admin, Roles, Academic Year)
│   ├── src/
│   │   ├── common/                    # Cross-cutting architectural primitives
│   │   │   ├── constants/             # Application-wide constants & enums
│   │   │   ├── decorators/            # @CurrentUser(), @Roles(), @Permissions(), @Audit()
│   │   │   ├── dto/                   # Base pagination, filtering, response DTOs
│   │   │   ├── filters/               # Global HttpExceptionFilter, PrismaClientExceptionFilter
│   │   │   ├── guards/                # JwtAuthGuard, RolesGuard, PermissionsGuard, ThrottlerGuard
│   │   │   ├── interceptors/          # TransformResponseInterceptor, AuditLogInterceptor, LoggingInterceptor
│   │   │   ├── pipes/                 # ValidationPipe, ParseUUIDPipe, SanitizeHtmlPipe
│   │   │   └── utils/                 # Cryptography, Date helpers, Math/GPA formulas
│   │   ├── config/                    # Environment variables validation & typed configs
│   │   ├── database/                  # PrismaService, PrismaModule, Soft-delete middleware
│   │   ├── integrations/              # External service adapters (Ports & Adapters)
│   │   │   ├── email/                 # Resend / Nodemailer adapter
│   │   │   ├── sms/                   # Twilio / Generic SMS Gateway adapter
│   │   │   ├── storage/               # S3 / Cloudinary / Local Disk storage adapter
│   │   │   ├── payment/               # Stripe / SSLCommerz payment strategy adapter
│   │   │   └── pdf/                   # PDF generation engine (Puppeteer / PDFKit)
│   │   ├── modules/                   # 13 Domain Modules (Controllers, Services, DTOs, Entities)
│   │   │   ├── auth/                  # Authentication, JWT, Refresh Tokens, Password Reset
│   │   │   ├── users/                 # User management & Profile CRUD
│   │   │   ├── rbac/                  # Roles, Permissions, CASL Abilities
│   │   │   ├── academics/             # Academic Years, Terms, Classes, Sections, Subjects
│   │   │   ├── students/              # Student records, Enrollments, Guardian links
│   │   │   ├── parents/               # Parent profiles & Linked children
│   │   │   ├── teachers/              # Teacher profiles & Subject assignments
│   │   │   ├── attendance/            # Student & Staff Attendance, Leave requests
│   │   │   ├── examinations/          # Exams, Schedules, Marks, Grading, Report Cards
│   │   │   ├── finance/               # Fee Structures, Invoices, Payments, Receipts, Expenses
│   │   │   ├── payroll/               # Salary Structures, Pay Runs, Payslips, Tax
│   │   │   ├── admissions/            # Applications, Pipeline stages, Document uploads
│   │   │   ├── cms/                   # Pages, Sliders, Notices, News, Gallery, Inquiries
│   │   │   ├── notifications/         # Notification templates, Event triggers, SMS/Email dispatch
│   │   │   ├── audit/                 # Audit logging queries & Security event tracking
│   │   │   └── reports/               # Aggregate analytical reports (Attendance, Finance, Academics)
│   │   ├── app.module.ts              # Root application module wiring all features
│   │   └── main.ts                    # Bootstrap entry point (Swagger, CORS, Helmet, Pipes)
│   ├── test/                          # E2E test suites (Supertest)
│   ├── .env.example                   # Backend environment template
│   ├── package.json                   # Dependencies & build scripts
│   └── tsconfig.json                  # Strict TypeScript configuration
├── frontend/
│   ├── public/                        # Static assets, logos, favicon, placeholder images
│   ├── src/
│   │   ├── app/                       # Next.js 16+ App Router
│   │   │   ├── (public)/              # Public School Website & CMS
│   │   │   │   ├── page.tsx           # School Homepage
│   │   │   │   ├── about/             # About Us / Mission / History
│   │   │   │   ├── academics/         # Academic Programs & Curriculum
│   │   │   │   ├── admissions/        # Online Admission Application Form
│   │   │   │   ├── faculty/           # Teachers / Staff Directory
│   │   │   │   ├── news/              # News & Events Articles
│   │   │   │   ├── gallery/           # Photo & Video Gallery
│   │   │   │   ├── contact/           # Contact Form & Campus Map
│   │   │   │   └── layout.tsx         # Public Layout (Header, Nav, Footer)
│   │   │   ├── (auth)/                # Authentication Pages
│   │   │   │   ├── login/             # Role-aware Login Form
│   │   │   │   ├── forgot-password/   # Password Reset Request
│   │   │   │   ├── reset-password/    # Password Reset Confirmation
│   │   │   │   └── layout.tsx         # Clean Minimal Auth Layout
│   │   │   ├── (dashboard)/           # Protected Portals
│   │   │   │   ├── admin/             # Administrator & Principal Management
│   │   │   │   ├── teacher/           # Teacher Attendance, Grading & Classroom
│   │   │   │   ├── student/           # Student Grades, Timetable & Fees
│   │   │   │   ├── parent/            # Multi-child Portal & Online Fee Payment
│   │   │   │   ├── accountant/        # Finance, Fee Invoicing & Payroll Run
│   │   │   │   └── layout.tsx         # Role-Aware Dashboard Shell (Sidebar, Header)
│   │   │   ├── api/                   # Next.js BFF (Backend for Frontend) proxy routes if needed
│   │   │   ├── layout.tsx             # Root HTML layout (Fonts, Providers)
│   │   │   ├── not-found.tsx          # 404 Page
│   │   │   └── error.tsx              # Global Error Boundary
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui components (Button, Table, Form, Dialog, etc.)
│   │   │   ├── shared/                # Custom reusable components (DataTable, StatCard, PDFViewer)
│   │   │   ├── layouts/               # DashboardNav, Sidebar, Header, Breadcrumbs, UserMenu
│   │   │   └── forms/                 # Reusable domain forms (StudentForm, FeeInvoiceForm, etc.)
│   │   ├── hooks/                     # Custom hooks (useAuth, usePermissions, useDebounce)
│   │   ├── lib/
│   │   │   ├── api/                   # Axios client instance, Interceptors, API functions
│   │   │   ├── validators/            # Zod validation schemas
│   │   │   └── utils/                 # Formatting, CVA helpers, Date formatting
│   │   ├── providers/                 # TanStack Query, Auth, Theme, Toast providers
│   │   └── types/                     # Shared TypeScript interfaces & DTOs
│   ├── .env.example                   # Frontend environment template
│   ├── next.config.ts                 # Next.js configuration
│   ├── tailwind.config.ts             # Tailwind CSS configuration & design tokens
│   ├── package.json                   # Dependencies & scripts
│   └── tsconfig.json                  # Strict TypeScript configuration
└── docs/
    ├── architecture.md                # System Architecture Document (This document)
    ├── database.md                    # Database ERD & Schema Design Document
    ├── api.md                         # REST API & OpenAPI Specifications
    ├── business-rules.md              # Domain Business Logic & Calculations
    └── development-plan.md            # Roadmap, Milestones & Testing Strategy
```

---

## 4. Architectural Patterns & Layering

### 4.1 Clean Layered Architecture in NestJS
Each module follows a clean separation of concerns:
1. **Controller Layer (`*.controller.ts`)**: Handles HTTP requests, parameter validation via DTOs, Swagger documentation decorators, and route-level authorization guards.
2. **Service Layer (`*.service.ts`)**: Contains core business logic, domain validations, transaction boundaries (`prisma.$transaction`), and external integration coordination.
3. **Data Access Layer (`PrismaService`)**: Encapsulates database queries, relation loading, filtering, and indexing.
4. **DTO Layer (`dto/*.dto.ts`)**: Request and response data transfer objects validated with `class-validator` and `class-transformer`.

### 4.2 Frontend Architecture (Next.js 16+ App Router)
1. **Server vs. Client Components**:
   - Public pages use Server Components for maximum SEO, fast initial load, and minimal client JS bundle.
   - Interactive dashboard forms and data tables use Client Components with TanStack Query (`useQuery`, `useMutation`) for client caching, optimistic updates, and instant pagination/filtering.
2. **State Management**:
   - Server State: Managed by **TanStack Query (React Query)** with standard stale-time and automated cache invalidation.
   - Client/Form State: Managed by **React Hook Form** + **Zod** resolver.
   - Auth/Session State: Managed via custom `AuthContext` + secure HTTP-only cookies with bearer token sync.

---

## 5. Security & Authentication Architecture

### 5.1 Authentication Flow (Access + Refresh Token Rotation)
1. **Login**: User submits credentials (`email`/`username` + `password`).
2. **Verification**: Password verified using Argon2/Bcrypt. Account status checked (Active, Suspended, Pending).
3. **Token Issuance**:
   - **Access Token**: Short-lived (15 minutes), signed JWT containing `{ sub: userId, role: Role, permissions: string[], schoolId?: string }`.
   - **Refresh Token**: Long-lived (7 days), cryptographically secure random token hashed and stored in database `RefreshToken` table with device fingerprint.
4. **Token Refresh**: When access token expires (401 response), frontend Axios interceptor automatically requests `/api/v1/auth/refresh` using the refresh token. Old refresh token is revoked and rotated.
5. **Brute Force Protection**: NestJS Throttler guards limit authentication endpoints to 5 attempts per minute per IP.

### 5.2 Authorization Architecture (RBAC + ABAC)
1. **Roles Enum**: `SUPER_ADMIN`, `ADMIN`, `PRINCIPAL`, `TEACHER`, `ACCOUNTANT`, `STUDENT`, `PARENT`.
2. **Permissions**: Granular claims such as `students:create`, `grades:submit`, `invoices:issue`, `payroll:approve`.
3. **Role & Permission Guards**: `@Roles(Role.ADMIN, Role.TEACHER)` and `@Permissions('grades:submit')` enforce access at endpoint level.
4. **Attribute-Based Access Control (ABAC)**:
   - A `STUDENT` can only access their own grades, attendance, and fee invoices (`WHERE student.userId = req.user.id`).
   - A `PARENT` can only access records of their linked children (`WHERE student.guardianId = req.user.id`).
   - A `TEACHER` can only submit grades/attendance for classes and sections assigned to them in the current academic term.

---

## 6. Cross-Cutting Integrations

### 6.1 Storage Adapter (File Uploads)
- Interfaces define `StorageService` (`uploadFile`, `deleteFile`, `getPresignedUrl`).
- Implementations: Local disk storage for development, AWS S3 / Cloudinary for production.
- Validation: Strict MIME type checking (PDF, JPEG, PNG) and file size limits (e.g., max 5MB for documents, 2MB for profile photos).

### 6.2 PDF Generation Engine
- Engine: Puppeteer / PDFKit server-side rendering with HTML/CSS templates.
- Generated Documents:
  - Student Academic Report Cards & Transcripts
  - Fee Invoices & Payment Money Receipts
  - Employee Monthly Payslips
  - Student & Staff ID Cards
  - Examination Tabulation Sheets

### 6.3 Notification & SMS Architecture
- **Event-Driven Dispatcher**: Modules emit events (e.g. `INVOICE_GENERATED`, `ATTENDANCE_ABSENT`, `EXAM_RESULT_PUBLISHED`).
- **Notification Queue**: Background job processor handles email/SMS delivery with retry policies without blocking HTTP requests.
- **Channels**:
  - In-App: Real-time notification feed stored in database.
  - Email: Transnational templates sent via Resend / SMTP.
  - SMS: Critical alerts (e.g., emergency closures, student absence, fee due reminders) sent via Twilio / SMS Gateway.

### 6.4 Payment Gateway Architecture
- Strategy pattern supporting multiple payment processors (Stripe, Local Gateways like SSLCommerz).
- Webhook endpoints verify digital signatures to record successful payments, mark invoices as `PAID`, generate sequential receipt numbers, and emit payment receipt notifications.
- Idempotency keys prevent duplicate charges.

### 6.5 Audit Logging Architecture
- **Automatic Audit Interceptor**: Intercepts mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) on sensitive resources.
- Records:
  - `actorId` (User who performed the action)
  - `action` (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `EXPORT`, `APPROVAL`)
  - `entityName` (e.g., `FeePayment`, `ExamMark`, `StudentProfile`)
  - `entityId`
  - `beforeState` & `afterState` JSON snapshots
  - `ipAddress` & `userAgent`
  - `timestamp`

---

## 7. Scalability & Production Readiness

1. **Database Connection Pooling**: Neon PgBouncer connection pooling ensures high-concurrency connections without exhausting database socket limits.
2. **Caching Strategy**: In-memory Redis caching for frequently read, rarely changed configuration data (Academic terms, Grading scales, School profile).
3. **Health Checks & Monitoring**: `/api/v1/health` endpoint integrated with Terminus for database, memory, and disk health metrics.
4. **Structured JSON Logging**: Winston / Pino logger producing structured JSON output for log ingestion into Grafana / Datadog / CloudWatch.
