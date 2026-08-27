import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { SMSProvider, MockSMSProvider, TwilioSMSProvider } from './sms.provider';
import { NotificationStatus } from '@prisma/client';

export interface SendSMSOptions {
  to: string;
  message: string;
}

@Injectable()
export class SMSService {
  private readonly logger = new Logger(SMSService.name);
  private provider: SMSProvider;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const twilioSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const twilioToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const twilioPhone = this.config.get<string>('TWILIO_PHONE_NUMBER');

    if (twilioSid && twilioToken && twilioPhone) {
      this.provider = new TwilioSMSProvider(twilioSid, twilioToken, twilioPhone);
      this.logger.log('SMSService initialized with TwilioSMSProvider');
    } else {
      this.provider = new MockSMSProvider();
      this.logger.log('SMSService initialized with MockSMSProvider (Development mode)');
    }
  }

  async sendSMS(options: SendSMSOptions): Promise<boolean> {
    const result = await this.provider.send(options.to, options.message);

    try {
      await this.prisma.sMSLog.create({
        data: {
          recipientPhone: options.to,
          message: options.message,
          gateway: result.gateway,
          status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
          responseCode: result.responseCode || result.error || 'N/A',
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to write to SMSLog: ${err.message}`);
    }

    return result.success;
  }
}
