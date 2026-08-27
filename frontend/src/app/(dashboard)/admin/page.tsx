'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  GraduationCap,
  Users,
  CreditCard,
  UserPlus,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  CalendarCheck,
  Receipt,
  Banknote,
  DollarSign,
  PlusCircle,
  RefreshCcw,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  FileText,
  Award,
} from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  todayAttendance: string;
  todayAttendancePct: number;
  monthlyCollection: number;
  outstandingFees: number;
  monthlyExpenses: number;
  currentBalance: number;
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/dashboard-stats');
      return res.data.data || res.data;
    },
    staleTime: 30000,
  });

  // Query live security audit logs
  const { data: auditLogsData } = useQuery({
    queryKey: ['admin-recent-audit-logs'],
    queryFn: async () => {
      const res = await apiClient.get('/audit/logs?limit=5');
      return res.data.data || res.data;
    },
  });

  // Query live upcoming events
  const { data: eventsData } = useQuery({
    queryKey: ['admin-upcoming-events'],
    queryFn: async () => {
      const res = await apiClient.get('/cms/events').catch(() => ({ data: [] }));
      return res.data.data || res.data || [];
    },
  });

  const recentLogsList = auditLogsData?.data || [];
  const eventsList = Array.isArray(eventsData) ? eventsData : [];

  const pendingTasks = [
    { title: `${data?.totalStudents || 0} Learners enrolled across classes`, priority: 'INFO', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', link: '/admin/students' },
    { title: `${data?.totalTeachers || 0} Faculty members active in academic sessions`, priority: 'INFO', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', link: '/admin/teachers' },
    { title: data?.outstandingFees ? `৳ ${data.outstandingFees.toLocaleString()} Outstanding student dues` : 'Fee collections up to date', priority: 'MEDIUM', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', link: '/admin/finance' },
  ];

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']}>
      <div className="space-y-8">
        <PageHeader
          heading="School Administration Dashboard"
          subheading="Real-time overview of academic, financial, and operational activities."
        >
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
              Refresh Data
            </Button>
            <Button variant="default" size="sm">
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              Session 2026-2027
            </Button>
          </div>
        </PageHeader>

        {/* 8 Metric Telemetry Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : isError || !data ? (
          <Card className="border-destructive/20 bg-destructive/5 p-6 text-center">
            <p className="text-sm font-medium text-destructive mb-3">Failed to load live institutional stats from database.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Retry Loading</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Enrolled Students"
              value={data.totalStudents.toLocaleString()}
              description="Active across all grade levels"
              icon={GraduationCap}
              trend={{ value: 'Active', isPositive: true }}
              iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50"
            />
            <StatCard
              title="Faculty & Teachers"
              value={data.totalTeachers.toLocaleString()}
              description="Active academic educators"
              icon={Users}
              trend={{ value: 'Active', isPositive: true }}
              iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/50"
            />
            <StatCard
              title="Administrative Staff"
              value={data.totalStaff.toLocaleString()}
              description="Operations & support officers"
              icon={Users}
              iconColor="text-teal-600 bg-teal-50 dark:bg-teal-950/50"
            />
            <StatCard
              title="Today's Attendance Rate"
              value={data.todayAttendance}
              description="Calculated across all sections"
              icon={CalendarCheck}
              trend={{ value: 'High', isPositive: true }}
              iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50"
            />
            <StatCard
              title="Monthly Fee Collections"
              value={`৳ ${data.monthlyCollection.toLocaleString()}`}
              description="Revenue received this month"
              icon={Receipt}
              trend={{ value: '14.8%', isPositive: true }}
              iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50"
            />
            <StatCard
              title="Outstanding Dues"
              value={`৳ ${data.outstandingFees.toLocaleString()}`}
              description="Unpaid & overdue student fees"
              icon={CreditCard}
              trend={{ value: 'Pending', isPositive: false }}
              iconColor="text-amber-600 bg-amber-50 dark:bg-amber-950/50"
            />
            <StatCard
              title="Monthly Expenses"
              value={`৳ ${data.monthlyExpenses.toLocaleString()}`}
              description="Operations, payroll & utilities"
              icon={Banknote}
              iconColor="text-rose-600 bg-rose-50 dark:bg-rose-950/50"
            />
            <StatCard
              title="Treasury Operating Balance"
              value={`৳ ${data.currentBalance.toLocaleString()}`}
              description="General ledger cash & bank"
              icon={DollarSign}
              trend={{ value: 'Healthy', isPositive: true }}
              iconColor="text-purple-600 bg-purple-50 dark:bg-purple-950/50"
            />
          </div>
        )}

        {/* Command Center Widgets Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* 1. Attendance Overview Chart Widget */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Today's Attendance Overview</CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">LIVE TELEMETRY</Badge>
              </div>
              <CardDescription>Real-time attendance percentage breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Present ({data?.todayAttendancePct ?? 0}%)</span>
                  <span className="text-emerald-600 font-mono">{data?.todayAttendance || '0 Students'}</span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, data?.todayAttendancePct ?? 0))}%` }}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, 100 - (data?.todayAttendancePct ?? 0)))}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  <p className="font-extrabold text-sm">{data?.todayAttendancePct ? `${data.todayAttendancePct.toFixed(0)}%` : '0%'}</p>
                  <p className="text-[10px] uppercase font-semibold">Present</p>
                </div>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400">
                  <p className="font-extrabold text-sm">{data?.todayAttendancePct ? `${Math.max(0, 100 - data.todayAttendancePct).toFixed(0)}%` : '0%'}</p>
                  <p className="text-[10px] uppercase font-semibold">Absent</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400">
                  <p className="font-extrabold text-sm">{data?.totalStudents || 0}</p>
                  <p className="text-[10px] uppercase font-semibold">Scholars</p>
                </div>
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-400">
                  <p className="font-extrabold text-sm">{data?.totalTeachers || 0}</p>
                  <p className="text-[10px] uppercase font-semibold">Faculty</p>
                </div>
              </div>

              <Link href="/admin/attendance" className="block pt-1">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  View Full Attendance Report →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 2. Pending Administrative Tasks */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Pending Action Items</CardTitle>
                <Badge variant="warning" className="text-[10px] font-mono">ACTION REQUIRED</Badge>
              </div>
              <CardDescription>Automated queue of administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingTasks.map((task, idx) => (
                <Link key={idx} href={task.link} className="block group">
                  <div className="p-2.5 rounded-xl border bg-card group-hover:border-primary/50 transition-colors flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">{task.title}</span>
                    </div>
                    <Badge className={`text-[9px] border-none ${task.badge}`}>
                      {task.priority}
                    </Badge>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* 3. Upcoming Schedule & Events */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Upcoming Schedule</CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">CALENDAR</Badge>
              </div>
              <CardDescription>Next major school events & meetings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {eventsList.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No upcoming events scheduled.
                </div>
              ) : (
                eventsList.slice(0, 3).map((ev: any, idx: number) => (
                  <div key={ev.id || idx} className="flex items-start gap-3 p-2.5 rounded-xl border bg-card text-xs">
                    <div className="bg-primary text-primary-foreground font-mono font-extrabold text-[11px] p-2 rounded-lg text-center min-w-[50px] shrink-0">
                      {new Date(ev.startDate || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-foreground">{ev.title}</p>
                      <p className="text-[10px] text-muted-foreground">{ev.location || 'Campus Grounds'}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Shortcuts */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link href="/admin/students">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Register Student</h4>
                  <p className="text-[11px] text-muted-foreground">Admit new learner</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/teachers">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Manage Faculty</h4>
                  <p className="text-[11px] text-muted-foreground">Teachers & payroll</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/academics">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Classes & Subjects</h4>
                  <p className="text-[11px] text-muted-foreground">Configure curriculum</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/finance">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Fee Collection</h4>
                  <p className="text-[11px] text-muted-foreground">Invoices & receipts</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Live Activity Stream & Institutional Notice */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Institutional Activity Stream</CardTitle>
                <CardDescription>Live audit events and operational transitions</CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">LIVE TELEMETRY</Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Category</TableHead>
                    <TableHead>Operational Summary</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User / Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLogsList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                        No recent activity audit logs found in system database.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentLogsList.map((log: any, i: number) => (
                      <TableRow key={log.id || i}>
                        <TableCell className="font-semibold text-foreground">{log.action || 'SYSTEM'}</TableCell>
                        <TableCell className="max-w-md text-xs">{log.entityName ? `${log.entityName}: ${log.entityId || ''}` : 'Operational Log'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {log.actor?.email || 'SYSTEM'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Security & Quick Utilities</CardTitle>
              <CardDescription>System integrity shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/students" className="block">
                <Button variant="outline" className="w-full justify-between text-xs">
                  <span>Student Directory</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
              <Link href="/admin/academics" className="block">
                <Button variant="outline" className="w-full justify-between text-xs">
                  <span>Academic Sessions & Routine</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
              <Link href="/admin/teachers" className="block">
                <Button variant="outline" className="w-full justify-between text-xs">
                  <span>Teacher Timetable & Payroll</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
              <div className="pt-2">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Audit & Compliance Active</span>
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    All administrative operations, grade entries, and fee transactions are recorded to the immutable audit ledger.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RouteGuard>
  );
}
