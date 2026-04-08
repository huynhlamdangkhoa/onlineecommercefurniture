// Script tạo tài khoản admin
// Chạy: node server/scripts/seedAdmin.js

const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = 'admin@gmail.com';
  const password = 'Admin12345?';
  const role = UserRole.ADMIN;

  try {
    // Check tồn tại
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.role !== role) {
        await prisma.user.update({
          where: { email },
          data: { role },
        });
        console.log(` Updated "${email}" to ADMIN`);
      } else {
        console.log(`ℹ Admin "${email}" already exists`);
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 14);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: 'System Admin', 
        role,                     

      },
    });

    console.log('🔥 Admin created successfully!');
    console.log(`Email   : ${email}`);
    console.log(`Password: ${password}`);
  } catch (err) {
    console.error('❌ Error creating admin:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();