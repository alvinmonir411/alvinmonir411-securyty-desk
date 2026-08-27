'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RouteGuard } from '@/components/auth/route-guard';
import { DollarSign, Banknote, Download, Printer, Receipt, CheckCircle2 } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherSalaryPage() {
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  const { data: payRuns, isLoading } = useQuery({
    queryKey: ['teacher-my-payslips'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/payroll/pay-runs');
        return res.data.data || res.data || [];
      } catch {
        return [];
      }
    },
  });

  const payRunsList: any[] = Array.isArray(payRuns) ? payRuns : [];
  const allItems = payRunsList.flatMap((pr: any) =>
    (pr.items || []).map((item: any) => ({
      ...item,
      payRun: pr,
      number: item.payslipNumber || `PAY-${pr.year}-${String(pr.month).padStart(2, '0')}`,
      month: `${new Date(pr.year, pr.month - 1).toLocaleString('default', { month: 'long' })} ${pr.year}`,
      base: `৳ ${Number(item.baseSalary || 0).toLocaleString()}`,
      allowance: `৳ ${Number(item.allowances || 0).toLocaleString()}`,
      deduction: `৳ ${Number(item.deductions || 0).toLocaleString()}`,
      net: `৳ ${Number(item.netSalary || 0).toLocaleString()}`,
      status: pr.status,
      date: item.disbursedAt ? new Date(item.disbursedAt).toLocaleDateString() : 'Pending',
    }))
  );

  const totalDisbursed = allItems
    .filter((i) => i.status === 'DISBURSED')
    .reduce((sum, i) => sum + (Number(i.netSalary) || 0), 0);

  const latestItem = allItems[0];

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <div className="space-y-6">
        <PageHeader
          heading="Faculty Compensation & Payslips"
          subheading="Monthly compensation breakdown, tax withholdings, and printable payslip records."
        />

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Base Monthly Salary"
            value={latestItem ? latestItem.base : '৳ 0.00'}
            description="Active Pay Grade"
            icon={DollarSign}
            iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/50"
          />
          <StatCard
            title="Latest Allowances"
            value={latestItem ? latestItem.allowance : '৳ 0.00'}
            description="Medical + Housing allowance"
            icon={Banknote}
            iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50"
          />
          <StatCard
            title="Total Disbursed (YTD)"
            value={`৳ ${totalDisbursed.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            description="Bank Direct Deposit"
            icon={Receipt}
            iconColor="text-purple-600 bg-purple-50 dark:bg-purple-950/50"
          />
        </div>

        {/* Payslips Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Payroll & Payslip History</CardTitle>
            <CardDescription>Verified institutional salary disbursement slips</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : allItems.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                No payroll runs or payslip records found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payslip #</TableHead>
                    <TableHead>Pay Period</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Allowances</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Pay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allItems.map((p) => (
                    <TableRow key={p.number}>
                      <TableCell className="font-mono text-xs font-semibold text-primary">{p.number}</TableCell>
                      <TableCell className="font-semibold text-foreground">{p.month}</TableCell>
                      <TableCell>{p.base}</TableCell>
                      <TableCell className="text-xs text-emerald-600">{p.allowance}</TableCell>
                      <TableCell className="text-xs text-rose-600">-{p.deduction}</TableCell>
                      <TableCell className="font-mono font-bold text-foreground">{p.net}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'DISBURSED' ? 'success' : 'outline'}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPayslip(p)}
                        >
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          View Payslip
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payslip Modal */}
        <Dialog open={!!selectedPayslip} onOpenChange={() => setSelectedPayslip(null)}>
          <DialogContent onClose={() => setSelectedPayslip(null)} className="max-w-xl">
            <DialogHeader>
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <DialogTitle>Official Salary Payslip</DialogTitle>
                  <DialogDescription className="font-mono text-xs">
                    {selectedPayslip?.number} • {selectedPayslip?.month}
                  </DialogDescription>
                </div>
                <Badge variant="success">DISBURSED</Badge>
              </div>
            </DialogHeader>

            <div className="space-y-4 text-xs py-2">
              <div className="grid grid-cols-2 gap-2 border-b pb-3 text-muted-foreground">
                <div>
                  <span>Institution:</span>
                  <p className="font-semibold text-foreground">Noble Residential High School</p>
                </div>
                <div>
                  <span>Disbursement Date:</span>
                  <p className="font-semibold text-foreground">{selectedPayslip?.date}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px]">Earnings</h4>
                <div className="flex justify-between border-b border-border/50 pb-1">
                  <span>Basic Academic Salary</span>
                  <span className="font-mono font-medium text-foreground">{selectedPayslip?.base}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-1">
                  <span>Medical & Housing Allowance</span>
                  <span className="font-mono font-medium text-emerald-600">{selectedPayslip?.allowance}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px]">Deductions</h4>
                <div className="flex justify-between border-b border-border/50 pb-1">
                  <span>Tax Withholding & PF</span>
                  <span className="font-mono font-medium text-rose-600">-{selectedPayslip?.deduction}</span>
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex justify-between items-center text-sm">
                <span className="font-bold text-foreground">Net Disbursed Compensation</span>
                <span className="font-mono font-bold text-primary text-base">{selectedPayslip?.net}</span>
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
