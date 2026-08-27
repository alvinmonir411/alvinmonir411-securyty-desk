import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage/storage.service';
import { PDFService } from './pdf/pdf.service';
import { EmailService } from './email/email.service';
import { SMSService } from './sms/sms.service';
import { PaymentService } from './payment/payment.service';

@Global()
@Module({
  providers: [StorageService, PDFService, EmailService, SMSService, PaymentService],
  exports: [StorageService, PDFService, EmailService, SMSService, PaymentService],
})
export class IntegrationsModule {}
