import { PrismaClient } from './../generated/prisma';
import axios from 'axios';
import { IOtpConfig, IOtpRecord } from './types';

const prisma = new PrismaClient();

export class OtpService {
  private static readonly DEFAULT_LENGTH = 6;
  private static readonly DEFAULT_EXPIRY_MINUTES = 60;

  constructor(
    private readonly phoneNumber: string,
    private readonly config: IOtpConfig = {}
  ) {}

  public async send(): Promise<string> {
    const code = this.generateCode();
    const expiresAt = this.calculateExpiryTime();

    const existingOtp = await this.findOtpByPhone();

    if (existingOtp) {
      await this.updateOtpRecord(existingOtp.id, code, expiresAt);
    } else {
      await this.createOtpRecord(code, expiresAt);
    }

    await this.sendSmsNotification(code);

    return code;
  }

  public async verify(
    inputCode: string
  ): Promise<{ isValid: boolean; message: string; otpRecord?: IOtpRecord }> {
    const otpRecord = await this.findOtpByPhone();

    if (!otpRecord) {
      return { isValid: false, message: 'No OTP found for this phone number' };
    }

    const now = new Date();
    if (now > otpRecord.expiresAt) {
      await this.deleteOtpRecord(otpRecord.id);
      return { isValid: false, message: 'OTP has expired' };
    }

    if (otpRecord.code !== inputCode.trim()) {
      return { isValid: false, message: 'Invalid OTP code' };
    }

    await this.markAsVerified(otpRecord.id);
    return {
      isValid: true,
      otpRecord,
      message: 'OTP verified successfully',
    };
  }

  private generateCode(): string {
    const length = this.config.length || OtpService.DEFAULT_LENGTH;
    const randomArray = new Uint8Array(length);
    crypto.getRandomValues(randomArray);
    return Array.from(randomArray, byte => (byte % 10).toString()).join('');
  }

  private calculateExpiryTime(): Date {
    const expiryMinutes =
      this.config.expiryMinutes || OtpService.DEFAULT_EXPIRY_MINUTES;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
    return expiresAt;
  }

  private async findOtpByPhone(): Promise<IOtpRecord | null> {
    try {
      const result = await prisma.user.findFirst({
        where: { phone: this.phoneNumber },
      });
      return result;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to retrieve OTP record'
      );
    }
  }

  private async createOtpRecord(code: string, expiresAt: Date): Promise<void> {
    try {
      await prisma.user.create({
        data: {
          phone: this.phoneNumber,
          code,
          expiresAt,
          createdAt: new Date(),
          verified: false,
        },
      });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to create OTP record'
      );
    }
  }

  private async updateOtpRecord(
    id: number,
    code: string,
    expiresAt: Date
  ): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          code,
          expiresAt,
          verified: false,
        },
      });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update OTP record'
      );
    }
  }

  private async markAsVerified(id: number): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: { verified: true },
      });
    } catch (error) {
      //eslint-disable-next-line no-console
      console.error('Database error marking OTP as verified:', error);
    }
  }

  private async deleteOtpRecord(id: number): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      //eslint-disable-next-line no-console
      console.error('Database error deleting OTP:', error);
    }
  }

  private async sendSmsNotification(code: string): Promise<void> {
    try {
      const response = await axios.post(process.env.SMS_SERVICE_URL!, {
        auth_token: process.env.SMS_SERVICE_TOKEN,
        to: this.phoneNumber,
        text: `Your OTP code is: ${code}. Valid for ${
          this.config.expiryMinutes || OtpService.DEFAULT_EXPIRY_MINUTES
        } minutes.`,
      });

      if (response.data.error) {
        throw new Error(
          response.data.message || 'Failed to send SMS notification'
        );
      }
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to send SMS notification'
      );
    }
  }
}
