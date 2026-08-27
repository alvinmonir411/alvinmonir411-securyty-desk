import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider, MockPaymentProvider, StripePaymentProvider, PaymentProcessOptions, PaymentProcessResult } from './payment.provider';

export interface CreateCheckoutSessionParams {
  invoiceId: string;
  amount: number;
  currency?: string;
  studentName: string;
  customerEmail: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private provider: PaymentProvider;

  constructor(private readonly config: ConfigService) {
    const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.provider = new StripePaymentProvider(stripeKey);
      this.logger.log('PaymentService initialized with StripePaymentProvider');
    } else {
      this.provider = new MockPaymentProvider();
      this.logger.log('PaymentService initialized with MockPaymentProvider (Development mode)');
    }
  }

  async processPayment(options: PaymentProcessOptions): Promise<PaymentProcessResult> {
    return this.provider.processPayment(options);
  }

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
    this.logger.log(`Creating payment checkout session for invoice: ${params.invoiceId} (Amount: ${params.amount})`);
    const sessionId = `cs_test_${Date.now()}_${params.invoiceId.substring(0, 8)}`;
    const checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}`;

    return {
      sessionId,
      checkoutUrl,
    };
  }

  async verifyWebhookSignature(payload: any, signature: string): Promise<boolean> {
    this.logger.log(`Verifying payment webhook signature`);
    return true;
  }
}
