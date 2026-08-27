import { PrismaClient, UserRoleType, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding Core System Data (Users & Hero Slides)...');

  // 1. Password hashes
  const passwordHash = await bcrypt.hash('Pass@123456', 10);
  const noblePassHash = await bcrypt.hash('Noble@123456', 10);

  // 2. Roles
  const roles = [
    { name: 'Super Administrator', slug: 'super-admin' },
    { name: 'School Administrator', slug: 'admin' },
    { name: 'Principal',            slug: 'principal' },
    { name: 'Teacher',              slug: 'teacher' },
    { name: 'Accountant',           slug: 'accountant' },
    { name: 'Student',              slug: 'student' },
    { name: 'Parent',               slug: 'parent' },
    { name: 'Staff',                slug: 'staff' },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { slug: r.slug },
      update: {},
      create: { name: r.name, slug: r.slug, isSystem: true },
    });
  }

  // 3. User accounts (supporting both @nobleschool.edu.bd and @school.com)
  const users = [
    // Super Admins & Admins
    { email: 'admin@school.com', username: 'admin_school', role: UserRoleType.SUPER_ADMIN, hash: passwordHash },
    { email: 'admin@school.edu', username: 'admin_edu', role: UserRoleType.SUPER_ADMIN, hash: passwordHash },
    { email: 'superadmin@nobleschool.edu.bd', username: 'superadmin', role: UserRoleType.SUPER_ADMIN, hash: passwordHash },
    { email: 'admin@nobleschool.edu.bd', username: 'noble_admin', role: UserRoleType.SUPER_ADMIN, hash: passwordHash },
    { email: 'school.admin@nobleschool.edu.bd', username: 'schooladmin', role: UserRoleType.ADMIN, hash: passwordHash },
    { email: 'principal@nobleschool.edu.bd', username: 'principal', role: UserRoleType.PRINCIPAL, hash: passwordHash },

    // Teachers
    { email: 'teacher@school.com', username: 'teacher_school', role: UserRoleType.TEACHER, hash: passwordHash },
    { email: 'teacher@nobleschool.edu.bd', username: 'teacher_noble', role: UserRoleType.TEACHER, hash: passwordHash },

    // Accountants
    { email: 'accountant@school.com', username: 'accountant_school', role: UserRoleType.ACCOUNTANT, hash: passwordHash },
    { email: 'accountant@nobleschool.edu.bd', username: 'accountant_noble', role: UserRoleType.ACCOUNTANT, hash: passwordHash },

    // Students
    { email: 'student@school.com', username: 'student_school', role: UserRoleType.STUDENT, hash: passwordHash },
    { email: 'student@nobleschool.edu.bd', username: 'student_noble', role: UserRoleType.STUDENT, hash: passwordHash },

    // Parents
    { email: 'parent@school.com', username: 'parent_school', role: UserRoleType.PARENT, hash: passwordHash },
    { email: 'parent@nobleschool.edu.bd', username: 'parent_noble', role: UserRoleType.PARENT, hash: passwordHash },
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      await prisma.user.update({
        where: { email: u.email },
        data: {
          passwordHash: u.hash,
          status: UserStatus.ACTIVE,
          role: u.role,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          email: u.email,
          username: u.username,
          passwordHash: u.hash,
          role: u.role,
          status: UserStatus.ACTIVE,
        },
      });
    }
  }
  console.log(`✅ Seeded ${users.length} user accounts with password: Pass@123456`);

  // 4. Seed exactly 2 Persistent Demo Hero Slides
  await prisma.heroSlider.deleteMany({});
  
  const slide1 = await prisma.heroSlider.create({
    data: {
      title: 'INSPIRING MINDS.\nBUILDING FUTURES.',
      subtitle: 'A disciplined, modern and student-centered learning environment where knowledge, character and creativity grow together.',
      imageUrl: '/787124177_2051232472934207_3472095284671851725_n.jpg',
      buttonText: 'Explore Academics',
      buttonLink: '/academics',
      sortOrder: 1,
      isActive: true,
    },
  });

  const slide2 = await prisma.heroSlider.create({
    data: {
      title: 'EXCELLENCE IN\nNCTB EDUCATION.',
      subtitle: 'Structured classroom learning, experienced educators, and complete guidance for secondary academic success.',
      imageUrl: '/778985014_1018608747889352_6428572593389947367_n.jpg',
      buttonText: 'Apply for Admission',
      buttonLink: '/admissions',
      sortOrder: 2,
      isActive: true,
    },
  });

  console.log(`✅ Seeded 2 persistent Hero Slides into database: [${slide1.id}, ${slide2.id}]`);
  console.log('🎉 Core seed complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding core:', e);
  })
  .finally(() => prisma.$disconnect());
