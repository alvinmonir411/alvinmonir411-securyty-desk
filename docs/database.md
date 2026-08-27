# Production Database Architecture & Schema Specification

## 1. Overview & Cloud-Native Database Architecture

The **School Management System (SMS)** utilizes **PostgreSQL** hosted on **Neon Serverless** and managed via **Prisma ORM**.

### Architectural Highlights:
1. **Third Normal Form (3NF) Normalization**: Strict domain separation preventing data redundancy while preserving referential integrity across 12 institutional modules.
2. **Dual-Endpoint Neon Strategy**:
   - **Connection Pooler (`DATABASE_URL`)**: Utilizes PgBouncer connection pooling (`?pgbouncer=true`) for transactional and concurrent application traffic.
   - **Direct Connection (`DIRECT_URL`)**: Direct PostgreSQL connection used exclusively by Prisma Migrate for schema migrations and DDL locks.
3. **Composite Integrity & Uniqueness**: Real-world constraints enforced at the database level (e.g. single enrollment per student per academic year, unique roll numbers per section per academic year, unique exam mark per student per subject).
4. **Soft Deletes & Change Capture**: Operational entities (`User`, `Student`, `Teacher`, `Invoice`) support soft deletion (`deletedAt DateTime?`), backed by immutable `AuditLog` and `LoginHistory` tables.

---

## 2. Complete Domain Data Model Reference

### 2.1 AUTHENTICATION & ACCESS CONTROL (AUTH)
- **`User`**: Primary identity entity with password hash (Bcrypt/Argon2), `UserRoleType`, `UserStatus`, and failed login tracking.
- **`Role`**: Predefined system and customized roles (`SUPER_ADMIN`, `ADMIN`, `PRINCIPAL`, `TEACHER`, `ACCOUNTANT`, `STUDENT`, `PARENT`).
- **`Permission`**: Atomic resource privileges (`action` + `resource`), e.g., `CREATE:STUDENT`, `APPROVE:PAYROLL`.
- **`UserRole` & `RolePermission`**: Join tables establishing flexible RBAC mappings.
- **`RefreshToken`**: Session tracking table with token hash, expiration, revocation flag, device info, and IP address.
- **`Session`**: Real-time browser and device session tracking table.

### 2.2 STUDENT & GUARDIAN (STUDENT)
- **`Student`**: Complete demographic and administrative profile (`admissionNumber`, `admissionDate`, `dateOfBirth`, `bloodGroup`, `emergencyContact`, `status`).
- **`Parent`**: Parent profile with employment, national ID, and contact data.
- **`Guardian`**: Legal guardian profile for non-parent custodians.
- **`StudentParent`**: Poly-parental relationship join model with `relationship` enum, `isPrimary` emergency flag, and `hasBillingAccess` permission.
- **`StudentDocument`**: Verified documents (Birth Certificates, Transcripts, Immunization Records).
- **`StudentIDCard`**: Student physical/digital ID credentials with QR codes and barcode identifiers.

### 2.3 ACADEMIC STRUCTURE (ACADEMIC)
- **`AcademicYear`**: School calendar cycle with start/end dates and `isCurrent` active flag.
- **`Class`**: Grade levels (Grade 1 through 12, Kindergarten) with `numericOrder` for sequencing.
- **`Section`**: Section groupings (Section A, Blue, Rose) with classroom capacity limits.
- **`Subject`**: Subject catalog with code, credit hours, passing marks, and total marks.
- **`ClassSubject`**: Grade-specific subject mapping with optional/mandatory status.
- **`Teacher`**: Faculty profile with employee ID, department, designation, and qualification.
- **`TeacherSubject`**: Allocation matrix assigning teachers to section, subject, and academic year.
- **`StudentEnrollment`**: Enrollment history linking student to Academic Year, Class, Section, and Roll Number.
- **`ClassRoutine`**: Weekly master schedule mapping day of week, time slots, classrooms, and allocated faculty.
- **`AcademicCalendar`**: Institutional calendar of academic milestones, terms, exams, sports days, and official holidays.
- **`Syllabus`**: Curriculum breakdown and downloadable syllabi per term, class, and subject.
- **`Booklist`**: Prescribed textbooks and reading materials per class and academic year.

