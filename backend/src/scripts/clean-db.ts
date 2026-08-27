import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Wiping all demo/sample business data from Neon database...');

  try {
    // Delete in reverse foreign key order
    await prisma.auditLog.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.sMSLog.deleteMany({});
    await prisma.emailLog.deleteMany({});
    
    await prisma.studentIDCard.deleteMany({});
    await prisma.admissionDocument.deleteMany({});
    await prisma.admissionPayment.deleteMany({});
    await prisma.admissionApplication.deleteMany({});
    
    await prisma.payroll.deleteMany({});
    await prisma.salaryStructure.deleteMany({});
    
    await prisma.expense.deleteMany({});
    await prisma.ledgerEntry.deleteMany({});
    await prisma.receipt.deleteMany({});
    await prisma.paymentTransaction.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.invoiceItem.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.studentFee.deleteMany({});
    await prisma.feeStructure.deleteMany({});
    await prisma.feeType.deleteMany({});
    
    await prisma.meritPosition.deleteMany({});
    await prisma.resultSubject.deleteMany({});
    await prisma.result.deleteMany({});
    await prisma.mark.deleteMany({});
    await prisma.examAdmitCard.deleteMany({});
    await prisma.examSeatPlan.deleteMany({});
    await prisma.examRoutine.deleteMany({});
    await prisma.examSubject.deleteMany({});
    await prisma.exam.deleteMany({});

    await prisma.studentAttendance.deleteMany({});
    await prisma.teacherAttendance.deleteMany({});
    await prisma.attendanceSummary.deleteMany({});

    await prisma.classRoutine.deleteMany({});
    await prisma.booklist.deleteMany({});
    await prisma.syllabus.deleteMany({});
    await prisma.academicCalendar.deleteMany({});

    await prisma.notice.deleteMany({});
    await prisma.news.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.gallery.deleteMany({});
    await prisma.heroSlider.deleteMany({});

    await prisma.teacherSubject.deleteMany({});
    await prisma.classSubject.deleteMany({});
    await prisma.studentEnrollment.deleteMany({});
    await prisma.studentParent.deleteMany({});
    await prisma.studentDocument.deleteMany({});

    await prisma.teacher.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.parent.deleteMany({});
    await prisma.guardian.deleteMany({});

    await prisma.section.deleteMany({});
    await prisma.subject.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.academicYear.deleteMany({});

    await prisma.userRole.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('✅ Database successfully wiped clean! (0 business records remain)');
  } catch (error) {
    console.error('Error cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
