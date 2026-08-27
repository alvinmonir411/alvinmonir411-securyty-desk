'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '@/lib/api/client';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  Award,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  Sparkles,
  BookOpen,
  IdCard,
  Eye,
  Lock,
  Unlock,
  ShieldCheck,
  Trophy,
} from 'lucide-react';

const createExamSchema = z.object({
  title: z.string().min(3, 'Exam title is required (e.g. Mid-Term Examination 2026)'),
  termName: z.string().min(2, 'Term name is required (e.g. Mid-Term)'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  academicYearId: z.string().optional(),
});

const createExamSubjectSchema = z.object({
  examId: z.string().min(1, 'Please select an exam'),
  classId: z.string().min(1, 'Please select a class'),
  subjectId: z.string().min(1, 'Please select a subject'),
  examDate: z.string().min(1, 'Exam date is required'),
  startTime: z.string().default('10:00'),
  endTime: z.string().default('13:00'),
  totalMarks: z.coerce.number().default(100.0),
  passMarks: z.coerce.number().default(40.0),
});

type CreateExamFormValues = z.infer<typeof createExamSchema>;
type CreateExamSubjectFormValues = z.infer<typeof createExamSubjectSchema>;

export default function AdminExaminationsPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [isTabulationOpen, setIsTabulationOpen] = useState(false);
  const [isMeritOpen, setIsMeritOpen] = useState(false);
  const [selectedMarksheetStudent, setSelectedMarksheetStudent] = useState<any>(null);

  // Queries
  const { data: exams, isLoading: examsLoading, refetch } = useQuery({
    queryKey: ['admin-exams-list'],
    queryFn: async () => {
      const res = await apiClient.get('/examinations');
      return res.data.data || res.data;
    },
  });

  const { data: classes } = useQuery({
    queryKey: ['classes-for-exams'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/classes');
      return res.data.data || res.data;
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects-for-exams'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/subjects');
      return res.data.data || res.data;
    },
  });

  const { data: years } = useQuery({
    queryKey: ['years-for-exams'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/years');
      return res.data.data || res.data;
    },
  });

  // Tabulation Query
  const { data: tabulationData, isLoading: tabLoading } = useQuery({
    queryKey: ['tabulation-sheet', selectedExam?.id, selectedClassId],
    queryFn: async () => {
      if (!selectedExam?.id || !selectedClassId) return null;
      const res = await apiClient.get(`/examinations/${selectedExam.id}/tabulation-sheet?classId=${selectedClassId}`);
      return res.data.data || res.data;
    },
    enabled: isTabulationOpen && !!selectedExam?.id && !!selectedClassId,
  });

  // Merit List Query
  const { data: meritList, isLoading: meritLoading } = useQuery({
    queryKey: ['merit-list', selectedExam?.id],
    queryFn: async () => {
      if (!selectedExam?.id) return [];
      const res = await apiClient.get(`/examinations/${selectedExam.id}/merit-list`);
      return res.data.data || res.data;
    },
    enabled: isMeritOpen && !!selectedExam?.id,
  });

  // Forms
  const createForm = useForm<CreateExamFormValues>({
    resolver: zodResolver(createExamSchema),
    defaultValues: {
      title: 'Mid-Term Examination 2026',
      termName: 'Mid-Term',
      startDate: '2026-04-10',
      endDate: '2026-04-25',
    },
  });

  const subjectForm = useForm<CreateExamSubjectFormValues>({
    resolver: zodResolver(createExamSubjectSchema),
    defaultValues: {
      examId: '',
      classId: '',
      subjectId: '',
      examDate: '2026-04-12',
      startTime: '10:00',
      endTime: '13:00',
      totalMarks: 100,
      passMarks: 40,
    },
  });

  // Mutations
  const createExamMutation = useMutation({
    mutationFn: async (values: CreateExamFormValues) => {
      const yearId = values.academicYearId || years?.[0]?.id || 'default-year';
      return apiClient.post('/examinations', { ...values, academicYearId: yearId });
    },
    onSuccess: () => {
      success('Examination event created successfully!');
      setIsCreateOpen(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['admin-exams-list'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to create exam'),
  });

  const createSubjectMutation = useMutation({
    mutationFn: (values: CreateExamSubjectFormValues) => apiClient.post('/examinations/subjects', values),
    onSuccess: () => {
      success('Subject successfully scheduled into examination!');
      setIsSubjectOpen(false);
      subjectForm.reset();
      queryClient.invalidateQueries({ queryKey: ['admin-exams-list'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to add exam subject'),
  });

  const processResultsMutation = useMutation({
    mutationFn: async ({ examId, classId }: { examId: string; classId: string }) => {
      return apiClient.post(`/examinations/${examId}/process-results?classId=${classId}`);
    },
    onSuccess: (res: any) => {
      const msg = res.data?.data?.message || res.data?.message || 'Results compiled & GPA calculated successfully!';
      success(msg);
      queryClient.invalidateQueries({ queryKey: ['admin-exams-list'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Result computation failed'),
  });

  const publishMutation = useMutation({
    mutationFn: (examId: string) => apiClient.post(`/examinations/${examId}/publish`),
    onSuccess: () => {
      success('Examination results officially published to Student & Parent portals!');
      queryClient.invalidateQueries({ queryKey: ['admin-exams-list'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to publish results'),
  });

  const unpublishMutation = useMutation({
    mutationFn: (examId: string) => apiClient.post(`/examinations/${examId}/unpublish`),
    onSuccess: () => {
      success('Results unpublished. Teachers & administrators can now modify marks.');
      queryClient.invalidateQueries({ queryKey: ['admin-exams-list'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to unpublish results'),
  });

  const handleOpenTabulation = (exam: any) => {
    setSelectedExam(exam);
    if (classes?.length > 0) {
      setSelectedClassId(classes[0].id);
    }
    setIsTabulationOpen(true);
  };

  const handleOpenMerit = (exam: any) => {
    setSelectedExam(exam);
    setIsMeritOpen(true);
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']}>
      <div className="space-y-6">
        <PageHeader
          heading="Examination & Result Processing Engine"
          subheading="Schedule examination routines, compute GPA and merit ranks, and publish official marksheet transcripts."
        >
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsSubjectOpen(true)} variant="outline">
              <BookOpen className="mr-1.5 h-4 w-4" />
              Schedule Subject
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} className="shadow-md">
              <Plus className="mr-1.5 h-4 w-4" />
              Create Exam Event
            </Button>
          </div>
        </PageHeader>

        {/* 4 Overview Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Scheduled Examinations"
            value={exams?.length?.toString() || '0'}
            description="Active term cycles"
            icon={Award}
            iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50"
          />
          <StatCard
            title="Grading Standard"
            value="GPA 5.0"
            description="7-Tier letter scale (A+ to F)"
            icon={Sparkles}
            iconColor="text-purple-600 bg-purple-50 dark:bg-purple-950/50"
          />
          <StatCard
            title="Result Audit Trail"
            value="Active"
            description="Immutable marks revisions"
            icon={ShieldCheck}
            iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50"
          />
          <StatCard
            title="Result Workflow"
            value="DRAFT → PUBLISHED"
            description="Multi-tier verification"
            icon={CheckCircle2}
            iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/50"
          />
        </div>

        {/* Examination Lifecycle List */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Active Examinations & Result Status</CardTitle>
            <CardDescription>Multi-stage workflow: Draft → Marks Entry → Verified → Approved → Published</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {examsLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : !exams || exams.length === 0 ? (
              <div className="p-12 text-center">
                <Award className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
                <h4 className="text-sm font-semibold text-foreground">No examinations scheduled</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Create your first term examination event.
                </p>
                <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create Exam
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {exams.map((ex: any) => (
                  <div key={ex.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-foreground text-base">{ex.title}</h4>
                        <Badge
                          variant={
                            ex.isPublished
                              ? 'success'
                              : ex.status === 'VERIFIED'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {ex.isPublished ? 'PUBLISHED' : ex.status || 'DRAFT'}
                        </Badge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Term: <strong className="text-foreground">{ex.termName}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Dates: {new Date(ex.startDate).toLocaleDateString()} — {new Date(ex.endDate).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>
                          Subjects Scheduled: <strong className="text-foreground">{ex.examSubjects?.length || 0}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Results Compiled: <strong className="text-foreground">{ex.results?.length || 0} students</strong>
                        </span>
                      </div>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenTabulation(ex)}
                      >
                        <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                        Tabulation Sheet
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenMerit(ex)}
                      >
                        <Trophy className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                        Merit List
                      </Button>

                      {classes?.[0] && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-primary border-primary/30"
                          onClick={() => processResultsMutation.mutate({ examId: ex.id, classId: classes[0].id })}
                          disabled={processResultsMutation.isPending}
                        >
                          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                          Compile GPA
                        </Button>
                      )}

                      {ex.isPublished ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-600 border-rose-200 hover:bg-rose-50"
                          onClick={() => unpublishMutation.mutate(ex.id)}
                          disabled={unpublishMutation.isPending}
                        >
                          <Unlock className="mr-1.5 h-3.5 w-3.5" />
                          Unpublish
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => publishMutation.mutate(ex.id)}
                          disabled={publishMutation.isPending}
                        >
                          <Lock className="mr-1.5 h-3.5 w-3.5" />
                          Publish Results
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal 1: Create Exam Event */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent onClose={() => setIsCreateOpen(false)}>
            <DialogHeader>
              <DialogTitle>Create Examination Event</DialogTitle>
              <DialogDescription>
                Define institutional term examination dates and academic session.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={createForm.handleSubmit((v) => createExamMutation.mutate(v))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="exTitle">Examination Title</Label>
                <Input id="exTitle" placeholder="Mid-Term Examination 2026" {...createForm.register('title')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exTerm">Term / Cycle Name</Label>
                <Input id="exTerm" placeholder="Mid-Term" {...createForm.register('termName')} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="exStart">Start Date</Label>
                  <Input id="exStart" type="date" {...createForm.register('startDate')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="exEnd">End Date</Label>
                  <Input id="exEnd" type="date" {...createForm.register('endDate')} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createExamMutation.isPending}>
                  {createExamMutation.isPending ? 'Creating...' : 'Create Examination'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal 2: Schedule Subject */}
        <Dialog open={isSubjectOpen} onOpenChange={setIsSubjectOpen}>
          <DialogContent onClose={() => setIsSubjectOpen(false)}>
            <DialogHeader>
              <DialogTitle>Schedule Subject in Exam</DialogTitle>
              <DialogDescription>Assign grade class, subject, date, and pass/fail thresholds</DialogDescription>
            </DialogHeader>

            <form onSubmit={subjectForm.handleSubmit((v) => createSubjectMutation.mutate(v))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subEx">Target Examination</Label>
                <Select id="subEx" {...subjectForm.register('examId')}>
                  <option value="">Select Exam</option>
                  {exams?.map((e: any) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="subCl">Target Class</Label>
                  <Select id="subCl" {...subjectForm.register('classId')}>
                    <option value="">Select Class</option>
                    {classes?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="subSb">Curriculum Subject</Label>
                  <Select id="subSb" {...subjectForm.register('subjectId')}>
                    <option value="">Select Subject</option>
                    {subjects?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="subDt">Exam Date</Label>
                  <Input id="subDt" type="date" {...subjectForm.register('examDate')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subSt">Start Time</Label>
                  <Input id="subSt" placeholder="10:00" {...subjectForm.register('startTime')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subEt">End Time</Label>
                  <Input id="subEt" placeholder="13:00" {...subjectForm.register('endTime')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="subTm">Total Marks</Label>
                  <Input id="subTm" type="number" {...subjectForm.register('totalMarks')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subPm">Pass Marks</Label>
                  <Input id="subPm" type="number" {...subjectForm.register('passMarks')} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSubjectOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSubjectMutation.isPending}>
                  Schedule Subject
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal 3: Tabulation Sheet Matrix */}
        <Dialog open={isTabulationOpen} onOpenChange={setIsTabulationOpen}>
          <DialogContent onClose={() => setIsTabulationOpen(false)} className="max-w-4xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>Class Tabulation Sheet</DialogTitle>
                  <DialogDescription>
                    {selectedExam?.title} • Comprehensive Grade Matrix
                  </DialogDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-1.5 h-4 w-4" /> Print Sheet
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Label htmlFor="tabClSelect">Class / Grade:</Label>
                <Select
                  id="tabClSelect"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-48"
                >
                  {classes?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              {tabLoading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : !tabulationData?.results || tabulationData.results.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No processed results for this class yet. Click "Compile GPA" to process raw marks.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Student Name</TableHead>
                        {tabulationData.subjects.map((sub: any) => (
                          <TableHead key={sub.id} className="text-center">
                            {sub.subject?.code}
                          </TableHead>
                        ))}
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">GPA</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tabulationData.results.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono font-bold text-primary">#{r.classRank || 1}</TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {r.student?.firstName} {r.student?.lastName}
                          </TableCell>
                          {tabulationData.subjects.map((sub: any) => {
                            const subRes = r.subjectResults?.find((sr: any) => sr.subjectId === sub.subjectId);
                            return (
                              <TableCell key={sub.id} className="text-center font-mono text-xs">
                                {subRes ? `${subRes.obtainedMarks} (${subRes.gradeLetter})` : '—'}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center font-mono font-semibold">{r.obtainedMarks}</TableCell>
                          <TableCell className="text-center font-mono font-bold text-primary">{r.gpa?.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={r.gradeLetter === 'F' ? 'destructive' : 'default'}>
                              {r.gradeLetter}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              onClick={() => setSelectedMarksheetStudent({ examId: selectedExam?.id, studentId: r.studentId, studentName: `${r.student?.firstName} ${r.student?.lastName}`, result: r })}
                            >
                              <Eye className="mr-1 h-3.5 w-3.5" /> Marksheet
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTabulationOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal 4: Merit List */}
        <Dialog open={isMeritOpen} onOpenChange={setIsMeritOpen}>
          <DialogContent onClose={() => setIsMeritOpen(false)} className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <span>Official Institutional Merit List</span>
                  </DialogTitle>
                  <DialogDescription>{selectedExam?.title}</DialogDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
                </Button>
              </div>
            </DialogHeader>

            {meritLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : !meritList || meritList.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No merit rankings computed yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Total Score</TableHead>
                    <TableHead>GPA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meritList.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-bold">
                          {m.classRank === 1 && <span className="text-amber-500">🥇</span>}
                          {m.classRank === 2 && <span className="text-slate-400">🥈</span>}
                          {m.classRank === 3 && <span className="text-amber-700">🥉</span>}
                          <span>#{m.classRank}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {m.student?.firstName} {m.student?.lastName}
                      </TableCell>
                      <TableCell className="text-xs">
                        {m.student?.enrollments?.[0]?.section?.class?.name || 'Class'}
                      </TableCell>
                      <TableCell className="font-mono font-semibold">{m.totalScore}</TableCell>
                      <TableCell className="font-mono font-bold text-primary">{m.gpa.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMeritOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal 5: Official Marksheet Transcript */}
        <Dialog open={!!selectedMarksheetStudent} onOpenChange={() => setSelectedMarksheetStudent(null)}>
          <DialogContent onClose={() => setSelectedMarksheetStudent(null)} className="max-w-2xl">
            <div className="space-y-6 p-4">
              {/* Header */}
              <div className="text-center border-b pb-4 space-y-1">
                <h3 className="text-lg font-bold text-foreground uppercase tracking-wider">
                  Noble Residential High School
                </h3>
                <p className="text-xs text-muted-foreground">Academic Transcript & Official Marksheet</p>
                <p className="font-semibold text-xs text-primary">{selectedExam?.title}</p>
              </div>

              {/* Student Metadata Card */}
              <div className="grid grid-cols-2 gap-2 text-xs rounded-xl border p-3 bg-muted/20">
                <div>
                  <span className="text-muted-foreground">Student Name:</span>
                  <p className="font-semibold text-foreground">{selectedMarksheetStudent?.studentName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Merit Position:</span>
                  <p className="font-bold text-primary">Class Rank #{selectedMarksheetStudent?.result?.classRank || 1}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cumulative GPA:</span>
                  <p className="font-bold text-foreground text-sm">{selectedMarksheetStudent?.result?.gpa?.toFixed(2)} / 5.00</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Overall Result:</span>
                  <Badge variant={selectedMarksheetStudent?.result?.gradeLetter === 'F' ? 'destructive' : 'success'}>
                    Grade: {selectedMarksheetStudent?.result?.gradeLetter} ({selectedMarksheetStudent?.result?.remarks})
                  </Badge>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Code</TableHead>
                    <TableHead>Full Marks</TableHead>
                    <TableHead>Marks Obtained</TableHead>
                    <TableHead>Letter Grade</TableHead>
                    <TableHead>Grade Point</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedMarksheetStudent?.result?.subjectResults?.map((sr: any) => (
                    <TableRow key={sr.id}>
                      <TableCell className="font-medium text-foreground">{sr.subject?.name || sr.subjectId}</TableCell>
                      <TableCell>{sr.totalMarks}</TableCell>
                      <TableCell className="font-mono font-semibold">{sr.obtainedMarks}</TableCell>
                      <TableCell>
                        <Badge variant={sr.gradeLetter === 'F' ? 'destructive' : 'default'}>
                          {sr.gradeLetter}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-primary">{sr.gradePoint?.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Signatures */}
              <div className="grid grid-cols-2 pt-8 text-center text-xs text-muted-foreground">
                <div>
                  <div className="border-t border-muted-foreground/40 w-36 mx-auto mb-1" />
                  <span>Controller of Examinations</span>
                </div>
                <div>
                  <div className="border-t border-muted-foreground/40 w-36 mx-auto mb-1" />
                  <span>Principal Signature</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-1.5 h-4 w-4" /> Print Transcript PDF
              </Button>
              <Button onClick={() => setSelectedMarksheetStudent(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  );
}
