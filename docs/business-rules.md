# Business Logic & Institutional Rules

## 1. Academic & Grading System Rules

### 1.1 Standard Grading Scale & GPA Formula
The system supports configurable grading scales (e.g. 4.0 GPA, 5.0 GPA, or Letter Grading). The default standard 5.0 scale:

| Mark Range (%) | Letter Grade | Grade Point (GP) | Remarks |
|---|---|---|---|
| 80 – 100 | A+ | 5.00 | Outstanding |
| 70 – 79 | A | 4.00 | Excellent |
| 60 – 69 | A- | 3.50 | Very Good |
| 50 – 59 | B | 3.00 | Good |
| 40 – 49 | C | 2.00 | Satisfactory |
| 33 – 39 | D | 1.00 | Pass |
| 0 – 32 | F | 0.00 | Fail |

### 1.2 Component Mark Breakdown & Weighted Score
Each subject assessment consists of configurable components:
1. **Continuous Assessment (Class Tests & Quizzes)**: Weight = 20%
2. **Assignments & Homework**: Weight = 10%
3. **Mid-Term Examination**: Weight = 20%
4. **Final Term Examination**: Weight = 50%

$$\text{Final Subject Score} = \sum (\text{Component Score} \times \text{Weight})$$

### 1.3 Grade Point Average (GPA) Calculation
$$\text{GPA} = \frac{\sum (\text{Subject Grade Point} \times \text{Credit Hours})}{\sum \text{Credit Hours}}$$

- If a student scores `F` (0.00 GP) in any **mandatory** subject, the term GPA is automatically assigned `0.00 (F)`, regardless of high scores in other subjects.

### 1.4 Student Academic Promotion Criteria
A student is eligible for promotion to the subsequent grade level if:
1. They achieve a minimum overall Cumulative GPA (CGPA) of **2.00**.
2. They do not fail in more than **1 non-core subject**.
3. Overall annual student attendance meets or exceeds **75%**.

---

## 2. Attendance Business Rules

### 2.1 Daily & Period Attendance States
- **PRESENT**: Student present in classroom.
- **LATE**: Student arrives >15 minutes after session commencement (3 LATE instances = 1 UNEXCUSED ABSENT).
- **EXCUSED**: Absence covered by an approved `LeaveRequest`.
- **UNEXCUSED / ABSENT**: Student absent without verified authorization.
- **HALF_DAY**: Student departs school early with approved gate pass.

### 2.2 Exam Eligibility Threshold
- **Standard Threshold**: Minimum **75%** verified attendance in the term.
- **Condonation Range (65% – 74%)**: Permitted only upon Principal approval and payment of fine.
- **Disqualified (< 65%)**: Student debarred from sitting term final examinations.

### 2.3 Automated Notification Triggers
- When student attendance is marked `ABSENT`, the notification engine automatically dispatches an SMS alert to the linked primary guardian phone number at 10:30 AM.

---

## 3. Finance, Fee Calculation & Late Fine Rules

### 3.1 Fee Invoice Generation
- **Cycle**: Generated on the 1st day of each month or term.
- **Due Date**: 15th calendar day of the issuance month.
- **Grace Period**: 5 days (until 20th of the month).

### 3.2 Late Penalty Calculation
- If an invoice remains unpaid past the grace period, a late fine is applied:
  $$\text{Late Fine} = \begin{cases} 0 & \text{if } \text{Date} \le \text{Grace Date} \\ \$10 \text{ (Flat Fee)} + 0.5\% \text{ per day overdue} & \text{if } \text{Date} > \text{Grace Date} \end{cases}$$

### 3.3 Payment Reconciliation & Receipts
- **Partial Payments**: Allowed; system updates invoice status from `UNPAID` to `PARTIAL`.
- **Sequential Receipt Numbers**: Receipts follow immutable format: `RCP-YYYY-XXXXX` (e.g. `RCP-2026-00042`).
- **Voiding Invoices**: Only allowed for `DRAFT` or `UNPAID` invoices with mandatory audit remark. `PAID` invoices cannot be deleted or voided directly—must issue a credit note/refund transaction.

---

## 4. Payroll Calculation Rules

### 4.1 Salary Computation
$$\text{Gross Salary} = \text{Base Salary} + \text{House Rent Allowance (HRA)} + \text{Medical Allowance} + \text{Special Allowance}$$
$$\text{Total Deductions} = \text{Provident Fund (PF)} + \text{Income Tax (TDS)} + \text{Unpaid Leave Deduction}$$
$$\text{Net Payable} = \text{Gross Salary} - \text{Total Deductions}$$

### 4.2 Unpaid Leave Deduction Formula
$$\text{Per Day Salary} = \frac{\text{Base Salary}}{\text{Total Working Days in Month}}$$
$$\text{Leave Deduction} = \text{Per Day Salary} \times \text{Unapproved Absent Days}$$

---

## 5. Admission Management Workflow

```
[Public Application Submitted] 
         │
         ▼
[Under Verification & Document Review] ──(Rejected)──► [Application Rejected]
         │ (Accepted for Evaluation)
         ▼
[Entrance Test / Interview Scheduled]
         │
         ▼
[Merit List Publication / Accepted]
         │ (Fee Payment Completed)
         ▼
[Converted to Student & Guardian Accounts Created]
```

- **Admission Number Generation**: Automatic unique sequence: `ADM-{YEAR}-{4-digit incremental counter}` (e.g., `ADM-2026-0104`).
- **Roll Number Assignment**: Automatic sequential roll number assignment within Class-Section based on merit rank or alphabetical order.

---

## 6. Audit & Security Invariants

1. **Audit Immutability**: The `AuditLog` table cannot be altered or deleted through application APIs.
2. **Password Policy**: Minimum 8 characters, at least 1 uppercase letter, 1 number, and 1 special symbol. Hashed with Argon2 (12 rounds) or Bcrypt (10 rounds).
3. **Session Revocation**: Password change immediately revokes all active refresh tokens across all user devices.
