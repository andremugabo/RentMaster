import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // --- 0. Clean existing data (with error handling) ---
  console.log('🗑  Clearing existing data...');
  try {
    await prisma.$transaction([
      prisma.document.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.local.deleteMany(),
      prisma.property.deleteMany(),
      prisma.paymentMode.deleteMany(),
      prisma.user.deleteMany(),
    ]);
    console.log('✅ Existing data cleared.');
  } catch (err) {
    console.error('❌ Failed to clear existing data:', err);
    throw err;
  }

  // --- 1. Hash passwords securely ---
  console.log('🔑 Hashing passwords...');
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const managerPassword = await bcrypt.hash('Manager@123', 10);

  // --- 2. Seed Users ---
  console.log('👤 Creating users...');
  let admin, manager;
  try {
    admin = await prisma.user.create({
      data: {
        email: 'admin@rentmaster.com',
        password_hash: adminPassword,
        full_name: 'System Admin',
        role: 'ADMIN',
      },
    });

    manager = await prisma.user.create({
      data: {
        email: 'manager@rentmaster.com',
        password_hash: managerPassword,
        full_name: 'Property Manager',
        role: 'MANAGER',
      },
    });
    console.log('✅ Users created.');
  } catch (err) {
    console.error('❌ Failed to create users:', err);
    throw err;
  }

  // --- 3. Seed Payment Modes ---
  console.log('💳 Creating payment modes...');
  try {
    await prisma.paymentMode.createMany({
      data: [
        { code: 'CASH', display_name: 'Cash', requires_proof: false },
        { code: 'BANK_TRANSFER', display_name: 'Bank Transfer', requires_proof: true },
        { code: 'MOBILE_MONEY', display_name: 'Mobile Money', requires_proof: true },
      ],
    });
    console.log('✅ Payment modes created.');
  } catch (err) {
    console.error('❌ Failed to create payment modes:', err);
    throw err;
  }

  // --- 4. Seed Property & Locals ---
  console.log('🏢 Creating property with locals...');
  try {
    const property = await prisma.property.create({
      data: {
        name: 'Downtown Plaza',
        location: 'Central Business District',
        description: 'Mixed-use property with shops and offices',
        locals: {
          create: [
            { reference_code: 'LOC-101', status: 'AVAILABLE', size_m2: 50 },
            { reference_code: 'LOC-102', status: 'AVAILABLE', size_m2: 75 },
          ],
        },
      },
      include: { locals: true },
    });

    console.log('✅ Property created successfully!');
    console.table({
      Admin: admin.email,
      Manager: manager.email,
      Property: property.name,
      Locals: property.locals.length,
    });
  } catch (err) {
    console.error('❌ Failed to create property:', err);
    throw err;
  }
}

main()
  .catch((err) => {
    console.error('🚨 SEED FAILED 🚨');
    console.error(err);
    console.error(err.stack);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Disconnecting from database...');
    await prisma.$disconnect();
  });
