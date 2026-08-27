import { PrismaClient, UserRoleType, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('============== INITIAL SUPER_ADMIN CREATION TOOL ==============');
  
  // Check if SUPER_ADMIN user already exists
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: UserRoleType.SUPER_ADMIN, deletedAt: null },
  });

  const force = process.argv.includes('--force');

  if (existingSuperAdmin && !force) {
    console.error(`[ERROR] A SUPER_ADMIN user already exists (${existingSuperAdmin.email}).`);
    console.error('To manage existing administrators, log into the Admin portal.');
    console.error('Use --force flag if you explicitly intend to register an additional administrator.');
    process.exit(1);
  }

  // Read arguments from CLI environment or readline prompt
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query: string): Promise<string> =>
    new Promise((resolve) => rl.question(query, resolve));

  try {
    let name = process.env.ADMIN_NAME || process.argv[2];
    let email = process.env.ADMIN_EMAIL || process.argv[3];
    let password = process.env.ADMIN_PASSWORD || process.argv[4];

    if (!name) {
      name = await question('Enter Admin Full Name: ');
    }
    if (!email) {
      email = await question('Enter Admin Email Address: ');
    }
    if (!password) {
      password = await question('Enter Admin Password (min 8 chars): ');
    }

    rl.close();

    name = name?.trim() || 'System Administrator';
    email = email?.trim().toLowerCase();
    password = password?.trim();

    if (!email || !email.includes('@')) {
      console.error('[ERROR] Invalid email address provided.');
      process.exit(1);
    }

    if (!password || password.length < 8) {
      console.error('[ERROR] Password must be at least 8 characters long.');
      process.exit(1);
    }

    // Ensure system RBAC roles exist
    const roleDefs = [
      { name: 'Super Administrator', slug: 'super-admin', roleType: UserRoleType.SUPER_ADMIN, isSystem: true },
      { name: 'School Administrator', slug: 'admin', roleType: UserRoleType.ADMIN, isSystem: true },
      { name: 'Teacher', slug: 'teacher', roleType: UserRoleType.TEACHER, isSystem: true },
      { name: 'Student', slug: 'student', roleType: UserRoleType.STUDENT, isSystem: true },
      { name: 'Parent', slug: 'parent', roleType: UserRoleType.PARENT, isSystem: true },
      { name: 'Accountant', slug: 'accountant', roleType: UserRoleType.ACCOUNTANT, isSystem: true },
    ];

    let superAdminRoleId: string | undefined;
    for (const r of roleDefs) {
      const role = await prisma.role.upsert({
        where: { slug: r.slug },
        update: { name: r.name },
        create: { name: r.name, slug: r.slug, isSystem: r.isSystem },
      });
      if (r.roleType === UserRoleType.SUPER_ADMIN) {
        superAdminRoleId = role.id;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        username: email.split('@')[0],
        passwordHash,
        role: UserRoleType.SUPER_ADMIN,
        roleId: superAdminRoleId,
        status: UserStatus.ACTIVE,
      },
      create: {
        email,
        username: email.split('@')[0],
        passwordHash,
        role: UserRoleType.SUPER_ADMIN,
        roleId: superAdminRoleId,
        status: UserStatus.ACTIVE,
      },
    });

    console.log('\n✅ SUPER_ADMIN successfully initialized!');
    console.log(`User ID : ${user.id}`);
    console.log(`Email   : ${user.email}`);
    console.log(`Role    : ${user.role}`);
    console.log(`Status  : ${user.status}`);
    console.log('\nYou can now log into the Admin Portal cleanly.');

  } catch (error) {
    console.error('[ERROR] Failed to create administrator:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
