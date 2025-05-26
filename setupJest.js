"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// setupJest.ts
const child_process_1 = require("child_process");
const prisma_1 = require("./src/generated/prisma");
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
// Load test-specific environment variables
dotenv.config({ path: '.env.test' });
const prisma = new prisma_1.PrismaClient();
const databaseUrl = process.env.DATABASE_URL;
function setupTestDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!databaseUrl) {
            throw new Error('DATABASE_URL is not set in .env.test');
        }
        // Extract database name from DATABASE_URL
        const dbName = (_a = databaseUrl.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('?')[0];
        if (!dbName) {
            throw new Error('Could not extract database name from DATABASE_URL');
        }
        // Connect to PostgreSQL server using a default database for admin tasks
        // Using 'postgres' database (default in PostgreSQL) to create the test database
        const adminDb = 'postgres'; // Change to 'dev_db' if you prefer a specific dev database
        const client = new pg_1.Client({
            connectionString: databaseUrl.replace(dbName, adminDb),
        });
        try {
            yield client.connect();
            // Check if the test database exists
            const res = yield client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
            if (res.rowCount === 0) {
                // Create the test database if it doesn't exist
                yield client.query(`CREATE DATABASE "${dbName}"`);
                console.log(`Created test database: ${dbName}`);
            }
            else {
                console.log(`Test database ${dbName} already exists`);
            }
        }
        catch (error) {
            console.error(`Error creating test database '${dbName}':`, error);
            throw error;
        }
        finally {
            yield client.end();
        }
        // Run prisma generate
        console.log('Running prisma generate...');
        (0, child_process_1.execSync)('npx prisma generate', { stdio: 'inherit' });
        // Run prisma migrate for the test database
        console.log('Running prisma migrate dev for test database...');
        (0, child_process_1.execSync)('npx prisma migrate dev --name init', {
            stdio: 'inherit',
            env: Object.assign(Object.assign({}, process.env), { DATABASE_URL: databaseUrl }),
        });
        // Ensure Prisma client is connected
        yield prisma.$connect();
    });
}
function teardownTestDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma.$disconnect();
    });
}
exports.default = () => __awaiter(void 0, void 0, void 0, function* () {
    yield setupTestDatabase();
    process.on('exit', () => __awaiter(void 0, void 0, void 0, function* () {
        yield teardownTestDatabase();
    }));
});
