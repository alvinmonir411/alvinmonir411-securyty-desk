import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from './finance.module';
import { PrismaService } from '../../database/prisma.service';
import { PaymentService } from '../../integrations/payment/payment.service';
import { PDFService } from '../../integrations/pdf/pdf.service';
import { InvoiceStatus, PaymentMethod, AuditAction, CashTransactionType, BankTransactionType } from '@prisma/client';

describe('Finance ERP Service (Transactional & Financial Accuracy Tests)', () => {
  let service: FinanceService;
  let prisma: any;
  let paymentService: any;
  let pdfService: any;

  beforeEach(async () => {
    prisma = {
      feeType: {
        create: jest.fn().mockResolvedValue({ id: 'ft-1', name: 'Tuition Fee' }),
        findMany: jest.fn().mockResolvedValue([{ id: 'ft-1', name: 'Tuition Fee' }]),
      },
      feeStructure: {
        upsert: jest.fn().mockResolvedValue({ id: 'fs-1', amount: 250.0 }),
        findMany: jest.fn().mockResolvedValue([
          { id: 'fs-1', feeTypeId: 'ft-1', amount: 250.0, feeType: { name: 'Tuition Fee' } },
        ]),
      },
      studentEnrollment: {
        findMany: jest.fn().mockResolvedValue([
          { studentId: 'st-1', student: { admissionNumber: 'ADM-001' } },
        ]),
      },
      invoice: {
        upsert: jest.fn().mockImplementation(({ create, update }) => Promise.resolve({ id: 'inv-1', ...create, ...update })),
        create: jest.fn().mockResolvedValue({ id: 'inv-1', totalAmount: 250.0, paidAmount: 0.0, status: InvoiceStatus.UNPAID }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'inv-1',
          invoiceNumber: 'INV-2026-03-ADM-001',
          studentId: 'st-1',
          totalAmount: 250.0,
          paidAmount: 0.0,
          status: InvoiceStatus.UNPAID,
          student: { firstName: 'Alex', lastName: 'Johnson' },
        }),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'inv-1', ...data })),
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({
          _sum: { totalAmount: 10000.0, paidAmount: 2000.0 },
        }),
      },
      invoiceItem: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      payment: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'pay-1', ...data })),
        aggregate: jest.fn().mockResolvedValue({
          _sum: { amount: 5000.0 },
        }),
      },
      paymentTransaction: {
        create: jest.fn().mockResolvedValue({ id: 'pt-1' }),
      },
      receipt: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'rcp-1', ...data })),
        findUnique: jest.fn().mockResolvedValue({ id: 'rcp-1', receiptNumber: 'RCP-2026-001' }),
      },
      cashTransaction: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'cash-1', ...data })),
        findMany: jest.fn().mockResolvedValue([
          { transactionType: CashTransactionType.CASH_IN, amount: 5000 },
          { transactionType: CashTransactionType.CASH_OUT, amount: 1000 },
        ]),
      },
      bankTransaction: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'bank-1', ...data })),
        findMany: jest.fn().mockResolvedValue([
          { transactionType: BankTransactionType.DEPOSIT, amount: 20000 },
          { transactionType: BankTransactionType.WITHDRAWAL, amount: 5000 },
        ]),
      },
      expense: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'exp-1', ...data })),
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({
          _sum: { amount: 1000.0 },
        }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
      $transaction: jest.fn().mockImplementation((arg) => {
        if (typeof arg === 'function') {
          return arg(prisma);
        }
        return Promise.all(arg);
      }),
    };

    paymentService = {
      processPayment: jest.fn().mockResolvedValue({
        success: true,
        gateway: 'MOCK_GATEWAY',
        transactionReference: 'TXN-MOCK-1234',
        paidAmount: 250.0,
      }),
    };

    pdfService = {
      generateMarksheetPDF: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: PrismaService, useValue: prisma },
        { provide: PaymentService, useValue: paymentService },
        { provide: PDFService, useValue: pdfService },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
  });

  describe('1. Invoicing & Fee Generation', () => {
    it('should bulk generate monthly student invoices based on configured fee structures', async () => {
      const res = await service.generateMonthlyInvoices(
        {
          classId: 'c-1',
          academicYearId: 'ay-1',
          month: 3,
          year: 2026,
          dueDate: '2026-03-25',
          title: 'Tuition Fee — March 2026',
        },
        'admin-user',
      );

      expect(res.success).toBe(true);
      expect(res.invoicesCount).toBe(1);
      expect(prisma.invoice.upsert).toHaveBeenCalled();
      expect(prisma.invoiceItem.createMany).toHaveBeenCalled();
    });
  });

  describe('2. Transactional Payment Recording & Digital Receipts', () => {
    it('should atomically record full cash payment, update status to PAID, issue receipt and post cashbook entry', async () => {
      const res = await service.recordPayment(
        {
          invoiceId: 'inv-1',
          amount: 250.0,
          paymentMethod: PaymentMethod.CASH,
          remarks: 'Paid at campus counter',
        },
        'cashier-user',
      );

      expect(res.success).toBe(true);
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paidAmount: 250.0,
            status: InvoiceStatus.PAID,
          }),
        }),
      );
      expect(prisma.payment.create).toHaveBeenCalled();
      expect(prisma.receipt.create).toHaveBeenCalled();
      expect(prisma.cashTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          transactionType: CashTransactionType.CASH_IN,
          amount: 250.0,
        }),
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should transition to PARTIAL status when payment is less than invoice total', async () => {
      await service.recordPayment(
        {
          invoiceId: 'inv-1',
          amount: 100.0,
          paymentMethod: PaymentMethod.BKASH,
        },
        'cashier-user',
      );

      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paidAmount: 100.0,
            status: InvoiceStatus.PARTIAL,
          }),
        }),
      );
      expect(prisma.bankTransaction.create).toHaveBeenCalled();
    });
  });

  describe('3. Accounting Ledger & Dashboard Telemetry', () => {
    it('should compute cashbook and bank operating balances', async () => {
      const cash = await service.getCashbook();
      expect(cash.runningBalance).toBe(4000); // 5000 - 1000

      const bank = await service.getBankTransactions();
      expect(bank.runningBalance).toBe(15000); // 20000 - 5000
    });

    it('should compute consolidated finance metrics', async () => {
      const stats = await service.getFinanceDashboardStats();

      expect(stats.todayCollection).toBe(5000.0);
      expect(stats.outstandingFees).toBe(8000.0); // 10000 - 2000
      expect(stats.cashBalance).toBe(4000);
      expect(stats.bankBalance).toBe(15000);
      expect(stats.netBalance).toBe(19000);
    });
  });
});
