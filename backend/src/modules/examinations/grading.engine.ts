export interface GradeScaleRule {
  gradeLetter: string;
  gradePoint: number;
  minScore: number;
  maxScore: number;
  remarks: string;
}

export const DEFAULT_GRADE_SCALE: GradeScaleRule[] = [
  { gradeLetter: 'A+', gradePoint: 5.0, minScore: 80.0, maxScore: 100.0, remarks: 'Outstanding' },
  { gradeLetter: 'A', gradePoint: 4.0, minScore: 70.0, maxScore: 79.99, remarks: 'Excellent' },
  { gradeLetter: 'A-', gradePoint: 3.5, minScore: 60.0, maxScore: 69.99, remarks: 'Very Good' },
  { gradeLetter: 'B', gradePoint: 3.0, minScore: 50.0, maxScore: 59.99, remarks: 'Good' },
  { gradeLetter: 'C', gradePoint: 2.0, minScore: 40.0, maxScore: 49.99, remarks: 'Satisfactory' },
  { gradeLetter: 'D', gradePoint: 1.0, minScore: 33.0, maxScore: 39.99, remarks: 'Pass' },
  { gradeLetter: 'F', gradePoint: 0.0, minScore: 0.0, maxScore: 32.99, remarks: 'Fail' },
];

export class GradingEngine {
  /**
   * Calculates individual subject grade and grade point based on score, total marks, and pass threshold.
   */
  static calculateSubjectGrade(
    score: number,
    totalMarks: number = 100.0,
    passMarks: number = 33.0,
    scales: GradeScaleRule[] = DEFAULT_GRADE_SCALE,
  ) {
    if (score < passMarks || score < 0) {
      return {
        gradeLetter: 'F',
        gradePoint: 0.0,
        remarks: 'Fail (Below Pass Threshold)',
        isPassed: false,
      };
    }

    // Normalize to 100% scale for grading lookup
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100.0 : score;

    for (const rule of scales) {
      if (percentage >= rule.minScore && percentage <= rule.maxScore + 0.01) {
        return {
          gradeLetter: rule.gradeLetter,
          gradePoint: rule.gradePoint,
          remarks: rule.remarks,
          isPassed: rule.gradePoint > 0,
        };
      }
    }

    return {
      gradeLetter: 'F',
      gradePoint: 0.0,
      remarks: 'Fail',
      isPassed: false,
    };
  }

  /**
   * Calculates overall student term result, GPA, and subject breakdown.
   * If any mandatory subject is failed, the overall GPA drops to 0.00 (F).
   */
  static calculateStudentResult(
    subjectsData: Array<{
      subjectId: string;
      theoryScore?: number | null;
      practicalScore?: number | null;
      vivaScore?: number | null;
      continuousAssessmentScore?: number | null;
      totalScore: number;
      totalMarks?: number;
      passMarks?: number;
      isAbsent?: boolean;
    }>,
    scales: GradeScaleRule[] = DEFAULT_GRADE_SCALE,
  ) {
    let totalMarks = 0;
    let obtainedMarks = 0;
    let totalGradePoints = 0;
    let hasFailedSubject = false;

    const subjectBreakdowns = subjectsData.map((item) => {
      const subjectTotalMarks = item.totalMarks ?? 100.0;
      const subjectPassMarks = item.passMarks ?? 33.0;
      totalMarks += subjectTotalMarks;

      if (item.isAbsent) {
        hasFailedSubject = true;
        return {
          subjectId: item.subjectId,
          totalMarks: subjectTotalMarks,
          obtainedMarks: 0,
          gradeLetter: 'F',
          gradePoint: 0.0,
          remarks: 'Absent in Examination',
          isPassed: false,
        };
      }

      obtainedMarks += item.totalScore;
      const evaluation = this.calculateSubjectGrade(
        item.totalScore,
        subjectTotalMarks,
        subjectPassMarks,
        scales,
      );

      if (!evaluation.isPassed) {
        hasFailedSubject = true;
      }

      totalGradePoints += evaluation.gradePoint;

      return {
        subjectId: item.subjectId,
        totalMarks: subjectTotalMarks,
        obtainedMarks: item.totalScore,
        gradeLetter: evaluation.gradeLetter,
        gradePoint: evaluation.gradePoint,
        remarks: evaluation.remarks,
        isPassed: evaluation.isPassed,
      };
    });

    const subjectCount = Math.max(1, subjectsData.length);
    let gpa = 0.0;
    let overallGrade = 'F';

    if (!hasFailedSubject && subjectCount > 0) {
      gpa = parseFloat((totalGradePoints / subjectCount).toFixed(2));
      // Lookup overall grade letter for the GPA
      if (gpa >= 5.0) overallGrade = 'A+';
      else if (gpa >= 4.0) overallGrade = 'A';
      else if (gpa >= 3.5) overallGrade = 'A-';
      else if (gpa >= 3.0) overallGrade = 'B';
      else if (gpa >= 2.0) overallGrade = 'C';
      else if (gpa >= 1.0) overallGrade = 'D';
      else overallGrade = 'F';
    }

    return {
      totalMarks,
      obtainedMarks,
      averagePercentage: totalMarks > 0 ? parseFloat(((obtainedMarks / totalMarks) * 100).toFixed(2)) : 0,
      gpa,
      gradeLetter: overallGrade,
      isPassed: !hasFailedSubject,
      subjectBreakdowns,
    };
  }

  /**
   * Sorts students and calculates merit positions (rank).
   * Primary: GPA Descending
   * Tie-breaker: Obtained Marks Descending
   */
  static calculateMeritPositions(
    students: Array<{
      studentId: string;
      gpa: number;
      obtainedMarks: number;
    }>,
  ) {
    const sorted = [...students].sort((a, b) => {
      if (b.gpa !== a.gpa) {
        return b.gpa - a.gpa;
      }
      return b.obtainedMarks - a.obtainedMarks;
    });

    let currentRank = 1;
    return sorted.map((student, index) => {
      if (index > 0) {
        const prev = sorted[index - 1];
        if (student.gpa === prev.gpa && student.obtainedMarks === prev.obtainedMarks) {
          // Tie shares the same rank
        } else {
          currentRank = index + 1;
        }
      }
      return {
        studentId: student.studentId,
        classRank: currentRank,
        sectionRank: currentRank,
        totalScore: student.obtainedMarks,
        gpa: student.gpa,
      };
    });
  }
}
