"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const otp_1 = require("../src/services/otp");
const prisma_1 = require("../src/generated/prisma");
const axios_1 = __importDefault(require("axios"));
const globals_1 = require("@jest/globals");
globals_1.jest.mock('axios');
const mockedAxios = axios_1.default;
const prisma = new prisma_1.PrismaClient();
const TEST_PHONE = '9861574495';
(0, globals_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
(0, globals_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.user.deleteMany({});
    globals_1.jest.clearAllMocks();
}));
(0, globals_1.describe)('OtpService', () => {
    (0, globals_1.describe)('send()', () => {
        (0, globals_1.it)('should create new OTP record and send SMS if no existing OTP', () => __awaiter(void 0, void 0, void 0, function* () {
            mockedAxios.post.mockResolvedValueOnce({ data: {} });
            const service = new otp_1.OtpService(TEST_PHONE);
            const code = yield service.send();
            (0, globals_1.expect)(code).toHaveLength(6);
            const dbRecord = yield prisma.user.findFirst({
                where: { phone: TEST_PHONE },
            });
            (0, globals_1.expect)(dbRecord).not.toBeNull();
            (0, globals_1.expect)(dbRecord === null || dbRecord === void 0 ? void 0 : dbRecord.code).toBe(code);
            (0, globals_1.expect)(dbRecord === null || dbRecord === void 0 ? void 0 : dbRecord.verified).toBe(false);
            (0, globals_1.expect)(mockedAxios.post).toHaveBeenCalledTimes(1);
            (0, globals_1.expect)(mockedAxios.post).toHaveBeenCalledWith(globals_1.expect.any(String), globals_1.expect.objectContaining({
                to: TEST_PHONE,
                text: globals_1.expect.stringContaining(code),
            }));
        }));
        (0, globals_1.it)('should update existing OTP record if found', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create initial OTP record
            yield prisma.user.create({
                data: {
                    phone: TEST_PHONE,
                    code: '123456',
                    expiresAt: new Date(Date.now() + 1000 * 60 * 10), // 10 mins ahead
                    createdAt: new Date(),
                    verified: true,
                },
            });
            mockedAxios.post.mockResolvedValueOnce({ data: {} });
            const service = new otp_1.OtpService(TEST_PHONE);
            const newCode = yield service.send();
            (0, globals_1.expect)(newCode).not.toBe('123456');
            const dbRecord = yield prisma.user.findFirst({
                where: { phone: TEST_PHONE },
            });
            (0, globals_1.expect)(dbRecord).not.toBeNull();
            (0, globals_1.expect)(dbRecord === null || dbRecord === void 0 ? void 0 : dbRecord.code).toBe(newCode);
            (0, globals_1.expect)(dbRecord === null || dbRecord === void 0 ? void 0 : dbRecord.verified).toBe(false);
        }));
        (0, globals_1.it)('should throw error if SMS service fails', () => __awaiter(void 0, void 0, void 0, function* () {
            mockedAxios.post.mockRejectedValueOnce(new Error('SMS service down'));
            const service = new otp_1.OtpService(TEST_PHONE);
            yield (0, globals_1.expect)(service.send()).rejects.toThrow('SMS service down');
        }));
    });
    (0, globals_1.describe)('verify()', () => {
        (0, globals_1.it)('should return false if no OTP record found', () => __awaiter(void 0, void 0, void 0, function* () {
            const service = new otp_1.OtpService(TEST_PHONE);
            const result = yield service.verify('anycode');
            (0, globals_1.expect)(result.isValid).toBe(false);
            (0, globals_1.expect)(result.message).toBe('No OTP found for this phone number');
        }));
        (0, globals_1.it)('should return false if OTP expired and delete record', () => __awaiter(void 0, void 0, void 0, function* () {
            const pastDate = new Date(Date.now() - 1000 * 60 * 5); // 5 mins ago
            const record = yield prisma.user.create({
                data: {
                    phone: TEST_PHONE,
                    code: '654321',
                    expiresAt: pastDate,
                    createdAt: new Date(),
                    verified: false,
                },
            });
            const service = new otp_1.OtpService(TEST_PHONE);
            const result = yield service.verify('654321');
            (0, globals_1.expect)(result.isValid).toBe(false);
            (0, globals_1.expect)(result.message).toBe('OTP has expired');
            const deletedRecord = yield prisma.user.findUnique({
                where: { id: record.id },
            });
            (0, globals_1.expect)(deletedRecord).toBeNull();
        }));
        (0, globals_1.it)('should return false if OTP code is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma.user.create({
                data: {
                    phone: TEST_PHONE,
                    code: '111111',
                    expiresAt: new Date(Date.now() + 1000 * 60 * 10),
                    createdAt: new Date(),
                    verified: false,
                },
            });
            const service = new otp_1.OtpService(TEST_PHONE);
            const result = yield service.verify('222222');
            (0, globals_1.expect)(result.isValid).toBe(false);
            (0, globals_1.expect)(result.message).toBe('Invalid OTP code');
        }));
        (0, globals_1.it)('should mark OTP as verified and return success if code matches', () => __awaiter(void 0, void 0, void 0, function* () {
            const record = yield prisma.user.create({
                data: {
                    phone: TEST_PHONE,
                    code: '333333',
                    expiresAt: new Date(Date.now() + 1000 * 60 * 10),
                    createdAt: new Date(),
                    verified: false,
                },
            });
            const service = new otp_1.OtpService(TEST_PHONE);
            const result = yield service.verify('333333');
            (0, globals_1.expect)(result.isValid).toBe(true);
            (0, globals_1.expect)(result.message).toBe('OTP verified successfully');
            (0, globals_1.expect)(result.otpRecord).toMatchObject({
                phone: TEST_PHONE,
                code: '333333',
            });
            const updatedRecord = yield prisma.user.findUnique({
                where: { id: record.id },
            });
            (0, globals_1.expect)(updatedRecord === null || updatedRecord === void 0 ? void 0 : updatedRecord.verified).toBe(true);
        }));
    });
});