### 2.4 ATTENDANCE MANAGEMENT (ATTENDANCE)
- **`StudentAttendance`**: Daily/period attendance record (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`, `HALF_DAY`).
- **`TeacherAttendance`**: Faculty clock-in and clock-out logs with timestamps and status.
- **`AttendanceSummary`**: Pre-aggregated monthly statistics (total days, present, absent, late, percentage) for high-performance dashboard querying.

### 2.5 EXAMINATION & RESULTS (EXAMINATION)
- **`Exam`**: Examination events (e.g. Mid-Term 2026, Annual Final Exam 2026).
- **`ExamSubject`**: Subject-specific exam scheduling with date, time, total marks, and pass marks.
- **`ExamRoutine`**: Class and section exam timetable.
- **`ExamSeatPlan`**: Room and bench seat allocations for examination candidates.
- **`ExamAdmitCard`**: Official examination entry admit cards with verification QR codes.
- **`Mark`**: Detailed mark entries (Theory, Practical, Viva, Continuous Assessment, Total, Grade Point).
- **`Result`**: Final compiled student academic performance (Total marks, GPA, Letter Grade, Class Rank).
- **`ResultSubject`**: Subject-by-subject score breakdown for academic transcripts.
- **`GradeScale`**: Configurable grading brackets (e.g., A+ = 80-100% / 5.0 GP).
- **`MeritPosition`**: Calculated class and section merit ranks based on GPA and aggregate score.

### 2.6 ADMISSION MANAGEMENT (ADMISSION)
- **`AdmissionApplication`**: Public candidate application with target class, candidate information, and stage pipeline status (`SUBMITTED`, `UNDER_REVIEW`, `TEST_SCHEDULED`, `ACCEPTED`, `REJECTED`, `ENROLLED`).
- **`AdmissionDocument`**: Attached birth certificates, immunization forms, and past transcripts.
- **`AdmissionPayment`**: Application processing fee payment records and transaction references.

### 2.7 FINANCE & INVOICING (FINANCE)
- **`FeeType`**: Classification of fees (Tuition, Admission, Examination, Lab, Facilities).
- **`FeeStructure`**: Configured amounts per class level, frequency (Monthly, Quarterly, Annual), and due day.
- **`StudentFee`**: Individual student billing obligation for a specific fee structure and month.
- **`Invoice`**: Official student bill with unique invoice number, subtotal, discount, fine, total amount, paid amount, and due date.
- **`InvoiceItem`**: Line item breakdown of fee categories within an invoice.
- **`Payment`**: Collected payment transaction with receipt number, payment method, and amount.
- **`PaymentTransaction`**: Gateway metadata and transaction hashes (Stripe, Local Gateways).
- **`Receipt`**: Official payment money receipt with sequential receipt number and PDF generation link.

### 2.8 ACCOUNTING & GENERAL LEDGER (ACCOUNTING)
- **`Account`**: Chart of accounts (`ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, `EXPENSE`).
- **`Ledger`**: Specific sub-ledgers (e.g., Tuition Fee Collections, Operating Expenses).
- **`LedgerEntry`**: Double-entry bookkeeping transactions with Debit/Credit amounts and running balance.
- **`Income`**: Revenue records categorized by source and linked to accounts.
- **`Expense`**: Institutional operational expenses categorized by vendor and category with receipt attachments.
- **`CashTransaction` & `BankTransaction`**: Cash register and bank deposit/withdrawal audit tracking.

### 2.9 PAYROLL & COMPENSATION (PAYROLL)
- **`SalaryStructure`**: Employee base salary structure.
- **`SalaryComponent`**: Earnings allowances (HRA, Medical) and standard deductions (Tax, PF).
- **`EmployeeSalary`**: Effective salary configuration history per teacher.
- **`Payroll`**: Monthly pay run cycle with status (`DRAFT`, `PROCESSING`, `APPROVED`, `DISBURSED`).
- **`PayrollItem`**: Individual staff pay breakdown, gross pay, total deductions, and net payable.
- **`Payslip`**: Official employee monthly payslip with unique payslip number and PDF reference.
- **`SalaryDeduction`**: Itemized deductions (Unpaid leave, Tax, Loan advances).
- **`LeaveRequest`**: Student and staff leave applications with approval workflow.

