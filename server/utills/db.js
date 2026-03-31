// server/utills/db.js
// Sửa để import Prisma Client đúng vị trí mà npx prisma generate đang tạo ra

let PrismaClient;

try {
    // Cách chuẩn hiện tại: Prisma generate vào @prisma/client
    ({ PrismaClient } = require("@prisma/client"));
} catch (e) {
    console.error("❌ Không tìm thấy @prisma/client. Hãy chạy: npx prisma generate");
    process.exit(1);
}

const prismaClientSingleton = () => {
    // Validate DATABASE_URL
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required');
    }

    // Parse DATABASE_URL để log thông tin kết nối
    const databaseUrl = process.env.DATABASE_URL;
    const url = new URL(databaseUrl);
    
    if (process.env.NODE_ENV === "development") {
        console.log(` Database connection: ${url.protocol}//${url.hostname}:${url.port || '3306'}`);
        console.log(`🔒 SSL Mode: ${url.searchParams.get('sslmode') || 'disabled'}`);
    }

    return new PrismaClient({
        log: process.env.NODE_ENV === "development" 
            ? ['query', 'info', 'warn', 'error']
            : ['error', 'warn'],
    });
};

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

module.exports = prisma;

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}