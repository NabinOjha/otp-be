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
exports.OtpService = void 0;
const prisma_1 = require("./../generated/prisma");
const axios_1 = __importDefault(require("axios"));
const prisma = new prisma_1.PrismaClient();
class OtpService {
    constructor(phoneNumber, config = {}) {
        this.phoneNumber = phoneNumber;
        this.config = config;
    }
    send() {
        return __awaiter(this, void 0, void 0, function* () {
            const code = this.generateCode();
            const expiresAt = this.calculateExpiryTime();
            const existingOtp = yield this.findOtpByPhone();
            if (existingOtp) {
                yield this.updateOtpRecord(existingOtp.id, code, expiresAt);
            }
            else {
                yield this.createOtpRecord(code, expiresAt);
            }
            yield this.sendSmsNotification(code);
            return code;
        });
    }
    verify(inputCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const otpRecord = yield this.findOtpByPhone();
            if (!otpRecord) {
                return { isValid: false, message: 'No OTP found for this phone number' };
            }
            const now = new Date();
            if (now > otpRecord.expiresAt) {
                yield this.deleteOtpRecord(otpRecord.id);
                return { isValid: false, message: 'OTP has expired' };
            }
            if (otpRecord.code !== inputCode.trim()) {
                return { isValid: false, message: 'Invalid OTP code' };
            }
            yield this.markAsVerified(otpRecord.id);
            return {
                isValid: true,
                otpRecord,
                message: 'OTP verified successfully',
            };
        });
    }
    generateCode() {
        const length = this.config.length || OtpService.DEFAULT_LENGTH;
        const randomArray = new Uint8Array(length);
        crypto.getRandomValues(randomArray);
        return Array.from(randomArray, byte => (byte % 10).toString()).join('');
    }
    calculateExpiryTime() {
        const expiryMinutes = this.config.expiryMinutes || OtpService.DEFAULT_EXPIRY_MINUTES;
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
        return expiresAt;
    }
    findOtpByPhone() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield prisma.user.findFirst({
                    where: { phone: this.phoneNumber },
                });
                return result;
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : 'Failed to retrieve OTP record');
            }
        });
    }
    createOtpRecord(code, expiresAt) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma.user.create({
                    data: {
                        phone: this.phoneNumber,
                        code,
                        expiresAt,
                        createdAt: new Date(),
                        verified: false,
                    },
                });
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : 'Failed to create OTP record');
            }
        });
    }
    updateOtpRecord(id, code, expiresAt) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma.user.update({
                    where: { id },
                    data: {
                        code,
                        expiresAt,
                        verified: false,
                    },
                });
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : 'Failed to update OTP record');
            }
        });
    }
    markAsVerified(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma.user.update({
                    where: { id },
                    data: { verified: true },
                });
            }
            catch (error) {
                //eslint-disable-next-line no-console
                console.error('Database error marking OTP as verified:', error);
            }
        });
    }
    deleteOtpRecord(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma.user.delete({
                    where: { id },
                });
            }
            catch (error) {
                //eslint-disable-next-line no-console
                console.error('Database error deleting OTP:', error);
            }
        });
    }
    sendSmsNotification(code) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.post(process.env.SMS_SERVICE_URL, {
                    auth_token: process.env.SMS_SERVICE_TOKEN,
                    to: this.phoneNumber,
                    text: `Your OTP code is: ${code}. Valid for ${this.config.expiryMinutes || OtpService.DEFAULT_EXPIRY_MINUTES} minutes.`,
                });
                if (response.data.error) {
                    throw new Error(response.data.message || 'Failed to send SMS notification');
                }
            }
            catch (error) {
                throw new Error(error instanceof Error
                    ? error.message
                    : 'Failed to send SMS notification');
            }
        });
    }
}
exports.OtpService = OtpService;
OtpService.DEFAULT_LENGTH = 6;
OtpService.DEFAULT_EXPIRY_MINUTES = 60;
