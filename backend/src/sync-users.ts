import { PrismaClient, UserRoleType, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash('Admin@123456', 10);
  const teacherPass = await bcrypt.hash('Teacher@123456', 10);
  const studentPass = await bcrypt.hash('Student@123456', 10);
  const parentPass = await bcrypt.hash('Parent@123456', 10);

  const users = [
    { email: 'admin@school.com', role: UserRoleType.SUPER_ADMIN, passwordHash: adminPass },
    { email: 'admin@school.edu', role: UserRoleType.SUPER_ADMIN, passwordHash: adminPass },
    { email: 'accountant@school.com', role: UserRoleType.ACCOUNTANT, passwordHash: adminPass },
    { email: 'accountant@school.edu', role: UserRoleType.ACCOUNTANT, passwordHash: adminPass },
    { email: 'teacher@school.com', role: UserRoleType.TEACHER, passwordHash: teacherPass },
    { email: 'sarah.connor@school.edu', role: UserRoleType.TEACHER, passwordHash: teacherPass },
    { email: 'sarah.jenkins@teacher.apexacademy.edu', role: UserRoleType.TEACHER, passwordHash: teacherPass },
    { email: 'student@school.com', role: UserRoleType.STUDENT, passwordHash: studentPass },
    { email: 'alex.johnson@student.edu', role: UserRoleType.STUDENT, passwordHash: studentPass },
    { email: 'alex.johnson@student.apexacademy.edu', role: UserRoleType.STUDENT, passwordHash: studentPass },
    { email: 'parent@school.com', role: UserRoleType.PARENT, passwordHash: parentPass },
    { email: 'david.johnson@family.com', role: UserRoleType.PARENT, passwordHash: parentPass },
    { email: 'david.johnson@parent.apexacademy.edu', role: UserRoleType.PARENT, passwordHash: parentPass },
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    const uniqueUsername = u.email.replace('@', '_').replace(/\./g, '_');
    if (existing) {
      await prisma.user.update({
        where: { email: u.email },
        data: { passwordHash: u.passwordHash, status: UserStatus.ACTIVE },
      });
    } else {
      await prisma.user.create({
        data: {
          email: u.email,
          username: uniqueUsername,
          passwordHash: u.passwordHash,
          role: u.role,
          status: UserStatus.ACTIVE,
        },
      });
    }
    console.log(`Synced user: ${u.email} (${u.role})`);
  }

  console.log('✅ All persona accounts synced successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
