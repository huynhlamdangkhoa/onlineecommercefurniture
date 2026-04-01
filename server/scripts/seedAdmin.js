//Script tạo tài khoản admin
//Chạy node server/scripts/seedAdmin.js


const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = 'admin@gmail.com'; //mail đăng nhập
  const password = 'Admin12345?'; //mật khẩu
  const role = 'admin';

  try {
    // Kiểm tra đã tồn tại chưa
    const existing = await prisma.user.findFirst({ where: { email } });

    if (existing) {
      // Nếu tồn tại nhưng chưa phải admin thì update
      if (existing.role !== role) {
        await prisma.user.update({
          where: { email },
          data: { role },
        });
        console.log(`    Updated existing user "${email}" to role: admin`);
      } else {
        console.log(`ℹ   Admin "${email}" already exists. Skipping.`);
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 14);

    await prisma.user.create({
      data: {
        id: nanoid(),
        email,
        password: hashedPassword,
        role,
      },
    });

    console.log('   Admin account created successfully!');
    console.log(`   Email   : ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role    : ${role}`);
  } catch (err) {
    console.error('❌ Error creating admin:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();