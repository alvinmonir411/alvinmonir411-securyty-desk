import { Logger } from '@nestjs/common';

export interface PaymentProcessOptions {
  amount: number;
  currency?: string;
  invoiceNumber: string;
  studentId: string;
  paymentMethod: string;
  metadata?: Record<string, any>;
}

export interface PaymentProcessResult {
  success: boolean;
  gateway: string;
  transactionReference: string;
  paidAmount: number;
  rawResponse?: any;
  error?: string;
}

export interface PaymentProvider {
  name: string;
  processPayment(options: PaymentProcessOptions): Promise<PaymentProcessResult>;
  verifyPayment(transactionReference: string): Promise<boolean>;
}

export class MockPaymentProvider implements PaymentProvider {
  public readonly name = 'MOCK_PAYMENT_GATEWAY';
  private readonly logger = new Logger(MockPaymentProvider.name);

  async processPayment(options: PaymentProcessOptions): Promise<PaymentProcessResult> {
    const transactionReference = `TXN-${options.paymentMethod.toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    this.logger.log(
      `[MOCK PAYMENT] Processed $${options.amount} for Invoice #${options.invoiceNumber} via ${options.paymentMethod}. Ref: ${transactionReference}`,
    );

    return {
      success: true,
      gateway: this.name,
      transactionReference,
      paidAmount: options.amount,
      rawResponse: {
        status: 'SUCCESS',
        paymentMethod: options.paymentMethod,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async verifyPayment(transactionReference: string): Promise<boolean> {
    this.logger.log(`[MOCK PAYMENT] Verified transaction ${transactionReference}`);
    return true;
  }
}

export class StripePaymentProvider implements PaymentProvider {
  public readonly name = 'STRIPE';
  private readonly logger = new Logger(StripePaymentProvider.name);

  constructor(private readonly apiKey: string) {}

  async processPayment(options: PaymentProcessOptions): Promise<PaymentProcessResult> {
    try {
      this.logger.log(`[STRIPE] Initiating charge of $${options.amount} for Invoice ${options.invoiceNumber}`);
      const transactionReference = `ch_stripe_${Math.random().toString(36).substring(2, 12)}`;
      return {
        success: true,
        gateway: this.name,
        transactionReference,
        paidAmount: options.amount,
      };
    } catch (err: any) {
      return {
        success: false,
        gateway: this.name,
        transactionReference: '',
        paidAmount: 0,
        error: err.message,
      };
    }
  }

  async verifyPayment(transactionReference: string): Promise<boolean> {
    return true;
  }
}
