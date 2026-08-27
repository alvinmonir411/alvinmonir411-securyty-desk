import { Logger } from '@nestjs/common';

export interface SMSProviderResult {
  success: boolean;
  gateway: string;
  responseCode?: string;
  messageId?: string;
  error?: string;
}

export interface SMSProvider {
  name: string;
  send(to: string, message: string): Promise<SMSProviderResult>;
}

export class MockSMSProvider implements SMSProvider {
  public readonly name = 'MOCK_GATEWAY';
  private readonly logger = new Logger(MockSMSProvider.name);

  async send(to: string, message: string): Promise<SMSProviderResult> {
    const messageId = `sim_sms_${Math.random().toString(36).substring(2, 10)}`;
    this.logger.log(`[SMS SIMULATION] Dispatched to: ${to} | Message: "${message}" | ID: ${messageId}`);
    return {
      success: true,
      gateway: this.name,
      responseCode: '200_OK_SIMULATED',
      messageId,
    };
  }
}

export class TwilioSMSProvider implements SMSProvider {
  public readonly name = 'TWILIO';
  private readonly logger = new Logger(TwilioSMSProvider.name);

  constructor(
    private readonly accountSid: string,
    private readonly authToken: string,
    private readonly fromNumber: string,
  ) {}

  async send(to: string, message: string): Promise<SMSProviderResult> {
    try {
      this.logger.log(`[TWILIO] Sending SMS to ${to}...`);
      // Simulating clean Twilio client invocation
      return {
        success: true,
        gateway: this.name,
        responseCode: 'TWILIO_QUEUED',
        messageId: `tw_sm_${Math.random().toString(36).substring(2, 10)}`,
      };
    } catch (err: any) {
      this.logger.error(`[TWILIO] SMS sending failed: ${err.message}`);
      return {
        success: false,
        gateway: this.name,
        error: err.message,
      };
    }
  }
}
