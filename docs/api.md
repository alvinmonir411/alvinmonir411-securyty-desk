# REST API & OpenAPI Specification

## 1. REST Conventions & Standards

The School Management System API is structured according to strict REST principles, providing predictable URLs, HTTP status codes, standard JSON request/response formats, and OpenAPI (Swagger 3.0) compliance.

- **Base URL**: `/api/v1`
- **Interactive Documentation**: Swagger UI available at `http://localhost:4000/api/docs` and OpenAPI JSON at `http://localhost:4000/api/docs-json`.
- **Content Type**: `application/json` for all data exchange; `multipart/form-data` for file uploads.
- **Date/Time Standard**: ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`).

---

## 2. Standard Request & Response Envelopes

### 2.1 Success Response Envelope
All successful responses are automatically wrapped by the global `TransformResponseInterceptor`:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Students retrieved successfully",
  "data": [
    {
      "id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "admissionNumber": "ADM-2026-001",
      "firstName": "Alex",
      "lastName": "Johnson",
      "status": "ACTIVE"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 2.2 Standard Error Response Envelope
Handled centrally by `HttpExceptionFilter` and `PrismaClientExceptionFilter`:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": "BAD_REQUEST",
  "errors": [
    {
      "field": "email",
      "message": "email must be a valid email address"
    },
    {
      "field": "dateOfBirth",
      "message": "dateOfBirth must be a valid ISO date string"
    }
  ],
  "timestamp": "2026-08-26T12:00:00.000Z",
  "path": "/api/v1/students"
}
```

---

## 3. Standard Query Parameters for Listing Endpoints

All collection endpoints (`GET /api/v1/{resource}`) support uniform pagination, sorting, and filtering:

| Parameter | Type | Default | Description | Example |
|---|---|---|---|---|
| `page` | integer | `1` | 1-based page number | `?page=2` |
| `limit` | integer | `10` | Items per page (max 100) | `?limit=25` |
| `search` | string | `""` | Full-text query against searchable fields | `?search=john` |
| `sortBy` | string | `"createdAt"` | Field to sort by | `?sortBy=admissionNumber` |
| `sortOrder` | string | `"desc"` | Sort direction (`asc` or `desc`) | `?sortOrder=asc` |
| `status` | string | `""` | Filter by entity status enum | `?status=ACTIVE` |
| `academicYearId` | string | `""` | Filter by Academic Year UUID | `?academicYearId=UUID` |

---

## 4. Authentication & Header Specifications

All protected endpoints require a valid JWT Bearer token:

```http
Authorization: Bearer <access_token>
```

When calling mutation endpoints where idempotency is crucial (e.g. payment processing, monthly payroll generation), an `Idempotency-Key` header can be supplied:

```http
Idempotency-Key: <unique-client-uuid>
```

---

## 5. Domain API Endpoint Catalog

### 5.1 Authentication & Profile (`/api/v1/auth`)
- `POST /auth/login` — User login with email/password (returns Access Token & sets HttpOnly Refresh Token cookie).
- `POST /auth/refresh` — Issue fresh access token using refresh token.
- `POST /auth/logout` — Invalidate refresh token and clear cookie.
- `POST /auth/forgot-password` — Initiate password reset email.
- `POST /auth/reset-password` — Complete password reset with verification token.
- `GET /auth/me` — Retrieve current authenticated user profile and permissions.
- `PATCH /auth/change-password` — Update user password.

### 5.2 Academic Setup (`/api/v1/academics`)
- `GET/POST /academics/years` — Manage Academic Years.
- `GET/POST /academics/terms` — Manage Academic Terms/Semesters.
- `GET/POST /academics/classes` — Manage Classes / Grade levels.
- `GET/POST /academics/sections` — Manage Sections.
- `GET/POST /academics/subjects` — Manage Subject catalog.
- `GET/POST /academics/timetables` — Query and generate weekly class timetables.

### 5.3 Students & Guardians (`/api/v1/students`, `/api/v1/parents`)
- `GET /students` — Filterable student list (Pagination, Class, Section, Status).
- `POST /students` — Create new student profile & assign admission number.
- `GET /students/:id` — Detailed student profile with enrollment history, guardian, and attendance summary.
- `PATCH /students/:id` — Update student profile.
- `POST /students/:id/enroll` — Enroll student into an academic year, class, and section.
- `GET /parents` — List guardian profiles.
- `POST /parents/link-student` — Link guardian to student with relationship type.

