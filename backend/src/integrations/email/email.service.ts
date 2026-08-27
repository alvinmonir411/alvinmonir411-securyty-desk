import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    this.logger.log(`Dispatching email to ${options.to} - Subject: "${options.subject}"`);
    // Production sends via Resend or SMTP
    return true;
  }
}
