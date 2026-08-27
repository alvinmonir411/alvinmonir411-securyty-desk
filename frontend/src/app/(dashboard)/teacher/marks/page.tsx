'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { RouteGuard } from '@/components/auth/route-guard';
import { Award, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TeacherMarksEntryPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [marksState, setMarksState] = useState<
    Record<string, { theory: number; practical: number; viva: number; total: number; isAbsent: boolean }>
  >({});

  // 1. Fetch Exams
  const { data: examsData } = useQuery({
    queryKey: ['examinations-list'],
    queryFn: async () => {
      const res = await apiClient.get('/examinations');
      return res.data.data || res.data || [];
    },
  });

  // 2. Fetch Classes
  const { data: classesData } = useQuery({
    queryKey: ['academic-classes'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/classes');
      return res.data.data || res.data || [];
    },
  });

  // 3. Fetch Subjects
  const { data: subjectsData } = useQuery({
    queryKey: ['academic-subjects'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/subjects');
      return res.data.data || res.data || [];
    },
  });

  // 4. Fetch Students for Selected Section / Class
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-for-marks', selectedClass, selectedSection],
    queryFn: async () => {
      if (!selectedClass && !selectedSection) return [];
      const params = new URLSearchParams();
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedSection) params.append('sectionId', selectedSection);
      const res = await apiClient.get(`/students?${params.toString()}`);
      return res.data.data?.data || res.data.data || res.data || [];
    },
    enabled: !!(selectedClass || selectedSection),
  });

  const studentsList: any[] = Array.isArray(studentsData) ? studentsData : [];

  const selectedClassObj = classesData?.find((c: any) => c.id === selectedClass);
  const sectionsList = selectedClassObj?.sections || [];

  const handleScoreChange = (id: string, field: 'theory' | 'practical' | 'viva', value: number) => {
    setMarksState((prev) => {
      const current = prev[id] || { theory: 0, practical: 0, viva: 0, total: 0, isAbsent: false };
      const updated = { ...current, [field]: value };
      updated.total = Number(updated.theory || 0) + Number(updated.practical || 0) + Number(updated.viva || 0);
      return { ...prev, [id]: updated };
    });
  };

  const handleAbsentToggle = (id: string) => {
    setMarksState((prev) => {
      const current = prev[id] || { theory: 0, practical: 0, viva: 0, total: 0, isAbsent: false };
      return {
        ...prev,
        [id]: {
          ...current,
          isAbsent: !current.isAbsent,
          total: !current.isAbsent ? 0 : current.theory + current.practical + current.viva,
        },
      };
    });
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedExam) throw new Error('Please select an examination event.');
      if (!selectedSubject) throw new Error('Please select a curriculum subject.');
      if (studentsList.length === 0) throw new Error('No students enrolled in the selected class/section.');

      const marksPayload = studentsList.map((st) => {
        const m = marksState[st.id] || { theory: 0, practical: 0, viva: 0, total: 0, isAbsent: false };
        return {
          studentId: st.id,
          theoryScore: m.theory,
          practicalScore: m.practical,
          vivaScore: m.viva,
          totalScore: m.total,
          isAbsent: m.isAbsent,
        };
      });

      return apiClient.post('/examinations/submit-marks', {
        examSubjectId: selectedSubject,
        marks: marksPayload,
      });
    },
    onSuccess: () => {
      success('Marks submitted and committed to academic evaluation ledger!');
      queryClient.invalidateQueries({ queryKey: ['examinations-list'] });
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || err.message || 'Failed to save exam marks');
    },
  });

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <div className="space-y-6">
        <PageHeader
          heading="Examination Marks Evaluation"
          subheading="Record theoretical, practical, and continuous assessment scores for term grading."
        />

        {/* Selection Bar */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Exam Event</label>
                <Select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
                  <option value="">-- Select Exam --</option>
                  {examsData?.map((exam: any) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} ({exam.termName})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Class Level</label>
                <Select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedSection('');
                  }}
                >
                  <option value="">-- Select Class --</option>
                  {classesData?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Section</label>
                <Select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  disabled={!selectedClass}
                >
                  <option value="">-- All / Select Section --</option>
                  {sectionsList.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      Section {s.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Subject</label>
                <Select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                  <option value="">-- Select Subject --</option>
                  {subjectsData?.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marks Entry Sheet */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Student Evaluation Sheet</CardTitle>
              <CardDescription>
                {selectedClass ? `${selectedClassObj?.name || 'Class'} • ${studentsList.length} Students` : 'Select a class and subject above to enter marks'}
              </CardDescription>
            </div>
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending || studentsList.length === 0}
            >
              <Save className="mr-1.5 h-4 w-4" />
              {submitMutation.isPending ? 'Saving...' : 'Save & Publish Marks'}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {studentsLoading ? (
              <div className="p-8 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : studentsList.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                {selectedClass
                  ? 'No students found enrolled in this class/section.'
                  : 'Please select an exam, class, and subject to begin entering student marks.'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll #</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Theory (70)</TableHead>
                    <TableHead>Practical (20)</TableHead>
                    <TableHead>Viva (10)</TableHead>
                    <TableHead>Total (100)</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Absent?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsList.map((st: any) => {
                    const m = marksState[st.id] || { theory: 0, practical: 0, viva: 0, total: 0, isAbsent: false };
                    const grade = m.isAbsent ? 'F' : m.total >= 80 ? 'A+' : m.total >= 70 ? 'A' : m.total >= 60 ? 'B' : m.total >= 33 ? 'C' : 'F';
                    const activeEnrollment = st.enrollments?.[0];

                    return (
                      <TableRow key={st.id}>
                        <TableCell className="font-mono font-bold text-primary">
                          #{activeEnrollment?.rollNumber ?? '—'}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          <div>
                            <span>{st.firstName} {st.lastName}</span>
                            <p className="text-[10px] font-mono text-muted-foreground">{st.admissionNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            max={70}
                            min={0}
                            value={m.theory}
                            disabled={m.isAbsent}
                            onChange={(e) => handleScoreChange(st.id, 'theory', Number(e.target.value))}
                            className="w-20 font-mono text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            max={20}
                            min={0}
                            value={m.practical}
                            disabled={m.isAbsent}
                            onChange={(e) => handleScoreChange(st.id, 'practical', Number(e.target.value))}
                            className="w-20 font-mono text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            max={10}
                            min={0}
                            value={m.viva}
                            disabled={m.isAbsent}
                            onChange={(e) => handleScoreChange(st.id, 'viva', Number(e.target.value))}
                            className="w-20 font-mono text-xs"
                          />
                        </TableCell>
                        <TableCell className="font-mono font-bold text-sm">
                          {m.isAbsent ? <span className="text-rose-600">0</span> : m.total}
                        </TableCell>
                        <TableCell>
                          <Badge variant={m.isAbsent || grade === 'F' ? 'destructive' : 'default'}>{grade}</Badge>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => handleAbsentToggle(st.id)}
                            className={`rounded px-2 py-1 text-[11px] font-bold ${
                              m.isAbsent ? 'bg-rose-600 text-white' : 'bg-muted text-muted-foreground hover:bg-rose-500/20 hover:text-rose-600'
                            }`}
                          >
                            {m.isAbsent ? 'ABSENT' : 'Present'}
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
