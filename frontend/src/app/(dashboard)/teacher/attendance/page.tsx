'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  CalendarCheck,
  CheckCircle2,
  Users,
  Check,
  X,
  Clock,
  Send,
  Calendar,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

type AttendanceStatusType = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'EXCUSED';

interface StudentRosterItem {
  studentId: string;
  rollNumber: number;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  admissionNumber: string;
  currentStatus: AttendanceStatusType | null;
  remarks: string;
}

export default function TeacherAttendancePage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [studentStates, setStudentStates] = useState<Record<string, { status: AttendanceStatusType; remarks: string }>>({});

  // Fetch sections for teacher
  const { data: sections } = useQuery({
    queryKey: ['sections-for-attendance'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/sections');
      return res.data.data || res.data;
    },
  });

  // Auto-select first section when loaded
  useEffect(() => {
    if (sections?.length > 0 && !selectedSection) {
      setSelectedSection(sections[0].id);
    }
  }, [sections, selectedSection]);

  // Fetch student roster for the chosen section and date
  const { data: roster, isLoading: rosterLoading, refetch } = useQuery<StudentRosterItem[]>({
    queryKey: ['section-roster', selectedSection, selectedDate],
    queryFn: async () => {
      if (!selectedSection) return [];
      const res = await apiClient.get(`/attendance/section/${selectedSection}/roster?date=${selectedDate}`);
      return res.data.data || res.data;
    },
    enabled: !!selectedSection,
  });

  // Populate local attendance states from backend or default to PRESENT
  useEffect(() => {
    if (roster && roster.length > 0) {
      const initial: Record<string, { status: AttendanceStatusType; remarks: string }> = {};
      roster.forEach((st) => {
        initial[st.studentId] = {
          status: st.currentStatus || 'PRESENT',
          remarks: st.remarks || '',
        };
      });
      setStudentStates(initial);
    }
  }, [roster]);

  // Bulk Mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        sectionId: selectedSection,
        date: selectedDate,
        attendances: Object.entries(studentStates).map(([studentId, val]) => ({
          studentId,
          status: val.status,
          remarks: val.remarks || undefined,
        })),
      };
      return apiClient.post('/attendance/mark-bulk', payload);
    },
    onSuccess: (res: any) => {
      const resData = res.data?.data || res.data;
      success(resData?.message || 'Attendance submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['section-roster'] });
      queryClient.invalidateQueries({ queryKey: ['admin-daily-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to submit attendance');
    },
  });

  // Quick Action: Mark All Present
  const handleMarkAllPresent = () => {
    if (!roster) return;
    const updated: Record<string, { status: AttendanceStatusType; remarks: string }> = {};
    roster.forEach((st) => {
      updated[st.studentId] = {
        status: 'PRESENT',
        remarks: '',
      };
    });
    setStudentStates(updated);
    success('Marked all students as PRESENT. You can now tap to adjust absentees.');
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatusType) => {
    setStudentStates((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudentStates((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  // Live Counts
  const totalCount = roster?.length || 0;
  const presentCount = Object.values(studentStates).filter((s) => s.status === 'PRESENT').length;
  const absentCount = Object.values(studentStates).filter((s) => s.status === 'ABSENT').length;
  const lateCount = Object.values(studentStates).filter((s) => s.status === 'LATE').length;
  const leaveCount = Object.values(studentStates).filter((s) => s.status === 'LEAVE').length;
  const excusedCount = Object.values(studentStates).filter((s) => s.status === 'EXCUSED').length;

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <div className="space-y-6">
        <PageHeader
          heading="Daily Classroom Attendance"
          subheading="Fast 1-tap mobile attendance sheet with automated parent absence alerts."
        />

        {/* Top Control Toolbar */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Select Class & Section
                </label>
                <Select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  {sections?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.class?.name} — {s.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Attendance Date
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleMarkAllPresent}
                  variant="outline"
                  className="w-full border-emerald-600/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold"
                >
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Mark All Present
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Counters Banner */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 text-center text-xs">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">PRESENT</span>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{presentCount}</p>
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">ABSENT</span>
            <p className="text-xl font-bold text-rose-700 dark:text-rose-300">{absentCount}</p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">LATE</span>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{lateCount}</p>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">LEAVE</span>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{leaveCount}</p>
          </div>
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-3 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">EXCUSED</span>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{excusedCount}</p>
          </div>
        </div>

        {/* Student Attendance List */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Student Attendance Sheet</CardTitle>
              <CardDescription>
                Tap on any status button to change status. Absence triggers parent SMS automatically.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending || totalCount === 0}
              className="shadow-md"
            >
              <Send className="mr-1.5 h-4 w-4" />
              {submitMutation.isPending ? 'Submitting...' : 'Submit Attendance'}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {rosterLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : !roster || roster.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
                <h4 className="text-sm font-semibold text-foreground">No students enrolled in this section</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Please select another section or enroll learners via the Admin portal.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {roster.map((st) => {
                  const state = studentStates[st.studentId] || { status: 'PRESENT', remarks: '' };

                  return (
                    <div
                      key={st.studentId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors"
                    >
                      {/* Student Info */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-mono text-sm font-bold text-primary">
                          #{st.rollNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground text-sm">
                              {st.firstName} {st.lastName}
                            </h4>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              ({st.admissionNumber})
                            </span>
                          </div>
                          <input
                            type="text"
                            placeholder="Add remark / note (optional)..."
                            value={state.remarks}
                            onChange={(e) => handleRemarksChange(st.studentId, e.target.value)}
                            className="text-xs text-muted-foreground bg-transparent border-none p-0 focus:outline-none focus:text-foreground placeholder:text-muted-foreground/60 w-64"
                          />
                        </div>
                      </div>

                      {/* 1-Tap Quick Status Buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, 'PRESENT')}
                          className={`h-9 px-3 rounded-lg text-xs font-bold transition-all ${
                            state.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-sm scale-105'
                              : 'bg-muted text-muted-foreground hover:bg-emerald-500/20 hover:text-emerald-700'
                          }`}
                        >
                          Present
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, 'ABSENT')}
                          className={`h-9 px-3 rounded-lg text-xs font-bold transition-all ${
                            state.status === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-sm scale-105'
                              : 'bg-muted text-muted-foreground hover:bg-rose-500/20 hover:text-rose-700'
                          }`}
                        >
                          Absent
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, 'LATE')}
                          className={`h-9 px-3 rounded-lg text-xs font-bold transition-all ${
                            state.status === 'LATE'
                              ? 'bg-amber-600 text-white shadow-sm scale-105'
                              : 'bg-muted text-muted-foreground hover:bg-amber-500/20 hover:text-amber-700'
                          }`}
                        >
                          Late
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, 'LEAVE')}
                          className={`h-9 px-2.5 rounded-lg text-xs font-bold transition-all ${
                            state.status === 'LEAVE'
                              ? 'bg-blue-600 text-white shadow-sm scale-105'
                              : 'bg-muted text-muted-foreground hover:bg-blue-500/20 hover:text-blue-700'
                          }`}
                        >
                          Leave
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, 'EXCUSED')}
                          className={`h-9 px-2.5 rounded-lg text-xs font-bold transition-all ${
                            state.status === 'EXCUSED'
                              ? 'bg-purple-600 text-white shadow-sm scale-105'
                              : 'bg-muted text-muted-foreground hover:bg-purple-500/20 hover:text-purple-700'
                          }`}
                        >
                          Excused
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Floating Submit Bar for mobile speed */}
        {roster && roster.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-card p-4 shadow-lg">
            <div className="text-xs">
              <span className="font-semibold text-foreground">
                {presentCount + lateCount} / {totalCount} Students Present
              </span>
              <p className="text-muted-foreground text-[11px]">
                {absentCount} absent students will receive an automated absence notification.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="shadow-md"
            >
              <Send className="mr-2 h-4 w-4" />
              {submitMutation.isPending ? 'Recording...' : 'Submit Attendance Sheet'}
            </Button>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
