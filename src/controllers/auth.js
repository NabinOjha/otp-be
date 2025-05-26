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
exports.signOut = exports.currentUser = exports.veifyOtp = exports.sendOtp = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const otp_1 = require("../services/otp");
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
const sendOtp = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const otpService = new otp_1.OtpService(req.body.phoneNumber);
        yield otpService.send();
        res.status(200).json({ message: 'OTP sent' });
    }
    catch (err) {
        next(err);
    }
});
exports.sendOtp = sendOtp;
const veifyOtp = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const otpService = new otp_1.OtpService(req.body.phoneNumber);
        const result = yield otpService.verify(req.body.otp);
        if (result.isValid && result.otpRecord) {
            const token = jsonwebtoken_1.default.sign({ phone: result.otpRecord.phone }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.cookie('ncell_jwt_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000,
            });
            res.status(200).json({ message: 'OTP verified successfully' });
        }
        else {
            throw new Error(result.message);
        }
    }
    catch (err) {
        next(err);
    }
});
exports.veifyOtp = veifyOtp;
const currentUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.ncell_jwt_token;
    if (!token) {
        return next(new Error('Unauthorized'));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const phone = decoded.phone;
        const otp = yield prisma.user.findFirst({
            where: { phone },
        });
        if (!otp)
            throw new Error('User not found');
        res.status(200).json(otp);
    }
    catch (err) {
        next(err);
    }
});
exports.currentUser = currentUser;
const signOut = (_req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.clearCookie('ncell_jwt_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });
        res.status(200).json({ message: 'Logged out successfully' });
    }
    catch (err) {
        next(err);
    }
});
exports.signOut = signOut;
