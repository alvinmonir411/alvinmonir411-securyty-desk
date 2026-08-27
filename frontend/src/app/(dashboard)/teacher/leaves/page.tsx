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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';

const applyLeaveSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(5, 'Please provide a clear reason for your leave request'),
});

type ApplyLeaveValues = z.infer<typeof applyLeaveSchema>;

export default function TeacherLeavesPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const { data: leaves, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-leaves'],
    queryFn: async () => {
      const res = await apiClient.get('/attendance/leave/my-leaves');
      return res.data.data || res.data;
    },
  });

  const form = useForm<ApplyLeaveValues>({
    resolver: zodResolver(applyLeaveSchema),
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: '',
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (values: ApplyLeaveValues) => {
      return apiClient.post('/attendance/leave/apply', values);
    },
    onSuccess: () => {
      success('Leave application submitted for administrative review!');
      setIsOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['my-leaves'] });
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to submit leave application');
    },
  });

  const pendingCount = (leaves || []).filter((l: any) => l.status === 'PENDING').length;
  const approvedCount = (leaves || []).filter((l: any) => l.status === 'APPROVED').length;

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <div className="space-y-6">
        <PageHeader
          heading="Faculty Leave Applications & History"
          subheading="Submit leave requests, track approval status, and view remaining annual allowances."
        >
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Apply for Leave
          </Button>
        </PageHeader>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Annual Leave Balance"
            value="14 Days"
            description="Remaining for session 2026"
            icon={Calendar}
            iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/50"
          />
          <StatCard
            title="Pending Requests"
            value={pendingCount.toString()}
            description="Awaiting administration approval"
            icon={Clock}
            iconColor="text-amber-600 bg-amber-50 dark:bg-amber-950/50"
          />
          <StatCard
            title="Approved Leaves"
            value={approvedCount.toString()}
            description="Sanctioned leaves this term"
            icon={CheckCircle2}
            iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50"
          />
        </div>

        {/* Requests Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">My Leave Applications</CardTitle>
            <CardDescription>Chronological log of submitted leave applications</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="p-8 text-center">
                <p className="text-sm font-medium text-destructive mb-3">Failed to load leave history.</p>
                <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
              </div>
            ) : !leaves || leaves.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
                <h4 className="text-sm font-semibold text-foreground">No leave applications found</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  You haven't submitted any leave applications yet.
                </p>
                <Button size="sm" onClick={() => setIsOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Apply for Leave
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium text-foreground">
                        {new Date(l.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {new Date(l.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs max-w-xs">{l.reason}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(l.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            l.status === 'APPROVED'
                              ? 'success'
                              : l.status === 'PENDING'
                              ? 'warning'
                              : 'destructive'
                          }
                        >
                          {l.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modal: Apply for Leave */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent onClose={() => setIsOpen(false)}>
            <DialogHeader>
              <DialogTitle>Submit Leave Application</DialogTitle>
              <DialogDescription>
                Provide leave dates and reason for the Principal / HR administration.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit((v) => applyMutation.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="leaveStart">Start Date</Label>
                  <Input id="leaveStart" type="date" {...form.register('startDate')} />
                  {form.formState.errors.startDate && (
                    <p className="text-[11px] text-destructive">{form.formState.errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="leaveEnd">End Date</Label>
                  <Input id="leaveEnd" type="date" {...form.register('endDate')} />
                  {form.formState.errors.endDate && (
                    <p className="text-[11px] text-destructive">{form.formState.errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="leaveReason">Reason for Absence</Label>
                <textarea
                  id="leaveReason"
                  rows={3}
                  placeholder="State the purpose of your leave (e.g. medical illness, personal emergency)..."
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  {...form.register('reason')}
                />
                {form.formState.errors.reason && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.reason.message}</p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={applyMutation.isPending}>
                  {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  );
}
