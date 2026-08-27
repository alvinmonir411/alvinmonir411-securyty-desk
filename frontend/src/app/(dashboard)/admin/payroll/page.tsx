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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  Banknote,
  DollarSign,
  Users,
  CheckCircle2,
  Plus,
  Printer,
  Sparkles,
  Download,
  Receipt,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';

const generatePayRunSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().default(2026),
});

type GeneratePayRunValues = z.infer<typeof generatePayRunSchema>;

export default function AdminPayrollPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedPayRun, setSelectedPayRun] = useState<any>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  // Queries
  const { data: payRuns, isLoading: runsLoading } = useQuery({
    queryKey: ['admin-payroll-runs'],
    queryFn: async () => {
      const res = await apiClient.get('/payroll/pay-runs');
      return res.data.data || res.data;
    },
  });

  const generateForm = useForm<GeneratePayRunValues>({
    resolver: zodResolver(generatePayRunSchema),
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
  });

  // Mutations
  const generateMutation = useMutation({
    mutationFn: (values: GeneratePayRunValues) => apiClient.post('/payroll/pay-runs/generate', values),
    onSuccess: () => {
      success('Monthly faculty pay-run generated in DRAFT mode!');
      setIsGenerateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-payroll-runs'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to generate payroll'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/payroll/pay-runs/${id}/status`, { status }),
    onSuccess: (res: any, variables) => {
      success(`Payroll run transitioned to ${variables.status}!`);
      queryClient.invalidateQueries({ queryKey: ['admin-payroll-runs'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to update payroll status'),
  });

  const totalPayroll = (payRuns || []).reduce((acc: number, p: any) => acc + p.totalAmount, 0);

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']}>
      <div className="space-y-6">
        <PageHeader
          heading="Staff Payroll & Compensation Engine"
          subheading="Salary structure computation (Gross - Deductions = Net), multi-stage approval workflow, and payslip disbursement."
        >
          <Button onClick={() => setIsGenerateOpen(true)} className="shadow-md">
            <Sparkles className="mr-1.5 h-4 w-4" />
            Generate Monthly PayRun
          </Button>
        </PageHeader>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Monthly Payroll"
            value={`৳ ${totalPayroll.toLocaleString()}`}
            description="Active payroll commitments"
            icon={Banknote}
            iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50"
          />
          <StatCard
            title="Active Pay Cycles"
            value={payRuns?.length?.toString() || '0'}
            description="Historical & active runs"
            icon={DollarSign}
            iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50"
          />
          <StatCard
            title="Payroll Workflow"
            value="DRAFT → DISBURSED"
            description="Multi-tier authorization"
            icon={CheckCircle2}
            iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/50"
          />
          <StatCard
            title="Banking Ledger Posting"
            value="Automated"
            description="Auto-posts upon disbursement"
            icon={Receipt}
            iconColor="text-purple-600 bg-purple-50 dark:bg-purple-950/50"
          />
        </div>

        {/* PayRuns List */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Institutional Payroll Runs</CardTitle>
            <CardDescription>Workflow: Draft → Review → Approved → Disbursed</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {runsLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !payRuns || payRuns.length === 0 ? (
              <div className="p-12 text-center">
                <Banknote className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
                <h4 className="text-sm font-semibold text-foreground">No payroll runs generated</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Click below to generate payroll for the current period.
                </p>
                <Button size="sm" onClick={() => setIsGenerateOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Generate PayRun
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {payRuns.map((pr: any) => (
                  <div
                    key={pr.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-foreground text-base">
                          {new Date(pr.year, pr.month - 1, 1).toLocaleString('default', { month: 'long' })} {pr.year} PayRun
                        </h4>
                        <Badge
                          variant={
                            pr.status === 'DISBURSED'
                              ? 'success'
                              : pr.status === 'APPROVED'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {pr.status}
                        </Badge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Total Amount: <strong className="text-foreground font-mono">${pr.totalAmount?.toFixed(2)}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Faculty Items: <strong className="text-foreground">{pr.items?.length || 0} Employees</strong>
                        </span>
                      </div>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPayRun(pr)}
                      >
                        <Users className="mr-1.5 h-3.5 w-3.5" />
                        View Employee Breakdown
                      </Button>

                      {pr.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-500/30 text-amber-600 hover:bg-amber-50"
                          onClick={() => updateStatusMutation.mutate({ id: pr.id, status: 'APPROVED' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Approve PayRun
                        </Button>
                      )}

                      {pr.status === 'APPROVED' && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => updateStatusMutation.mutate({ id: pr.id, status: 'DISBURSED' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          <DollarSign className="mr-1.5 h-3.5 w-3.5" />
                          Disburse & Post to Banking
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal 1: Generate PayRun */}
        <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
          <DialogContent onClose={() => setIsGenerateOpen(false)}>
            <DialogHeader>
              <DialogTitle>Generate Monthly Faculty PayRun</DialogTitle>
              <DialogDescription>
                Calculates Basic + Allowances - Deductions for all active staff.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={generateForm.handleSubmit((v) => generateMutation.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="payM">Billing Month (1-12)</Label>
                  <Input id="payM" type="number" {...generateForm.register('month')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="payY">Billing Year</Label>
                  <Input id="payY" type="number" {...generateForm.register('year')} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsGenerateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={generateMutation.isPending}>
                  {generateMutation.isPending ? 'Calculating...' : 'Generate PayRun'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal 2: Employee Payroll Breakdown */}
        <Dialog open={!!selectedPayRun} onOpenChange={() => setSelectedPayRun(null)}>
          <DialogContent onClose={() => setSelectedPayRun(null)} className="max-w-4xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>
                    {new Date(selectedPayRun?.year, (selectedPayRun?.month || 1) - 1, 1).toLocaleString('default', { month: 'long' })} {selectedPayRun?.year} — Employee Compensation Breakdown
                  </DialogTitle>
                  <DialogDescription>Gross Salary - Deductions = Net Compensation</DialogDescription>
                </div>
                <Badge variant={selectedPayRun?.status === 'DISBURSED' ? 'success' : 'default'}>
                  {selectedPayRun?.status}
                </Badge>
              </div>
            </DialogHeader>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Allowances</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPayRun?.items?.map((it: any) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-semibold text-foreground">
                        {it.teacher?.firstName} {it.teacher?.lastName}
                      </TableCell>
                      <TableCell className="text-xs">{it.teacher?.designation || 'Lecturer'}</TableCell>
                      <TableCell className="font-mono">${it.baseSalary?.toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-emerald-600">+${it.totalAllowance?.toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-rose-600">-${it.totalDeduction?.toFixed(2)}</TableCell>
                      <TableCell className="font-mono font-bold text-foreground">${it.netSalary?.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => setSelectedPayslip({ item: it, run: selectedPayRun })}
                        >
                          <Printer className="mr-1 h-3.5 w-3.5" /> Payslip
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPayRun(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal 3: Printable Payslip Modal */}
        <Dialog open={!!selectedPayslip} onOpenChange={() => setSelectedPayslip(null)}>
          <DialogContent onClose={() => setSelectedPayslip(null)} className="max-w-md">
            <div className="space-y-4 p-4">
              <div className="text-center border-b pb-3 space-y-1">
                <h3 className="text-base font-bold text-foreground uppercase tracking-wider">Noble Residential High School</h3>
                <p className="text-[11px] text-muted-foreground">Official Staff Salary Payslip</p>
                <p className="text-xs font-semibold text-primary font-mono">
                  {selectedPayslip?.item?.payslip?.payslipNumber || 'PAY-2026-SLIP'}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 border-b pb-2">
                  <div>
                    <span className="text-muted-foreground">Employee:</span>
                    <p className="font-semibold text-foreground">
                      {selectedPayslip?.item?.teacher?.firstName} {selectedPayslip?.item?.teacher?.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pay Period:</span>
                    <p className="font-semibold text-foreground">
                      {new Date(selectedPayslip?.run?.year, (selectedPayslip?.run?.month || 1) - 1, 1).toLocaleString('default', { month: 'long' })} {selectedPayslip?.run?.year}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between border-b pb-1">
                    <span>Base Academic Salary</span>
                    <span className="font-mono font-medium">${selectedPayslip?.item?.baseSalary?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>Total Allowances</span>
                    <span className="font-mono font-medium text-emerald-600">+${selectedPayslip?.item?.totalAllowance?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>Total Deductions & Tax</span>
                    <span className="font-mono font-medium text-rose-600">-${selectedPayslip?.item?.totalDeduction?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex justify-between items-center text-sm font-bold mt-2">
                  <span>Net Disbursed Pay:</span>
                  <span className="font-mono text-primary">${selectedPayslip?.item?.netSalary?.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 text-center text-xs text-muted-foreground">
                <div className="border-t border-muted-foreground/40 w-32 mx-auto mb-1" />
                <span>Authorized Bursar / HR Officer</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-1.5 h-4 w-4" /> Print PDF
              </Button>
              <Button onClick={() => setSelectedPayslip(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  );
}
