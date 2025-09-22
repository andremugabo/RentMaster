import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash passwords for security
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const managerPassword = await bcrypt.hash('Manager@123', 10);

  // --- 1. Seed Users ---
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rentmaster.com' },
    update: {},
    create: {
      email: 'admin@rentmaster.com',
      password_hash: adminPassword,
      full_name: 'System Admin',
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@rentmaster.com' },
    update: {},
    create: {
      email: 'manager@rentmaster.com',
      password_hash: managerPassword,
      full_name: 'Property Manager',
      role: 'MANAGER',
    },
  });

  // --- 2. Seed Payment Modes ---
  await prisma.paymentMode.createMany({
    data: [
      { code: 'CASH', display_name: 'Cash', requires_proof: false },
      { code: 'BANK_TRANSFER', display_name: 'Bank Transfer', requires_proof: true },
      { code: 'MOBILE_MONEY', display_name: 'Mobile Money', requires_proof: true },
    ],
    skipDuplicates: true,
  });

  // --- 3. Seed a Sample Property with Locals ---
  const property = await prisma.property.upsert({
    where: { name: 'Downtown Plaza' },
    update: {},
    create: {
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
  });

  console.log('✅ Seeding completed successfully!');
  console.table({
    Admin: admin.email,
    Manager: manager.email,
    Property: property.name,
  });
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