### 2.10 CONTENT MANAGEMENT SYSTEM (CMS)
- **`Page`**: Dynamic public website pages with slug and SEO meta tags.
- **`Notice`**: Circulars and notices with target audience filters (`ALL`, `STUDENTS`, `PARENTS`, `TEACHERS`).
- **`News`**: School news articles and achievements.
- **`Event`**: Upcoming school events, dates, and venues.
- **`Gallery` & `GalleryItem`**: Categorized photo albums and media items.
- **`HeroSlider`**: Homepage promotional carousel banners.
- **`PrincipalMessage` & `ChairmanMessage`**: Official institutional leadership statements.
- **`SchoolStatistic`**: Key public performance metrics displayed on landing pages.
- **`Download`**: Public downloadable resources (Prospectus, Rules, Forms).

### 2.11 NOTIFICATIONS & COMMUNICATION (COMMUNICATION)
- **`Notification`**: Real-time user in-app notification feed.
- **`NotificationTemplate`**: Standardized message templates with dynamic variable interpolation.
- **`SMSLog`**: Dispatched SMS records with gateway response codes.
- **`EmailLog`**: Dispatched email logs with delivery statuses.

### 2.12 AUDIT & SECURITY (SECURITY)
- **`AuditLog`**: Immutable change data log tracking actor, entity name, entity ID, action (`CREATE`, `UPDATE`, `DELETE`), before/after JSON snapshots, IP, and user-agent.
- **`LoginHistory`**: Historical authentication audit log with IP, device, and status (`SUCCESS`, `FAILED`).
- **`SystemSetting`**: Key-value institutional configuration repository.

---

## 3. Database Indexes & Constraint Matrix

| Model | Constraint / Index Type | Fields | Purpose |
|---|---|---|---|
| **User** | Unique | `email`, `username` | Unique identity lookups |
| **RolePermission** | Composite Unique | `[roleId, permissionId]` | Prevent duplicate permission assignment |
| **Student** | Unique | `admissionNumber` | Institutional student ID uniqueness |
| **StudentParent** | Composite Unique | `[studentId, parentId]` | Single relation link per parent-student pair |
| **StudentEnrollment** | Composite Unique | `[studentId, academicYearId]` | Single active enrollment per student per session |
| **StudentEnrollment** | Composite Unique | `[sectionId, academicYearId, rollNumber]` | Unique roll number per section per session |
| **ClassSubject** | Composite Unique | `[classId, subjectId]` | Prevent duplicate subject assignment to class |
| **TeacherSubject** | Composite Unique | `[teacherId, sectionId, subjectId, academicYearId]` | Unique faculty assignment per class-subject-year |
| **StudentAttendance**| Composite Unique | `[studentId, date, academicYearId]` | Single attendance record per student per calendar date |
| **ExamSubject** | Composite Unique | `[examId, classId, subjectId]` | Single exam timetable per class-subject |
| **Mark** | Composite Unique | `[examSubjectId, studentId]` | Unique mark entry per candidate per exam subject |
| **Result** | Composite Unique | `[examId, studentId]` | Single compiled term transcript per student |
| **FeeStructure** | Composite Unique | `[academicYearId, classId, feeTypeId]` | Unique fee rule per grade level per academic session |
| **Invoice** | Unique | `invoiceNumber` | Unique sequential billing invoice number |
| **Payment** | Unique | `receiptNumber` | Unique financial money receipt number |
| **Payroll** | Composite Unique | `[month, year]` | Single pay run execution per calendar month |
| **PayrollItem** | Composite Unique | `[payrollId, teacherId]` | Single salary disbursement per teacher per pay run |
| **AuditLog** | Index | `actorId`, `[entityName, entityId]`, `createdAt` | High-speed security and compliance queries |

---

## 4. Migration & Seeding Instructions

### 4.1 Apply Migrations
```bash
cd school-management-system/backend
# Apply database migrations to Neon PostgreSQL
npx prisma migrate deploy
```

### 4.2 Run Database Seed
```bash
# Seed default roles, super admin, teachers, students, fees, and CMS content
npm run prisma:seed
```

### 4.3 Default Seed Credentials
- **Super Admin**: `admin@school.edu` / `Admin@123456`
- **Accountant**: `accountant@school.edu` / `Admin@123456`
- **Teacher**: `sarah.connor@school.edu` / `Teacher@123456`
- **Student**: `alex.johnson@student.edu` / `Student@123456`
- **Parent**: `david.johnson@family.com` / `Parent@123456`
