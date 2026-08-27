export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'PRINCIPAL'
  | 'TEACHER'
  | 'ACCOUNTANT'
  | 'STUDENT'
  | 'PARENT'
  | 'STAFF';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HALF_DAY';

export type InvoiceStatus = 'DRAFT' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID';

export type PermissionCode =
  | 'students.read'
  | 'students.create'
  | 'students.update'
  | 'students.delete'
  | 'fees.read'
  | 'fees.create'
  | 'fees.collect'
  | 'fees.refund'
  | 'results.read'
  | 'results.create'
  | 'results.update'
  | 'results.publish'
  | 'attendance.read'
  | 'attendance.create'
  | 'attendance.update'
  | 'payroll.read'
  | 'payroll.create'
  | 'payroll.approve'
  | 'cms.read'
  | 'cms.create'
  | 'cms.update'
  | 'cms.delete'
  | 'audit.read';

export interface User {
  id: string;
  email: string;
  username?: string | null;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  permissions?: string[];
  student?: StudentProfile | null;
  teacher?: TeacherProfile | null;
  parent?: ParentProfile | null;
  studentProfile?: StudentProfile | null;
  teacherProfile?: TeacherProfile | null;
  parentProfile?: ParentProfile | null;
}

export interface StudentProfile {
  id: string;
  userId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: string | null;
  emergencyContact?: string | null;
  enrollments?: StudentEnrollment[];
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  academicYearId: string;
  sectionId: string;
  rollNumber: number;
  isActive: boolean;
  section?: Section;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string;
}

export interface ParentProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  occupation?: string | null;
}

export interface ClassRoom {
  id: string;
  name: string;
  code: string;
  numericOrder: number;
  sections?: Section[];
}

export interface Section {
  id: string;
  classId: string;
  name: string;
  capacity: number;
  class?: ClassRoom;
}

export interface FeeInvoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  title: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: InvoiceStatus;
}
