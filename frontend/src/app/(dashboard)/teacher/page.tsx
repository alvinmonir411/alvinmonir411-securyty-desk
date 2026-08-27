'use client';

import React from 'react';
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
  CalendarCheck,
  BookOpen,
  Award,
  Users,
  Clock,
  ArrowRight,
  Bell,
  Sparkles,
  DollarSign,
  FileText,
} from 'lucide-react';

export default function TeacherPortalPage() {
  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['teacher-schedule'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/teachers/my-schedule');
        return res.data.data || res.data || [];
      } catch {
        return [];
      }
    },
  });

  const { data: notices, isLoading: noticesLoading } = useQuery({
    queryKey: ['teacher-notices'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/cms/notices?target=TEACHERS');
        return res.data.data || res.data || [];
      } catch {
        return [];
      }
    },
  });

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <div className="space-y-8">
        <PageHeader
          heading="Faculty Workspace & Classroom Hub"
          subheading="Manage student attendance, timetable routines, grading evaluations, and leaves."
        >
          <Link href="/teacher/attendance">
            <Button variant="default" className="shadow-md">
              <CalendarCheck className="mr-2 h-4 w-4" />
              Mark Daily Attendance
            </Button>
          </Link>
        </PageHeader>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Teaching Sessions"
            value={schedule ? `${schedule.length} Classes` : '0 Classes'}
            description="Daily scheduled periods"
            icon={BookOpen}
            iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50"
          />
          <StatCard
            title="Attendance Sheet"
            value="Active"
            description="Daily roll recording"
            icon={CalendarCheck}
            iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50"
          />
          <StatCard
            title="Assigned Routine"
            value={schedule ? `${schedule.length} Periods` : '0 Periods'}
            description="Weekly timetable slots"
            icon={Users}
            iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/50"
          />
          <StatCard
            title="Faculty Circulars"
            value={notices ? `${notices.length} Notices` : '0 Notices'}
            description="Official announcements"
            icon={Clock}
            iconColor="text-teal-600 bg-teal-50 dark:bg-teal-950/50"
          />
        </div>

        {/* Action Shortcuts */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link href="/teacher/attendance">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Take Attendance</h4>
                  <p className="text-[11px] text-muted-foreground">1-Tap Fast Sheet</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/teacher/leaves">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Leave Requests</h4>
                  <p className="text-[11px] text-muted-foreground">Apply & Track</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/teacher/marks">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Exam Marks</h4>
                  <p className="text-[11px] text-muted-foreground">Grade Evaluation</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/teacher/salary">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Salary & Payslips</h4>
                  <p className="text-[11px] text-muted-foreground">Monthly Ledger</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Timetable Schedule & Notice Board */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Today's Teaching Schedule</CardTitle>
                <CardDescription>Timetable sessions and classroom locations</CardDescription>
              </div>
              <Badge variant="outline">Live Routine</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {scheduleLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (!schedule || schedule.length === 0) ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No teaching periods scheduled for today.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time Slot</TableHead>
                      <TableHead>Class & Section</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.map((slot: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-semibold text-foreground">
                          {slot.startTime} - {slot.endTime}
                        </TableCell>
                        <TableCell>
                          {slot.section?.class?.name || 'Class'} - {slot.section?.name || 'Section'}
                        </TableCell>
                        <TableCell className="font-medium text-primary">{slot.subject?.name}</TableCell>
                        <TableCell className="font-mono text-xs">{slot.roomNumber || '—'}</TableCell>
                        <TableCell className="text-right">
                          <Link href="/teacher/attendance">
                            <Button size="sm" variant="outline" className="h-8">
                              Mark Attendance
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Notice Board */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span>Faculty Notices</span>
              </CardTitle>
              <CardDescription>Official circulars from school administration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {noticesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (!notices || notices.length === 0) ? (
                <p className="text-xs text-muted-foreground italic text-center py-6">No faculty notices published.</p>
              ) : (
                notices.map((n: any, i: number) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-1">
                    <h4 className="text-xs font-semibold text-foreground">{n.title}</h4>
                    <p className="text-[11px] text-muted-foreground">{n.content}</p>
                    <span className="text-[10px] text-primary block pt-1 font-mono">
                      {new Date(n.publishedAt || n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RouteGuard>
  );
}
