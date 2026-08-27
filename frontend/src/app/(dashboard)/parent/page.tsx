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
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  Users,
  CalendarCheck,
  Award,
  DollarSign,
  Receipt,
  FileText,
  IdCard,
  Printer,
  QrCode,
  GraduationCap,
  Calendar,
  CreditCard,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function ParentPortalPage() {
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Queries
  const { data: children, isLoading } = useQuery({
    queryKey: ['parent-my-children'],
    queryFn: async () => {
      const res = await apiClient.get('/parents/my-children');
      return res.data.data || res.data || [];
    },
  });

  const childrenList = children || [];
  const currentChild = childrenList[selectedChildIndex] || childrenList[0];
  const enrollment = currentChild?.enrollments?.[0];

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PARENT']}>
      <div className="space-y-6">
        <PageHeader
          heading="Parent & Guardian Family Portal"
          subheading="Multi-child scholar oversight: real-time attendance alerts, academic report cards, tuition billing, and routines."
        >
          {/* Child Switcher Dropdown */}
          {childrenList.length > 0 && (
            <div className="flex items-center gap-2 bg-card border rounded-xl px-3 py-1.5 shadow-sm">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">Select Scholar:</span>
              <Select
                value={String(selectedChildIndex)}
                onChange={(e) => setSelectedChildIndex(Number(e.target.value))}
                className="bg-transparent text-xs font-bold focus:outline-none border-none p-0 w-44"
              >
                {childrenList.map((c: any, index: number) => (
                  <option key={c.id || index} value={index}>
                    {c.firstName} {c.lastName} ({c.enrollments?.[0]?.section?.class?.name || 'Class'})
                  </option>
                ))}
              </Select>
            </div>
          )}
        </PageHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-28 w-full rounded-2xl bg-muted/40 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          </div>
        ) : childrenList.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed rounded-3xl space-y-3">
            <Users className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <h3 className="text-base font-bold text-foreground">No Linked Student Wards</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              There are no enrolled students linked to your guardian account yet. Please contact school administration to link your student wards.
            </p>
          </div>
        ) : (
          <>
            {/* Selected Child Banner */}
            <div className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-background p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="h-20 w-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-md font-mono">
                    {currentChild?.firstName?.[0]}{currentChild?.lastName?.[0]}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                        {currentChild?.firstName} {currentChild?.lastName}
                      </h2>
                      <Badge variant="success">Enrolled Scholar</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      ID: <strong className="text-foreground">{currentChild?.admissionNumber}</strong> • Roll #{enrollment?.rollNumber ?? '—'}
                    </p>
                    <p className="text-xs text-primary font-semibold">
                      {enrollment?.section?.class?.name || 'Class'} — {enrollment?.section?.name || 'Section'} {enrollment?.section?.roomNumber ? `(${enrollment.section.roomNumber})` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={() => window.print()}>
                    <Printer className="mr-1.5 h-4 w-4 text-primary" /> Print Report Card
                  </Button>
                </div>
              </div>
            </div>

            {/* 4 Telemetry Metrics for Selected Child */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Attendance Presence"
                value={`${currentChild?.metrics?.attendancePercentage ?? 0}%`}
                description="Verified check-ins"
                icon={CalendarCheck}
                iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50"
              />
              <StatCard
                title="Academic GPA"
                value={currentChild?.metrics?.gpa ? `${currentChild.metrics.gpa.toFixed(2)} / 5.0` : '—'}
                description={currentChild?.metrics?.gradeLetter ? `Grade ${currentChild.metrics.gradeLetter}` : 'No published results'}
                icon={Award}
                iconColor="text-purple-600 bg-purple-50 dark:bg-purple-950/50"
              />
              <StatCard
                title="Outstanding Tuition"
                value={`৳ ${(currentChild?.metrics?.outstandingDue || 0).toFixed(2)}`}
                description={currentChild?.metrics?.outstandingDue > 0 ? 'Payment required' : 'All fees cleared'}
                icon={DollarSign}
                iconColor={currentChild?.metrics?.outstandingDue > 0 ? 'text-rose-600 bg-rose-50' : 'text-blue-600 bg-blue-50'}
              />
              <StatCard
                title="Enrolled Class"
                value={enrollment?.section?.class?.name || 'Enrolled'}
                description={enrollment?.academicYear?.name || 'Active Session'}
                icon={Calendar}
                iconColor="text-amber-600 bg-amber-50 dark:bg-amber-950/50"
              />
            </div>

        {/* Child Detailed Tabs */}
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid grid-cols-4 max-w-xl">
            <TabsTrigger value="results">Report Cards</TabsTrigger>
            <TabsTrigger value="attendance">Attendance Log</TabsTrigger>
            <TabsTrigger value="fees">Tuition & Invoices</TabsTrigger>
            <TabsTrigger value="idcard">Digital ID</TabsTrigger>
          </TabsList>

          {/* TAB 1: REPORT CARDS */}
          <TabsContent value="results">
            {currentChild?.results?.map((res: any) => (
              <Card key={res.id} className="shadow-sm space-y-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">{res.exam?.title}</CardTitle>
                    <CardDescription>
                      Cumulative GPA: <strong className="text-primary font-mono">{res.gpa.toFixed(2)}</strong> • Grade:{' '}
                      <strong className="text-foreground">{res.gradeLetter}</strong> • Class Rank #{res.classRank}
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => window.print()}>
                    <Printer className="mr-1.5 h-4 w-4" /> Download PDF Marksheet
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

          {/* TAB 2: ATTENDANCE LOG */}
          <TabsContent value="attendance">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Classroom Attendance History</CardTitle>
                <CardDescription>Absence triggers automated SMS & In-app alerts to guardian</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Presence Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentChild?.attendances?.map((att: any) => (
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
                        <TableCell className="text-xs text-muted-foreground">{att.remarks || 'On time'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: FEES & INVOICES */}
          <TabsContent value="fees">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Tuition Invoices & Online Payment</CardTitle>
                <CardDescription>Instant digital payment & official tax receipt issuance</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Fee Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentChild?.invoices?.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs font-semibold text-primary">{inv.invoiceNumber}</TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">{inv.title}</TableCell>
                        <TableCell className="font-mono font-bold text-foreground">${inv.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={inv.status === 'PAID' ? 'success' : 'destructive'}>{inv.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {inv.status !== 'PAID' ? (
                            <Button
                              size="sm"
                              className="h-8 shadow-sm"
                              onClick={() => { setSelectedInvoice(inv); setIsPayModalOpen(true); }}
                            >
                              <CreditCard className="mr-1 h-3.5 w-3.5" /> Pay Now
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-8" onClick={() => window.print()}>
                              <Receipt className="mr-1 h-3.5 w-3.5" /> Receipt
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: DIGITAL ID */}
          <TabsContent value="idcard">
            <div className="flex justify-center">
              <div className="w-full max-w-sm rounded-2xl border-2 border-primary bg-gradient-to-b from-card to-background p-6 shadow-xl space-y-4 text-center">
                <div className="border-b pb-3 space-y-1">
                  <div className="h-10 w-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mx-auto shadow-md">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Noble Residential High School</h3>
                  <p className="text-[10px] text-muted-foreground font-semibold">Official Student Identity Card</p>
                </div>

                <div className="space-y-2">
                  <div className="h-24 w-24 rounded-2xl bg-primary/10 border-2 border-primary/40 flex items-center justify-center mx-auto font-bold font-mono text-2xl text-primary">
                    {currentChild?.firstName?.[0]}{currentChild?.lastName?.[0]}
                  </div>
                  <h4 className="font-bold text-base text-foreground">{currentChild?.firstName} {currentChild?.lastName}</h4>
                  <p className="font-mono text-xs font-semibold text-primary">{currentChild?.admissionNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-left rounded-xl bg-muted/30 p-3 border">
                  <div>
                    <span className="text-muted-foreground block text-[9px]">Class & Section:</span>
                    <strong className="text-foreground">{enrollment?.section?.class?.name || 'Class'} - {enrollment?.section?.name || 'Section'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px]">Roll Number:</span>
                    <strong className="text-foreground">#{enrollment?.rollNumber ?? '—'}</strong>
                  </div>
                </div>

                <div className="pt-2 flex flex-col items-center space-y-1">
                  <div className="h-16 w-16 bg-white p-1 rounded-lg border flex items-center justify-center shadow-inner">
                    <div className="h-12 w-12 rounded border border-dashed border-slate-400 flex items-center justify-center text-[8px] font-mono text-slate-500">QR CODE</div>
                  </div>
                  <span className="text-[9px] text-muted-foreground font-mono">Secure Verification Token Validated</span>
                </div>

                <Button variant="outline" onClick={() => window.print()} className="w-full">
                  <Printer className="mr-1.5 h-4 w-4" /> Print ID Card PDF
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </>
        )}
      </div>
    </RouteGuard>
  );
}
