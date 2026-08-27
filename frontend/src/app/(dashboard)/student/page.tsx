'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  GraduationCap,
  CalendarCheck,
  Award,
  DollarSign,
  Receipt,
  FileText,
  IdCard,
  Printer,
  QrCode,
  Download,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function StudentPortalPage() {
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);

  // Queries
  const { data: student, isLoading, isError } = useQuery({
    queryKey: ['student-my-profile'],
    queryFn: async () => {
      const res = await apiClient.get('/students/me');
      return res.data.data || res.data;
    },
  });

  const enrollment = student?.enrollments?.[0];

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'STUDENT']}>
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-28 w-full rounded-2xl bg-muted/40 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          </div>
        ) : !student ? (
          <div className="p-12 text-center border-2 border-dashed rounded-3xl space-y-3">
            <GraduationCap className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <h3 className="text-base font-bold text-foreground">No Student Profile Linked</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Your user account does not have an active student scholar profile associated with it.
            </p>
          </div>
        ) : (
          <>
            {/* Student Profile Header */}
            <div className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-background p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="h-20 w-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-md font-mono">
                    {student?.firstName?.[0]}{student?.lastName?.[0]}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
                        {student?.firstName} {student?.lastName}
                      </h1>
                      <Badge variant="success">Active Scholar</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      Admission ID: <strong className="text-foreground">{student?.admissionNumber}</strong> • Roll #{enrollment?.rollNumber ?? '—'}
                    </p>
                    <p className="text-xs text-primary font-semibold">
                      {enrollment?.section?.class?.name || 'Class'} — {enrollment?.section?.name || 'Section'} {enrollment?.section?.roomNumber ? `(${enrollment.section.roomNumber})` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={() => setIsIdCardOpen(true)} variant="outline" className="shadow-sm">
                    <IdCard className="mr-1.5 h-4 w-4 text-primary" />
                    Digital Student ID
                  </Button>
                </div>
              </div>
            </div>

            {/* 4 Metric Telemetry Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Attendance Presence"
                value={`${student?.metrics?.attendancePercentage ?? 0}%`}
                description={`${student?.metrics?.presentDays ?? 0} of ${student?.metrics?.totalDays ?? 0} days recorded`}
                icon={CalendarCheck}
                iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50"
              />
              <StatCard
                title="Cumulative GPA"
                value={student?.metrics?.gpa ? `${student.metrics.gpa.toFixed(2)} / 5.0` : '—'}
                description={student?.metrics?.gradeLetter ? `Grade ${student.metrics.gradeLetter}` : 'No published results'}
                icon={Award}
                iconColor="text-purple-600 bg-purple-50 dark:bg-purple-950/50"
              />
              <StatCard
                title="Outstanding Dues"
                value={`৳ ${(student?.metrics?.outstandingDue || 0).toFixed(2)}`}
                description={student?.metrics?.outstandingDue ? 'Pending fee invoices' : 'All tuition cleared'}
                icon={DollarSign}
                iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/50"
              />
              <StatCard
                title="Total Enrolled"
                value={enrollment?.section?.class?.name || 'Enrolled'}
                description={enrollment?.academicYear?.name || 'Current Session'}
                icon={Calendar}
                iconColor="text-amber-600 bg-amber-50 dark:bg-amber-950/50"
              />
            </div>

        {/* Tabbed Portal Views */}
        <Tabs defaultValue="academics" className="w-full">
          <TabsList className="grid grid-cols-5 max-w-2xl">
            <TabsTrigger value="academics">Academics</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="results">Results & GPA</TabsTrigger>
            <TabsTrigger value="fees">Fee Ledger</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>

          {/* TAB 1: ACADEMICS & ROUTINE */}
          <TabsContent value="academics">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Academic Enrollment & Schedule</CardTitle>
                <CardDescription>{enrollment?.academicYear?.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-muted/20 border">
                    <span className="text-muted-foreground block text-[10px]">Academic Class</span>
                    <strong className="text-foreground text-sm">{enrollment?.section?.class?.name}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/20 border">
                    <span className="text-muted-foreground block text-[10px]">Section</span>
                    <strong className="text-foreground text-sm">{enrollment?.section?.name}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/20 border">
                    <span className="text-muted-foreground block text-[10px]">Classroom Room</span>
                    <strong className="text-foreground text-sm">{enrollment?.section?.roomNumber}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/20 border">
                    <span className="text-muted-foreground block text-[10px]">Class Roll</span>
                    <strong className="text-primary text-sm font-mono">#{enrollment?.rollNumber}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: ATTENDANCE */}
          <TabsContent value="attendance">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">30-Day Classroom Attendance History</CardTitle>
                <CardDescription>Daily verified presence records</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks / Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student?.attendances?.map((att: any) => (
                      <TableRow key={att.id}>
                        <TableCell className="font-mono text-xs text-foreground">
                          {new Date(att.date).toLocaleDateString()}
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
                        <TableCell className="text-xs text-muted-foreground">{att.remarks || 'Recorded on time'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: RESULTS & MARKSHEET */}
          <TabsContent value="results">
            {student?.results?.map((res: any) => (
              <Card key={res.id} className="shadow-sm space-y-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">{res.exam?.title}</CardTitle>
                    <CardDescription>
                      GPA: <strong className="text-primary font-mono">{res.gpa.toFixed(2)}</strong> • Grade:{' '}
                      <strong className="text-foreground">{res.gradeLetter}</strong> • Class Rank #{res.classRank}
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => window.print()}>
                    <Printer className="mr-1.5 h-4 w-4" /> Print Marksheet PDF
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Total Marks</TableHead>
                        <TableHead>Obtained Marks</TableHead>
                        <TableHead>Letter Grade</TableHead>
                        <TableHead>Grade Point</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {res.subjectResults?.map((sr: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-semibold text-foreground">{sr.subject?.name}</TableCell>
                          <TableCell className="font-mono text-xs">{sr.totalMarks}</TableCell>
                          <TableCell className="font-mono font-bold text-foreground">{sr.obtainedMarks}</TableCell>
                          <TableCell>
                            <Badge variant="default">{sr.gradeLetter}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-primary font-bold">{sr.gradePoint.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* TAB 4: FEES & INVOICES */}
          <TabsContent value="fees">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Tuition Invoices & Payment History</CardTitle>
                <CardDescription>Verified institutional payment receipts</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student?.invoices?.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs font-semibold text-primary">{inv.invoiceNumber}</TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">{inv.title}</TableCell>
                        <TableCell className="font-mono font-bold text-foreground">${inv.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={inv.status === 'PAID' ? 'success' : 'destructive'}>{inv.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedReceipt({ receiptNumber: `RCP-${inv.invoiceNumber.substring(4)}`, amount: inv.totalAmount, title: inv.title })}
                          >
                            <Receipt className="mr-1.5 h-3.5 w-3.5" /> View Receipt
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: STUDY MATERIALS */}
          <TabsContent value="materials">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-sm">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <div>
                      <h4 className="font-bold text-xs text-foreground">Grade 10 Syllabus & Learning Outcomes</h4>
                      <p className="text-[10px] text-muted-foreground">Updated for Term 2026</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-indigo-600" />
                    <div>
                      <h4 className="font-bold text-xs text-foreground">Prescribed Textbooks & Booklist</h4>
                      <p className="text-[10px] text-muted-foreground">Session 2026-2027</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal: Digital Student ID Card */}
        <Dialog open={isIdCardOpen} onOpenChange={setIsIdCardOpen}>
          <DialogContent onClose={() => setIsIdCardOpen(false)} className="max-w-sm">
            <div className="rounded-2xl border-2 border-primary bg-gradient-to-b from-card to-background p-6 shadow-2xl space-y-4 text-center">
              {/* Header */}
              <div className="border-b pb-3 space-y-1">
                <div className="h-10 w-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mx-auto shadow-md">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Noble Residential High School</h3>
                <p className="text-[10px] text-muted-foreground font-semibold">Official Student Identity Card</p>
              </div>

              {/* Photo & Bio */}
              <div className="space-y-2">
                <div className="h-24 w-24 rounded-2xl bg-primary/10 border-2 border-primary/40 flex items-center justify-center mx-auto font-bold font-mono text-2xl text-primary">
                  {student?.firstName?.[0]}{student?.lastName?.[0]}
                </div>
                <h4 className="font-bold text-base text-foreground">{student?.firstName} {student?.lastName}</h4>
                <p className="font-mono text-xs font-semibold text-primary">{student?.admissionNumber}</p>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-left rounded-xl bg-muted/30 p-3 border">
                <div>
                  <span className="text-muted-foreground block text-[9px]">Class & Section:</span>
                  <strong className="text-foreground">{enrollment?.section?.class?.name || 'Class'} - {enrollment?.section?.name || 'Section'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px]">Class Roll:</span>
                  <strong className="text-foreground">#{enrollment?.rollNumber ?? '—'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px]">Blood Group:</span>
                  <strong className="text-foreground">{student?.bloodGroup || '—'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px]">Emergency Contact:</span>
                  <strong className="text-foreground">{student?.emergencyContact || '—'}</strong>
                </div>
              </div>

              {/* Secure QR Code for Verification */}
              <div className="pt-2 flex flex-col items-center space-y-1">
                <div className="h-16 w-16 bg-white p-1 rounded-lg border flex items-center justify-center shadow-inner">
                  <div className="h-12 w-12 rounded border border-dashed border-slate-400 flex items-center justify-center text-[8px] font-mono text-slate-500">QR CODE</div>
                </div>
                <span className="text-[9px] text-muted-foreground font-mono">Secure Verification Token Validated</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => window.print()} className="w-full">
                <Printer className="mr-1.5 h-4 w-4" /> Print ID Card
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Money Receipt */}
        <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
          <DialogContent onClose={() => setSelectedReceipt(null)} className="max-w-md">
            <div className="space-y-4 p-4 text-xs">
              <div className="text-center border-b pb-3 space-y-1">
                <h3 className="text-sm font-bold text-foreground uppercase">Noble Residential High School</h3>
                <p className="text-[10px] text-muted-foreground">Official Fee Payment Receipt</p>
                <Badge variant="success">PAID</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Receipt Number:</span>
                  <strong className="font-mono text-primary">{selectedReceipt?.receiptNumber}</strong>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Fee Description:</span>
                  <span>{selectedReceipt?.title}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <strong className="font-mono text-emerald-600 text-sm">৳ {selectedReceipt?.amount?.toFixed(2)}</strong>
                </div>
              </div>

              <div className="pt-4 text-center text-[10px] text-muted-foreground">
                <div className="border-t border-muted-foreground/40 w-32 mx-auto mb-1" />
                <span>Authorized Bursar Office</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-1.5 h-4 w-4" /> Print Receipt
              </Button>
              <Button onClick={() => setSelectedReceipt(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </>
        )}
      </div>
    </RouteGuard>
  );
}
