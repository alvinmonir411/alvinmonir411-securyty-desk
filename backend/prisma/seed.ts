import { PrismaClient, UserRoleType, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding essential system RBAC roles and permissions...');

  const roleDefs = [
    { name: 'Super Administrator', slug: 'super-admin', roleType: UserRoleType.SUPER_ADMIN, isSystem: true, desc: 'Root system administrator' },
    { name: 'School Administrator', slug: 'admin', roleType: UserRoleType.ADMIN, isSystem: true, desc: 'Academic and operations administrator' },
    { name: 'Principal', slug: 'principal', roleType: UserRoleType.PRINCIPAL, isSystem: true, desc: 'School Head / Principal' },
    { name: 'Teacher', slug: 'teacher', roleType: UserRoleType.TEACHER, isSystem: true, desc: 'Academic faculty member' },
    { name: 'Accountant', slug: 'accountant', roleType: UserRoleType.ACCOUNTANT, isSystem: true, desc: 'Finance and billing officer' },
    { name: 'Student', slug: 'student', roleType: UserRoleType.STUDENT, isSystem: true, desc: 'Enrolled student' },
    { name: 'Parent', slug: 'parent', roleType: UserRoleType.PARENT, isSystem: true, desc: 'Parent or legal guardian' },
    { name: 'Staff', slug: 'staff', roleType: UserRoleType.STAFF, isSystem: true, desc: 'Administrative staff member' },
  ];

  for (const r of roleDefs) {
    await prisma.role.upsert({
      where: { slug: r.slug },
      update: { name: r.name, description: r.desc },
      create: { name: r.name, slug: r.slug, description: r.desc, isSystem: r.isSystem },
    });
  }

  const permissionDefs = [
    { name: 'students.read', action: 'read', resource: 'students', description: 'View student profiles' },
    { name: 'students.create', action: 'create', resource: 'students', description: 'Register new students' },
    { name: 'students.update', action: 'update', resource: 'students', description: 'Update student profiles' },
    { name: 'students.delete', action: 'delete', resource: 'students', description: 'Delete/Archive students' },

    { name: 'fees.read', action: 'read', resource: 'fees', description: 'View invoices and fees' },
    { name: 'fees.create', action: 'create', resource: 'fees', description: 'Generate fee structures and invoices' },
    { name: 'fees.collect', action: 'collect', resource: 'fees', description: 'Record fee payments' },
    { name: 'fees.refund', action: 'refund', resource: 'fees', description: 'Process fee refunds' },

    { name: 'results.read', action: 'read', resource: 'results', description: 'View student results' },
    { name: 'results.create', action: 'create', resource: 'results', description: 'Submit student marks' },
    { name: 'results.update', action: 'update', resource: 'results', description: 'Update student marks' },
    { name: 'results.publish', action: 'publish', resource: 'results', description: 'Publish final results' },

    { name: 'attendance.read', action: 'read', resource: 'attendance', description: 'View attendance records' },
    { name: 'attendance.create', action: 'create', resource: 'attendance', description: 'Mark daily attendance' },
    { name: 'attendance.update', action: 'update', resource: 'attendance', description: 'Update attendance records' },

    { name: 'payroll.read', action: 'read', resource: 'payroll', description: 'View payroll runs' },
    { name: 'payroll.create', action: 'create', resource: 'payroll', description: 'Generate payroll runs' },
    { name: 'payroll.approve', action: 'approve', resource: 'payroll', description: 'Approve payroll runs' },

    { name: 'cms.read', action: 'read', resource: 'cms', description: 'Read CMS articles and notices' },
    { name: 'cms.create', action: 'create', resource: 'cms', description: 'Create CMS articles and notices' },
    { name: 'cms.update', action: 'update', resource: 'cms', description: 'Update CMS content' },
    { name: 'cms.delete', action: 'delete', resource: 'cms', description: 'Delete CMS content' },

    { name: 'audit.read', action: 'read', resource: 'audit', description: 'Read security audit logs' },
  ];

  for (const p of permissionDefs) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: { action: p.action, resource: p.resource, description: p.description },
      create: p,
    });
  }

  console.log('✅ System RBAC initialized.');

  // ─── Seed Demo Users ──────────────────────────────────────────────────────
  console.log('👤 Seeding demo users...');

  const demoUsers = [
    {
      email: 'admin@school.com',
      password: 'Admin@123456',
      firstName: 'System',
      lastName: 'Admin',
      role: UserRoleType.SUPER_ADMIN,
      displayName: 'System Administrator',
    },
    {
      email: 'teacher@school.com',
      password: 'Teacher@123456',
      firstName: 'Demo',
      lastName: 'Teacher',
      role: UserRoleType.TEACHER,
      displayName: 'Demo Teacher',
    },
    {
      email: 'student@school.com',
      password: 'Student@123456',
      firstName: 'Demo',
      lastName: 'Student',
      role: UserRoleType.STUDENT,
      displayName: 'Demo Student',
    },
    {
      email: 'parent@school.com',
      password: 'Parent@123456',
      firstName: 'Demo',
      lastName: 'Parent',
      role: UserRoleType.PARENT,
      displayName: 'Demo Parent',
    },
    {
      email: 'accountant@school.com',
      password: 'Admin@123456',
      firstName: 'Demo',
      lastName: 'Accountant',
      role: UserRoleType.ACCOUNTANT,
      displayName: 'Demo Accountant',
    },
  ];

  for (const u of demoUsers) {
    const hashedPassword = await bcrypt.hash(u.password, 12);
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash: hashedPassword,
        status: UserStatus.ACTIVE,
      },
      create: {
        email: u.email,
        passwordHash: hashedPassword,
        role: u.role,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`  ✅ ${u.role}: ${u.email} (ID: ${created.id})`);
  }

  console.log('\n🎉 Seeding complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Demo Login Credentials:');
  console.log('  Admin       → admin@school.com       / Admin@123456');
  console.log('  Teacher     → teacher@school.com     / Teacher@123456');
  console.log('  Student     → student@school.com     / Student@123456');
  console.log('  Parent      → parent@school.com      / Parent@123456');
  console.log('  Accountant  → accountant@school.com  / Admin@123456');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
