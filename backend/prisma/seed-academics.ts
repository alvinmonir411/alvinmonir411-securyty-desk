/**
 * Bangladesh NCTB Academic Structure Seed
 * ──────────────────────────────────────────────────────────────────────────
 * Seeds:
 *   - AcademicYear (2026-2027, current)
 *   - Class 1–10 with sections A & B
 *   - All NCTB subjects per class level
 *   - ClassSubject mappings (class ↔ subject)
 *   - Bangladesh SSC GradeScale (A+, A, A-, B, C, D, F)
 * ──────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient, SubjectType } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Subject Definitions ──────────────────────────────────────────────────

const SUBJECTS = {
  // Primary (1-5)
  BANGLA:       { name: 'বাংলা',                            code: 'BAN',  type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },
  ENGLISH:      { name: 'English',                          code: 'ENG',  type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },
  MATH:         { name: 'গণিত',                             code: 'MATH', type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },
  RELIGION:     { name: 'ধর্ম ও নৈতিক শিক্ষা',              code: 'REL',  type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },
  SCI_PRIMARY:  { name: 'প্রাথমিক বিজ্ঞান',                 code: 'PSCI', type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },
  BGS:          { name: 'বাংলাদেশ ও বিশ্বপরিচয়',            code: 'BGS',  type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },

  // Junior Secondary (6-8)
  SCI_GEN:      { name: 'সাধারণ বিজ্ঞান',                   code: 'GSCI', type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },
  ICT:          { name: 'তথ্য ও যোগাযোগ প্রযুক্তি',          code: 'ICT',  type: SubjectType.THEORY, totalMarks: 50,  passMarks: 20 },
  AGRI:         { name: 'কৃষি শিক্ষা',                       code: 'AGRI', type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },
  PE:           { name: 'শারীরিক শিক্ষা ও স্বাস্থ্য',         code: 'PE',   type: SubjectType.PRACTICAL, totalMarks: 50, passMarks: 17 },
  ART:          { name: 'চারু ও কারুকলা',                    code: 'ART',  type: SubjectType.PRACTICAL, totalMarks: 50, passMarks: 17 },

  // Secondary compulsory (9-10)
  BANGLA_1:     { name: 'বাংলা (১ম পত্র)',                   code: 'BAN1', type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },
  BANGLA_2:     { name: 'বাংলা (২য় পত্র)',                   code: 'BAN2', type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },
  ENG_1:        { name: 'English (1st Paper)',               code: 'ENG1', type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },
  ENG_2:        { name: 'English (2nd Paper)',               code: 'ENG2', type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },
  MATH_SEC:     { name: 'গণিত (মাধ্যমিক)',                   code: 'MSEC', type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },
  BGS_SEC:      { name: 'বাংলাদেশ ও বিশ্বপরিচয় (SSC)',      code: 'BGSS', type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },
  REL_SEC:      { name: 'ধর্ম ও নৈতিক শিক্ষা (SSC)',         code: 'RELS', type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },
  ICT_SEC:      { name: 'তথ্য ও যোগাযোগ প্রযুক্তি (SSC)',    code: 'ICTS', type: SubjectType.THEORY, totalMarks: 50,  passMarks: 20 },
  PE_SEC:       { name: 'শারীরিক শিক্ষা (SSC)',              code: 'PES',  type: SubjectType.PRACTICAL, totalMarks: 50, passMarks: 17 },

  // Science stream (9-10)
  PHYSICS:      { name: 'পদার্থবিজ্ঞান',                    code: 'PHY',  type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },
  CHEMISTRY:    { name: 'রসায়ন',                            code: 'CHEM', type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },
  BIOLOGY:      { name: 'জীববিজ্ঞান',                       code: 'BIO',  type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },
  HIGH_MATH:    { name: 'উচ্চতর গণিত',                      code: 'HMAT', type: SubjectType.THEORY, totalMarks: 100, passMarks: 33 },
};

// ─── Class Definitions ────────────────────────────────────────────────────

const CLASSES = [
  { name: 'শ্রেণী ১',  code: 'C1',  order: 1  },
  { name: 'শ্রেণী ২',  code: 'C2',  order: 2  },
  { name: 'শ্রেণী ৩',  code: 'C3',  order: 3  },
  { name: 'শ্রেণী ৪',  code: 'C4',  order: 4  },
  { name: 'শ্রেণী ৫',  code: 'C5',  order: 5  },
  { name: 'শ্রেণী ৬',  code: 'C6',  order: 6  },
  { name: 'শ্রেণী ৭',  code: 'C7',  order: 7  },
  { name: 'শ্রেণী ৮',  code: 'C8',  order: 8  },
  { name: 'শ্রেণী ৯',  code: 'C9',  order: 9  },
  { name: 'শ্রেণী ১০', code: 'C10', order: 10 },
];

// Subjects assigned per class
const CLASS_SUBJECTS: Record<string, (keyof typeof SUBJECTS)[]> = {
  // Class 1-2: Core 4 subjects
  C1:  ['BANGLA', 'ENGLISH', 'MATH', 'RELIGION'],
  C2:  ['BANGLA', 'ENGLISH', 'MATH', 'RELIGION'],
  // Class 3-5: Core 4 + BGS + Primary Science
  C3:  ['BANGLA', 'ENGLISH', 'MATH', 'RELIGION', 'SCI_PRIMARY', 'BGS'],
  C4:  ['BANGLA', 'ENGLISH', 'MATH', 'RELIGION', 'SCI_PRIMARY', 'BGS'],
  C5:  ['BANGLA', 'ENGLISH', 'MATH', 'RELIGION', 'SCI_PRIMARY', 'BGS'],
  // Class 6-8: Junior Secondary
  C6:  ['BANGLA', 'ENGLISH', 'MATH', 'RELIGION', 'SCI_GEN', 'BGS', 'ICT', 'AGRI', 'PE', 'ART'],
  C7:  ['BANGLA', 'ENGLISH', 'MATH', 'RELIGION', 'SCI_GEN', 'BGS', 'ICT', 'AGRI', 'PE', 'ART'],
  C8:  ['BANGLA', 'ENGLISH', 'MATH', 'RELIGION', 'SCI_GEN', 'BGS', 'ICT', 'AGRI', 'PE', 'ART'],
  // Class 9-10: SSC — compulsory + science stream
  C9:  ['BANGLA_1', 'BANGLA_2', 'ENG_1', 'ENG_2', 'MATH_SEC', 'BGS_SEC', 'REL_SEC', 'ICT_SEC', 'PE_SEC', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'HIGH_MATH'],
  C10: ['BANGLA_1', 'BANGLA_2', 'ENG_1', 'ENG_2', 'MATH_SEC', 'BGS_SEC', 'REL_SEC', 'ICT_SEC', 'PE_SEC', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'HIGH_MATH'],
};

// SSC Group: optional subjects for class 9-10
const OPTIONAL_SUBJECTS_9_10: (keyof typeof SUBJECTS)[] = ['HIGH_MATH'];

// ─── Grade Scale (Bangladesh SSC System) ─────────────────────────────────

const GRADE_SCALE = [
  { gradeLetter: 'A+', gradePoint: 5.0, minScore: 80, maxScore: 100, remarks: 'সর্বোচ্চ' },
  { gradeLetter: 'A',  gradePoint: 4.0, minScore: 70, maxScore: 79,  remarks: 'অতিরিক্ত ভালো' },
  { gradeLetter: 'A-', gradePoint: 3.5, minScore: 60, maxScore: 69,  remarks: 'ভালো' },
  { gradeLetter: 'B',  gradePoint: 3.0, minScore: 50, maxScore: 59,  remarks: 'সন্তোষজনক' },
  { gradeLetter: 'C',  gradePoint: 2.0, minScore: 40, maxScore: 49,  remarks: 'গড়' },
  { gradeLetter: 'D',  gradePoint: 1.0, minScore: 33, maxScore: 39,  remarks: 'উত্তীর্ণ' },
  { gradeLetter: 'F',  gradePoint: 0.0, minScore: 0,  maxScore: 32,  remarks: 'অনুত্তীর্ণ' },
];

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏫 Bangladesh NCTB Academic Structure Seeder');
  console.log('═══════════════════════════════════════════════\n');

  // 1. Academic Year
  console.log('📅 Creating Academic Year 2026-2027...');
  await prisma.academicYear.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2026-2027' },
    update: { isCurrent: true },
    create: {
      name: '2026-2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isCurrent: true,
    },
  });
  console.log(`   ✅ Academic Year: ${academicYear.name} (Current)`);

  // 2. Subjects
  console.log('\n📚 Creating Subjects...');
  const subjectMap: Record<string, string> = {}; // code → id

  for (const [key, s] of Object.entries(SUBJECTS)) {
    const subject = await prisma.subject.upsert({
      where: { code: s.code },
      update: { name: s.name, type: s.type, totalMarks: s.totalMarks, passMarks: s.passMarks },
      create: {
        name: s.name,
        code: s.code,
        type: s.type,
        totalMarks: s.totalMarks,
        passMarks: s.passMarks,
        creditHours: 1.0,
      },
    });
    subjectMap[key] = subject.id;
    console.log(`   ✅ Subject: ${s.name} (${s.code})`);
  }

  // 3. Classes + Sections + ClassSubjects
  console.log('\n🏛️  Creating Classes, Sections & Subject Assignments...');
  for (const cls of CLASSES) {
    // Create class
    const createdClass = await prisma.class.upsert({
      where: { code: cls.code },
      update: { name: cls.name, numericOrder: cls.order },
      create: { name: cls.name, code: cls.code, numericOrder: cls.order },
    });

    // Create sections A and B
    for (const sectionName of ['ক', 'খ']) {
      await prisma.section.upsert({
        where: { classId_name: { classId: createdClass.id, name: sectionName } },
        update: {},
        create: { classId: createdClass.id, name: sectionName, capacity: 45 },
      });
    }

    // Assign subjects
    const subjectKeys = CLASS_SUBJECTS[cls.code] || [];
    for (const subKey of subjectKeys) {
      const subjectId = subjectMap[subKey];
      const isOptional = OPTIONAL_SUBJECTS_9_10.includes(subKey as keyof typeof SUBJECTS) &&
                         (cls.code === 'C9' || cls.code === 'C10');
      const subDef = SUBJECTS[subKey as keyof typeof SUBJECTS];

      await prisma.classSubject.upsert({
        where: { classId_subjectId: { classId: createdClass.id, subjectId } },
        update: { isOptional, totalMarks: subDef.totalMarks, passMarks: subDef.passMarks },
        create: {
          classId: createdClass.id,
          subjectId,
          isOptional,
          totalMarks: subDef.totalMarks,
          passMarks: subDef.passMarks,
        },
      });
    }

    console.log(`   ✅ ${cls.name} (${cls.code}) → সেকশন: ক, খ | বিষয়: ${subjectKeys.length}টি`);
  }

  // 4. Grade Scale
  console.log('\n🎓 Creating Bangladesh SSC Grade Scale...');
  for (const g of GRADE_SCALE) {
    await prisma.gradeScale.upsert({
      where: { scaleName_gradeLetter: { scaleName: 'Bangladesh SSC', gradeLetter: g.gradeLetter } },
      update: { gradePoint: g.gradePoint, minScore: g.minScore, maxScore: g.maxScore, remarks: g.remarks },
      create: {
        scaleName: 'Bangladesh SSC',
        gradeLetter: g.gradeLetter,
        gradePoint: g.gradePoint,
        minScore: g.minScore,
        maxScore: g.maxScore,
        remarks: g.remarks,
      },
    });
    console.log(`   ✅ ${g.gradeLetter} (${g.gradePoint} GP) → ${g.minScore}–${g.maxScore}`);
  }

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════');
  console.log('🎉 Academic Structure Setup Complete!\n');
  console.log('📊 Summary:');
  console.log(`   • Academic Year : 2026-2027 (Current)`);
  console.log(`   • Classes       : Class 1 – Class 10 (10টি)`);
  console.log(`   • Sections      : প্রতিটি Class-এ ক ও খ (মোট 20টি)`);
  console.log(`   • Subjects      : ${Object.keys(SUBJECTS).length}টি`);
  console.log(`   • Class 1-2     : বাংলা, English, গণিত, ধর্ম (4টি)`);
  console.log(`   • Class 3-5     : + প্রাথমিক বিজ্ঞান, বাংলাদেশ ও বিশ্বপরিচয় (6টি)`);
  console.log(`   • Class 6-8     : + সাধারণ বিজ্ঞান, ICT, কৃষি, শারীরিক শিক্ষা, চারু (10টি)`);
  console.log(`   • Class 9-10    : SSC Compulsory + Science Stream (13টি)`);
  console.log(`   • Grade Scale   : Bangladesh SSC (A+ → F, 7 grades)`);
  console.log('═══════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
