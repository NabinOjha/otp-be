"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const errorHandler_1 = require("./middlewares/errorHandler");
const auth_1 = __importDefault(require("./routes/auth"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ credentials: true, origin: 'http://localhost:5173' }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use('/auth', auth_1.default);
app.use(errorHandler_1.errorHandler);
exports.default = app;
