import { PrismaClient, UserRoleType, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('🔑 Creating test login accounts for all roles...\n');

  const password = await bcrypt.hash('Noble@123456', 10);

  const users = [
    { email: 'admin@nobleschool.edu.bd',       role: UserRoleType.SUPER_ADMIN, username: 'superadmin',  label: 'Super Admin' },
    { email: 'school.admin@nobleschool.edu.bd', role: UserRoleType.ADMIN,       username: 'schooladmin', label: 'Admin' },
    { email: 'principal@nobleschool.edu.bd',    role: UserRoleType.PRINCIPAL,   username: 'principal',   label: 'Principal' },
    { email: 'teacher@nobleschool.edu.bd',      role: UserRoleType.TEACHER,     username: 'teacher',     label: 'Teacher' },
    { email: 'accountant@nobleschool.edu.bd',   role: UserRoleType.ACCOUNTANT,  username: 'accountant',  label: 'Accountant' },
    { email: 'student@nobleschool.edu.bd',      role: UserRoleType.STUDENT,     username: 'student',     label: 'Student' },
    { email: 'parent@nobleschool.edu.bd',       role: UserRoleType.PARENT,      username: 'parent',      label: 'Parent' },
    { email: 'staff@nobleschool.edu.bd',        role: UserRoleType.STAFF,       username: 'staff',       label: 'Staff' },
  ];

  // Ensure system roles exist first
  const roleDefs = [
    { name: 'Super Administrator', slug: 'super-admin' },
    { name: 'School Administrator', slug: 'admin' },
    { name: 'Principal',            slug: 'principal' },
    { name: 'Teacher',              slug: 'teacher' },
    { name: 'Accountant',           slug: 'accountant' },
    { name: 'Student',              slug: 'student' },
    { name: 'Parent',               slug: 'parent' },
    { name: 'Staff',                slug: 'staff' },
  ];

  for (const r of roleDefs) {
    await prisma.role.upsert({
      where: { slug: r.slug },
      update: {},
      create: { name: r.name, slug: r.slug, isSystem: true },
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ROLE          EMAIL                              PASSWORD');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: password, status: UserStatus.ACTIVE, role: u.role },
      create: {
        email: u.email,
        username: u.username,
        passwordHash: password,
        role: u.role,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`  ${u.label.padEnd(13)} ${u.email.padEnd(35)} Noble@123456`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✅ All test accounts created successfully!\n');
}

createTestUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
