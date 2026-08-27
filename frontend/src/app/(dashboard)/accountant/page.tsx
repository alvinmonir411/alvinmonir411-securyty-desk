'use client';

import React from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RouteGuard } from '@/components/auth/route-guard';
import { CreditCard, Banknote, Receipt, ArrowUpRight, Plus } from 'lucide-react';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';

export default function AccountantDashboardPage() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['accountant-finance-stats'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/finance/stats');
        return res.data.data || res.data;
      } catch {
        return null;
      }
    },
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['accountant-recent-invoices'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/finance/invoices?limit=10');
        return res.data.data?.data || res.data.data || res.data || [];
      } catch {
        return [];
      }
    },
  });

  const invoicesList: any[] = Array.isArray(invoicesData) ? invoicesData : [];

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']}>
      <div className="space-y-8">
        <PageHeader
          heading="Accounting, Invoicing & Payroll Management"
          subheading="Fee collections, offline cash receipts, overdue invoices, and staff payroll runs."
        >
          <div className="flex items-center gap-3">
            <Link href="/admin/finance">
              <Button variant="default" className="shadow-md">
                <Receipt className="mr-2 h-4 w-4" />
                Go to Finance & Cashbook
              </Button>
            </Link>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <StatCard
            title="Monthly Collection"
            value={`৳ ${(statsData?.monthlyCollection || 0).toLocaleString()}`}
            description="Fee collections this month"
            icon={CreditCard}
            iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/50"
          />
          <StatCard
            title="Outstanding Dues"
            value={`৳ ${(statsData?.outstandingFees || 0).toLocaleString()}`}
            description="Receivable student balances"
            icon={Receipt}
            iconColor="text-rose-600 bg-rose-50 dark:bg-rose-950/50"
          />
          <StatCard
            title="Monthly Expenses"
            value={`৳ ${(statsData?.monthlyExpenses || 0).toLocaleString()}`}
            description="Operational expenditures"
            icon={Banknote}
            iconColor="text-purple-600 bg-purple-50 dark:bg-purple-950/50"
          />
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Fee Invoices & Payment Status</CardTitle>
            <CardDescription>Real-time billing transactions and outstanding balances</CardDescription>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : invoicesList.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                No fee invoices generated yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid Amount</TableHead>
                    <TableHead>Date Issued</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoicesList.map((inv: any) => (
                    <TableRow key={inv.id || inv.invoiceNumber}>
                      <TableCell className="font-mono font-medium text-primary">{inv.invoiceNumber}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        {inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : '—'}
                      </TableCell>
                      <TableCell className="font-semibold font-mono">৳ {Number(inv.totalAmount || 0).toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-emerald-600">৳ {Number(inv.paidAmount || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'PARTIAL' ? 'warning' : 'destructive'}>
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
      </div>
    </RouteGuard>
  );
}
