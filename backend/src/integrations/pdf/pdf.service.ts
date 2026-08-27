import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PDFService {
  private readonly logger = new Logger(PDFService.name);

  async generateMarksheetPDF(data: {
    studentName: string;
    admissionNumber: string;
    examTitle: string;
    className: string;
    gpa: number;
    gradeLetter: string;
    classRank: number;
    subjects: Array<{ name: string; totalMarks: number; obtainedMarks: number; gradeLetter: string; gradePoint: number }>;
  }): Promise<Buffer> {
    this.logger.log(`[PDF] Generating Official Marksheet PDF for ${data.admissionNumber} (${data.examTitle})`);
    return Buffer.from(
      `%PDF-1.4 Marksheet: ${data.studentName} [${data.admissionNumber}] - GPA: ${data.gpa.toFixed(2)} (${data.gradeLetter})`,
    );
  }

  async generateReceiptPDF(data: {
    receiptNumber: string;
    invoiceNumber: string;
    studentName: string;
    amount: number;
    paymentMethod: string;
    date: Date;
  }): Promise<Buffer> {
    this.logger.log(`[PDF] Generating Money Receipt PDF for ${data.receiptNumber}`);
    return Buffer.from(`%PDF-1.4 Money Receipt: ${data.receiptNumber} - Paid: ৳${data.amount}`);
  }

  async generatePayslipPDF(data: {
    payslipNumber: string;
    teacherName: string;
    month: number;
    year: number;
    baseSalary: number;
    totalAllowance: number;
    totalDeduction: number;
    netSalary: number;
  }): Promise<Buffer> {
    this.logger.log(`[PDF] Generating Salary Payslip PDF for ${data.payslipNumber}`);
    return Buffer.from(`%PDF-1.4 Payslip: ${data.payslipNumber} - Net Salary: ৳${data.netSalary}`);
  }

  async generateAdmitCardPDF(data: {
    admitCardNumber: string;
    studentName: string;
    admissionNumber: string;
    examTitle: string;
    className: string;
    sectionName: string;
  }): Promise<Buffer> {
    this.logger.log(`[PDF] Generating Exam Admit Card PDF for ${data.admitCardNumber}`);
    return Buffer.from(`%PDF-1.4 Candidate Admit Card: ${data.admitCardNumber} - ${data.studentName}`);
  }

  async generateApplicationPDF(data: {
    applicationNumber: string;
    applicantName: string;
    targetClass: string;
    parentPhone: string;
  }): Promise<Buffer> {
    this.logger.log(`[PDF] Generating Admission Application PDF for ${data.applicationNumber}`);
    return Buffer.from(`%PDF-1.4 Admission Application: ${data.applicationNumber} - ${data.applicantName}`);
  }

  async generateStudentIDCardPDF(data: {
    studentName: string;
    admissionNumber: string;
    className: string;
    sectionName: string;
    bloodGroup: string;
    emergencyContact: string;
  }): Promise<Buffer> {
    this.logger.log(`[PDF] Generating Student Identity Card PDF for ${data.admissionNumber}`);
    return Buffer.from(`%PDF-1.4 Student Identity Card: ${data.admissionNumber} - ${data.studentName}`);
  }

  async generateTabulationSheetPDF(data: {
    examTitle: string;
    className: string;
    studentsCount: number;
  }): Promise<Buffer> {
    this.logger.log(`[PDF] Generating Tabulation Sheet Matrix PDF for ${data.examTitle}`);
    return Buffer.from(`%PDF-1.4 Tabulation Sheet: ${data.examTitle} [Class: ${data.className}]`);
  }
}
