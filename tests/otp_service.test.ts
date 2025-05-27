import { OtpService } from '../src/services/otp';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import {
  jest,
  afterAll,
  it,
  describe,
  expect,
  beforeEach,
} from '@jest/globals';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const prisma = new PrismaClient();

const TEST_PHONE = '9861574495';

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.user.deleteMany({});
  jest.clearAllMocks();
});

describe('OtpService', () => {
  describe('send()', () => {
    it('should create new OTP record and send SMS if no existing OTP', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: {} });

      const service = new OtpService(TEST_PHONE);
      const code = await service.send();

      expect(code).toHaveLength(6);
      const dbRecord = await prisma.user.findFirst({
        where: { phone: TEST_PHONE },
      });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord?.code).toBe(code);
      expect(dbRecord?.verified).toBe(false);

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          to: TEST_PHONE,
          text: expect.stringContaining(code),
        })
      );
    });

    it('should update existing OTP record if found', async () => {
      // Create initial OTP record
      await prisma.user.create({
        data: {
          phone: TEST_PHONE,
          code: '123456',
          expiresAt: new Date(Date.now() + 1000 * 60 * 10), // 10 mins ahead
          createdAt: new Date(),
          verified: true,
        },
      });

      mockedAxios.post.mockResolvedValueOnce({ data: {} });

      const service = new OtpService(TEST_PHONE);
      const newCode = await service.send();

      expect(newCode).not.toBe('123456');

      const dbRecord = await prisma.user.findFirst({
        where: { phone: TEST_PHONE },
      });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord?.code).toBe(newCode);
      expect(dbRecord?.verified).toBe(false);
    });

    it('should throw error if SMS service fails', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('SMS service down'));

      const service = new OtpService(TEST_PHONE);
      await expect(service.send()).rejects.toThrow('SMS service down');
    });
  });

  describe('verify()', () => {
    it('should return false if no OTP record found', async () => {
      const service = new OtpService(TEST_PHONE);
      const result = await service.verify('anycode');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('No OTP found for this phone number');
    });

    it('should return false if OTP expired and delete record', async () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 5); // 5 mins ago
      const record = await prisma.user.create({
        data: {
          phone: TEST_PHONE,
          code: '654321',
          expiresAt: pastDate,
          createdAt: new Date(),
          verified: false,
        },
      });

      const service = new OtpService(TEST_PHONE);
      const result = await service.verify('654321');

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('OTP has expired');

      const deletedRecord = await prisma.user.findUnique({
        where: { id: record.id },
      });
      expect(deletedRecord).toBeNull();
    });

    it('should return false if OTP code is invalid', async () => {
      await prisma.user.create({
        data: {
          phone: TEST_PHONE,
          code: '111111',
          expiresAt: new Date(Date.now() + 1000 * 60 * 10),
          createdAt: new Date(),
          verified: false,
        },
      });

      const service = new OtpService(TEST_PHONE);
      const result = await service.verify('222222');

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Invalid OTP code');
    });

    it('should mark OTP as verified and return success if code matches', async () => {
      const record = await prisma.user.create({
        data: {
          phone: TEST_PHONE,
          code: '333333',
          expiresAt: new Date(Date.now() + 1000 * 60 * 10),
          createdAt: new Date(),
          verified: false,
        },
      });

      const service = new OtpService(TEST_PHONE);
      const result = await service.verify('333333');

      expect(result.isValid).toBe(true);
      expect(result.message).toBe('OTP verified successfully');
      expect(result.otpRecord).toMatchObject({
        phone: TEST_PHONE,
        code: '333333',
      });

      const updatedRecord = await prisma.user.findUnique({
        where: { id: record.id },
      });
      expect(updatedRecord?.verified).toBe(true);
    });
  });
});
