'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  CalendarCheck,
  Calendar,
  Users,
  UserCheck,
  UserX,
  Clock,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export default function AdminAttendanceDashboardPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);

  // Queries
  const { data: dailyStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-daily-stats', selectedDate],
    queryFn: async () => {
      const res = await apiClient.get(`/attendance/daily-stats?date=${selectedDate}`);
      return res.data.data || res.data;
    },
  });

  const { data: classBreakdown, isLoading: classesLoading } = useQuery({
    queryKey: ['admin-class-breakdown', selectedDate],
    queryFn: async () => {
      const res = await apiClient.get(`/attendance/class-breakdown?date=${selectedDate}`);
      return res.data.data || res.data;
    },
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['admin-monthly-report', selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await apiClient.get(`/attendance/monthly-report?year=${selectedYear}&month=${selectedMonth}`);
      return res.data.data || res.data;
    },
  });

  const exportMonthlyCSV = () => {
    if (!monthlyData || monthlyData.length === 0) return;

    const headers = ['Date', 'Student ID', 'Student Name', 'Class', 'Section', 'Status', 'Remarks'];
    const rows = monthlyData.map((row: any) => [
      new Date(row.date).toISOString().split('T')[0],
      row.student?.admissionNumber || '',
      `"${row.student?.firstName || ''} ${row.student?.lastName || ''}"`,
      row.section?.class?.name || '',
      row.section?.name || '',
      row.status,
      `"${row.remarks || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']}>
      <div className="space-y-6">
        <PageHeader
          heading="Institutional Attendance Intelligence"
          subheading="Campus-wide daily clock-ins, class-wise presence rates, and exportable monthly attendance logs."
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 shadow-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-semibold focus:outline-none"
              />
            </div>
            <Button size="sm" variant="outline" onClick={exportMonthlyCSV}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </PageHeader>

        {/* Daily Metric Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard
              title="Attendance Rate"
              value={dailyStats?.percentage ? `${dailyStats.percentage}%` : '0%'}
              description="Today's presence"
              icon={CalendarCheck}
              iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50"
            />
            <StatCard
              title="Present Count"
              value={dailyStats?.presentCount?.toString() || '0'}
              description="In classroom"
              icon={UserCheck}
              iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50"
            />
            <StatCard
              title="Absent Count"
              value={dailyStats?.absentCount?.toString() || '0'}
              description="SMS alerted"
              icon={UserX}
              iconColor="text-rose-600 bg-rose-50 dark:bg-rose-950/50"
            />
            <StatCard
              title="Late Arrivals"
              value={dailyStats?.lateCount?.toString() || '0'}
              description="Tardy check-in"
              icon={Clock}
              iconColor="text-amber-600 bg-amber-50 dark:bg-amber-950/50"
            />
            <StatCard
              title="Approved Leave"
              value={dailyStats?.leaveCount?.toString() || '0'}
              description="Sanctioned leave"
              icon={Calendar}
              iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/50"
            />
            <StatCard
              title="Excused Count"
              value={dailyStats?.excusedCount?.toString() || '0'}
              description="Medical/official"
              icon={CheckCircle2}
              iconColor="text-purple-600 bg-purple-50 dark:bg-purple-950/50"
            />
          </div>
        )}

        <Tabs defaultValue="classes" className="w-full">
          <TabsList className="grid grid-cols-2 max-w-md">
            <TabsTrigger value="classes">Class-Wise Breakdown</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Aggregate Report</TabsTrigger>
          </TabsList>

          {/* TAB 1: CLASS-WISE BREAKDOWN */}
          <TabsContent value="classes">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Grade & Class Attendance Breakdown</CardTitle>
                  <CardDescription>Presence rates for {new Date(selectedDate).toLocaleDateString()}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {classesLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class / Grade</TableHead>
                        <TableHead>Sections</TableHead>
                        <TableHead>Enrolled Students</TableHead>
                        <TableHead>Present</TableHead>
                        <TableHead>Absent</TableHead>
                        <TableHead>Late</TableHead>
                        <TableHead>Attendance Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classBreakdown?.map((c: any) => (
                        <TableRow key={c.classId}>
                          <TableCell className="font-semibold text-foreground">
                            {c.className} ({c.code})
                          </TableCell>
                          <TableCell className="text-xs">{c.sectionsCount} Sections</TableCell>
                          <TableCell className="font-mono text-xs">{c.totalEnrolled}</TableCell>
                          <TableCell className="text-xs font-semibold text-emerald-600">
                            {c.totalPresent}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-rose-600">
                            {c.totalAbsent}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-amber-600">
                            {c.totalLate}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                c.rateValue >= 90
                                  ? 'success'
                                  : c.rateValue >= 75
                                  ? 'warning'
                                  : 'destructive'
                              }
                            >
                              {c.rate}
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

          {/* TAB 2: MONTHLY REPORT */}
          <TabsContent value="monthly">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold">Monthly Student Attendance Records</CardTitle>
                  <CardDescription>Auditable record log with export capabilities</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={String(selectedMonth)}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-36"
                  >
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2026, i, 1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </Select>
                  <Button size="sm" onClick={exportMonthlyCSV} className="shrink-0">
                    <FileSpreadsheet className="mr-1.5 h-4 w-4" />
                    Download CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {monthlyLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Admission No</TableHead>
                        <TableHead>Class & Section</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyData?.slice(0, 50).map((row: any) => (
                        <TableRow key={row.id}>
                          <TableCell className="text-xs font-mono">
                            {new Date(row.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {row.student?.firstName} {row.student?.lastName}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-primary">
                            {row.student?.admissionNumber}
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.section?.class?.name} - {row.section?.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                row.status === 'PRESENT'
                                  ? 'success'
                                  : row.status === 'LATE'
                                  ? 'warning'
                                  : 'destructive'
                              }
                            >
                              {row.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {row.remarks || 'Regular check-in'}
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
