'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  CreditCard,
  Award,
  FileText,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  Printer,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  IdCard,
} from 'lucide-react';

export default function Student360ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const { data: student, isLoading, isError, refetch } = useQuery({
    queryKey: ['student-360', studentId],
    queryFn: async () => {
      const res = await apiClient.get(`/students/${studentId}`);
      return res.data.data || res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-bold">Student Profile Not Found</h3>
        <p className="text-sm text-muted-foreground">The student profile does not exist or has been archived.</p>
        <Button onClick={() => router.push('/admin/students')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students Directory
        </Button>
      </div>
    );
  }

  const activeEnrollment = student.enrollments?.[0];
  const primaryParent = student.parents?.[0]?.parent;
  const metrics = student.metrics || {
    attendancePercentage: 0,
    totalDays: 0,
    presentDays: 0,
    lateDays: 0,
    absentDays: 0,
    totalInvoiced: 0,
    totalPaid: 0,
    outstandingDue: 0,
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'TEACHER', 'ACCOUNTANT']}>
      <div className="space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/students"
            className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Students Directory
          </Link>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Print Record
            </Button>
          </div>
        </div>

        {/* Student 360 Header Banner */}
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary shadow-inner">
                  {student.firstName[0]}
                  {student.lastName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-foreground">
                      {student.firstName} {student.lastName}
                    </h2>
                    <Badge variant={student.status === 'ACTIVE' ? 'success' : 'destructive'}>
                      {student.status}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="font-mono font-semibold text-primary">
                      Admission #{student.admissionNumber}
                    </span>
                    <span>•</span>
                    <span>
                      Class:{' '}
                      <strong className="text-foreground">
                        {activeEnrollment?.section?.class?.name || 'Unassigned'} — {activeEnrollment?.section?.name}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Roll No: <strong className="text-foreground">{activeEnrollment?.rollNumber ?? '—'}</strong>
                    </span>
                    <span>•</span>
                    <span>Gender: {student.gender}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <div className="rounded-lg bg-muted p-2.5 text-center min-w-[90px]">
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold">Attendance</span>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {metrics.attendancePercentage}%
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-2.5 text-center min-w-[90px]">
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold">Outstanding</span>
                  <p className="text-sm font-bold text-foreground">
                    ${metrics.outstandingDue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4 Overview Quick Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Attendance Rate"
            value={`${metrics.attendancePercentage}%`}
            description={`${metrics.presentDays} of ${metrics.totalDays} days attended`}
            icon={CalendarCheck}
            iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50"
          />
          <StatCard
            title="Total Billed"
            value={`$${metrics.totalInvoiced.toFixed(2)}`}
            description="Institutional fee invoices"
            icon={CreditCard}
            iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/50"
          />
          <StatCard
            title="Total Paid"
            value={`$${metrics.totalPaid.toFixed(2)}`}
            description={metrics.outstandingDue === 0 ? 'All dues cleared' : `$${metrics.outstandingDue} remaining`}
            icon={CheckCircle2}
            iconColor="text-teal-600 bg-teal-50 dark:bg-teal-950/50"
          />
          <StatCard
            title="Active ID Card"
            value={student.idCards?.[0]?.cardNumber || 'Issued'}
            description="Status: ACTIVE"
            icon={IdCard}
            iconColor="text-purple-600 bg-purple-50 dark:bg-purple-950/50"
          />
        </div>

        {/* Tabbed 360° Inspection Modules */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full h-auto p-1.5 gap-1">
            <TabsTrigger value="overview">Overview & Bio</TabsTrigger>
            <TabsTrigger value="parents">Parents & Guardians</TabsTrigger>
            <TabsTrigger value="academic">Enrollment History</TabsTrigger>
            <TabsTrigger value="attendance">Attendance Log</TabsTrigger>
            <TabsTrigger value="fees">Fees & Invoices</TabsTrigger>
            <TabsTrigger value="results">Exams & GPA</TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW & DEMOGRAPHICS */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Personal & Demographic Data</CardTitle>
                  <CardDescription>Identity and contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Date of Birth</span>
                    <span className="font-medium text-foreground">
                      {new Date(student.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Gender</span>
                    <span className="font-medium text-foreground">{student.gender}</span>
                  </div>
                  <div className="grid grid-cols-2 border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Blood Group</span>
                    <span className="font-medium text-foreground">{student.bloodGroup || 'Not Recorded'}</span>
                  </div>
                  <div className="grid grid-cols-2 border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Nationality</span>
                    <span className="font-medium text-foreground">{student.nationality || 'Citizen'}</span>
                  </div>
                  <div className="grid grid-cols-2 border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Portal Account</span>
                    <span className="font-medium text-foreground">{student.user?.email}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-muted-foreground">Last Login</span>
                    <span className="font-medium text-foreground">
                      {student.user?.lastLoginAt
                        ? new Date(student.user.lastLoginAt).toLocaleString()
                        : 'Never logged in'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Addresses & Emergency Contacts</CardTitle>
                  <CardDescription>Residence and emergency dispatch information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Emergency Contact</span>
                    <span className="font-medium text-foreground font-mono">
                      {student.emergencyContact || '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Present Address</span>
                    <span className="font-medium text-foreground">
                      {student.presentAddress || '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-muted-foreground">Permanent Address</span>
                    <span className="font-medium text-foreground">
                      {student.permanentAddress || '—'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: PARENTS & GUARDIANS */}
          <TabsContent value="parents">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Linked Parents & Legal Guardians</CardTitle>
                <CardDescription>Authorized guardians with portal and billing access</CardDescription>
              </CardHeader>
              <CardContent>
                {student.parents?.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No linked parents on record.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {student.parents.map((pLink: any) => {
                      const p = pLink.parent || pLink.guardian;
                      return (
                        <div key={pLink.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-foreground">
                              {p?.firstName} {p?.lastName}
                            </h4>
                            <Badge variant="outline">{pLink.relationship}</Badge>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" /> {p?.phone || 'No phone recorded'}
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5" /> {p?.email || p?.user?.email || '—'}
                            </p>
                            {p?.occupation && <p>Occupation: {p.occupation}</p>}
                          </div>
                          <div className="pt-2 flex items-center gap-2">
                            {pLink.isPrimary && <Badge variant="success">Primary Contact</Badge>}
                            {pLink.hasBillingAccess && <Badge variant="default">Billing Access</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: ACADEMIC ENROLLMENT */}
          <TabsContent value="academic">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Enrollment History & Sessions</CardTitle>
                <CardDescription>Class promotions, sections, and assigned roll numbers</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Enrolled Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.enrollments?.map((enr: any) => (
                      <TableRow key={enr.id}>
                        <TableCell className="font-medium text-foreground">
                          {enr.academicYear?.name}
                        </TableCell>
                        <TableCell>{enr.section?.class?.name}</TableCell>
                        <TableCell>{enr.section?.name}</TableCell>
                        <TableCell className="font-mono font-bold text-primary">{enr.rollNumber}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(enr.enrolledAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={enr.isActive ? 'success' : 'default'}>
                            {enr.isActive ? 'CURRENT' : 'COMPLETED'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: ATTENDANCE LOG */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Attendance History</CardTitle>
                <CardDescription>Daily clock-in logs and attendance status verification</CardDescription>
              </CardHeader>
              <CardContent>
                {student.attendances?.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No attendance records logged yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.attendances.map((att: any) => (
                        <TableRow key={att.id}>
                          <TableCell className="font-medium text-foreground">
                            {new Date(att.date).toLocaleDateString(undefined, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                att.status === 'PRESENT'
                                  ? 'success'
                                  : att.status === 'LATE'
                                  ? 'warning'
                                  : 'destructive'
                              }
                            >
                              {att.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {att.remarks || 'Regular check-in'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: FEES & INVOICES */}
          <TabsContent value="fees">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Billing Invoices & Money Receipts</CardTitle>
                <CardDescription>Tuition fees, lab charges, and payment verification</CardDescription>
              </CardHeader>
              <CardContent>
                {student.invoices?.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No invoices issued for this student.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.invoices.map((inv: any) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-xs font-semibold text-primary">
                            {inv.invoiceNumber}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">{inv.title}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(inv.dueDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-semibold">${inv.totalAmount.toFixed(2)}</TableCell>
                          <TableCell className="text-xs font-semibold text-emerald-600">
                            ${inv.paidAmount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                inv.status === 'PAID'
                                  ? 'success'
                                  : inv.status === 'PARTIAL'
                                  ? 'warning'
                                  : 'destructive'
                              }
                            >
                              {inv.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: RESULTS & EXAM PERFORMANCE */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Examination Performance & GPA</CardTitle>
                <CardDescription>Term grade point average and subject marks</CardDescription>
              </CardHeader>
              <CardContent>
                {student.marks?.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No exam marks submitted yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam Event</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Theory</TableHead>
                        <TableHead>Practical</TableHead>
                        <TableHead>Total Score</TableHead>
                        <TableHead>Grade Point (GP)</TableHead>
                        <TableHead>Letter Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.marks.map((m: any) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium text-foreground">
                            {m.examSubject?.exam?.title || '—'}
                          </TableCell>
                          <TableCell>{m.examSubject?.subject?.name || '—'}</TableCell>
                          <TableCell>{m.theoryScore ?? '—'}</TableCell>
                          <TableCell>{m.practicalScore ?? '—'}</TableCell>
                          <TableCell className="font-semibold">{m.totalScore ?? 0}/100</TableCell>
                          <TableCell className="font-mono font-bold text-primary">{m.gradePoint ? m.gradePoint.toFixed(2) : '—'}</TableCell>
                          <TableCell>
                            <Badge variant={m.gradeLetter === 'F' ? 'destructive' : 'default'}>{m.gradeLetter || '—'}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RouteGuard>
  );
}