### 5.4 Teachers & Staff (`/api/v1/teachers`)
- `GET /teachers` — Staff directory with departments and designations.
- `POST /teachers` — Create teacher profile and system account.
- `GET /teachers/:id/schedule` — Retrieve teacher weekly teaching timetable.
- `POST /teachers/assign-subject` — Assign teacher to class, section, and subject.

### 5.5 Attendance (`/api/v1/attendance`)
- `POST /attendance/students/mark` — Bulk mark student attendance for a class/section and date.
- `GET /attendance/students/class` — Get daily attendance matrix for a class/section.
- `GET /attendance/students/:studentId/summary` — Monthly/yearly attendance statistics for a student.
- `POST /attendance/staff/clock-in` — Staff clock-in timestamp.
- `POST /attendance/staff/clock-out` — Staff clock-out timestamp.
- `POST /attendance/leaves` — Submit student/staff leave application.
- `PATCH /attendance/leaves/:id/status` — Approve or reject leave application.

### 5.6 Examinations & Results (`/api/v1/examinations`)
- `GET/POST /examinations/terms` — Examination terms (e.g. Mid-term 2026).
- `GET/POST /examinations/schedules` — Exam timetable per class and subject.
- `POST /examinations/marks/submit` — Bulk submit marks for subject and student list.
- `GET /examinations/results/student/:studentId` — Student examination transcript.
- `GET /examinations/results/tabulation` — Full class tabulation sheet.
- `GET /examinations/report-cards/:studentId/pdf` — Stream compiled PDF report card.

### 5.7 Finance & Accounting (`/api/v1/finance`)
- `GET/POST /finance/fee-categories` — Fee types (Tuition, Lab, Admission).
- `GET/POST /finance/fee-structures` — Configure fees per class level.
- `POST /finance/invoices/generate-bulk` — Bulk generate monthly fee invoices for class/section.
- `GET /finance/invoices` — List fee invoices with payment status filter.
- `GET /finance/invoices/:id` — Detailed invoice breakdown.
- `POST /finance/payments/record-offline` — Record manual cash/bank payment.
- `POST /finance/payments/create-checkout-session` — Create Stripe/gateway payment intent.
- `POST /finance/webhooks/stripe` — Process asynchronous payment confirmation webhooks.
- `GET /finance/payments/:id/receipt-pdf` — Download official money receipt PDF.
- `GET/POST /finance/expenses` — Track operational expenses with receipt attachments.

### 5.8 Payroll (`/api/v1/payroll`)
- `GET/POST /payroll/salary-structures` — Configure employee salary brackets.
- `POST /payroll/pay-runs/generate` — Generate monthly pay run for active staff.
- `PATCH /payroll/pay-runs/:id/approve` — Approve and lock monthly pay run.
- `GET /payroll/payslips/:id/pdf` — Download individual salary payslip PDF.

### 5.9 Admissions (`/api/v1/admissions`)
- `POST /admissions/apply` — Public admission application submission.
- `GET /admissions/applications` — Admin list of applications with filter by stage.
- `PATCH /admissions/applications/:id/status` — Update application stage (Review, Test, Accept, Reject).
- `POST /admissions/applications/:id/convert-to-student` — Auto-provision Student and Parent user accounts.

### 5.10 CMS & Public Website (`/api/v1/cms`)
- `GET /cms/pages/:slug` — Fetch public page content.
- `GET /cms/notices` — Public notice board feed.
- `GET /cms/articles` — News and blog articles.
- `GET /cms/gallery` — Photo albums and media.
- `POST /cms/contact` — Public contact form submission.

### 5.11 Notifications & SMS (`/api/v1/notifications`)
- `GET /notifications/in-app` — Authenticated user's notification list.
- `PATCH /notifications/in-app/:id/read` — Mark notification as read.
- `POST /notifications/send-broadcast` — Send broadcast SMS/Email announcement to selected roles or classes.

### 5.12 Audit & Security (`/api/v1/audit`)
- `GET /audit/logs` — Query audit logs with actor, date range, entity type, and action filters.
