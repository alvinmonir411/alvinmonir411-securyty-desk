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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  DollarSign,
  CreditCard,
  Receipt,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Sparkles,
  Printer,
  FileSpreadsheet,
  Wallet,
  Building2,
  TrendingUp,
  Banknote,
  CheckCircle2,
} from 'lucide-react';

const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['CASH', 'BKASH', 'NAGAD', 'CARD', 'BANK_TRANSFER']),
  remarks: z.string().optional(),
});

const generateInvoicesSchema = z.object({
  classId: z.string().min(1, 'Select a class'),
  academicYearId: z.string().optional(),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().default(2026),
  dueDate: z.string().min(1, 'Due date is required'),
  title: z.string().min(3, 'Invoice title is required'),
});

const createExpenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  title: z.string().min(3, 'Expense title is required'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  vendorName: z.string().optional(),
  expenseDate: z.string().min(1, 'Date is required'),
});

type RecordPaymentValues = z.infer<typeof recordPaymentSchema>;
type GenerateInvoicesValues = z.infer<typeof generateInvoicesSchema>;
type CreateExpenseValues = z.infer<typeof createExpenseSchema>;

export default function AdminFinanceERPPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['finance-dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/finance/dashboard-stats');
      return res.data.data || res.data;
    },
  });

  const { data: invoicesData, isLoading: invLoading } = useQuery({
    queryKey: ['finance-invoices'],
    queryFn: async () => {
      const res = await apiClient.get('/finance/invoices?limit=50');
      return res.data.data || res.data;
    },
  });

  const { data: feeStructures } = useQuery({
    queryKey: ['finance-fee-structures'],
    queryFn: async () => {
      const res = await apiClient.get('/finance/fee-structures');
      return res.data.data || res.data;
    },
  });

  const { data: cashbook } = useQuery({
    queryKey: ['finance-cashbook'],
    queryFn: async () => {
      const res = await apiClient.get('/finance/cashbook');
      return res.data.data || res.data;
    },
  });

  const { data: bankTransactions } = useQuery({
    queryKey: ['finance-bank-txns'],
    queryFn: async () => {
      const res = await apiClient.get('/finance/bank-transactions');
      return res.data.data || res.data;
    },
  });

  const { data: expensesData } = useQuery({
    queryKey: ['finance-expenses'],
    queryFn: async () => {
      const res = await apiClient.get('/finance/expenses');
      return res.data.data || res.data;
    },
  });

  const { data: classes } = useQuery({
    queryKey: ['classes-for-invoices'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/classes');
      return res.data.data || res.data;
    },
  });

  const { data: years } = useQuery({
    queryKey: ['years-for-invoices'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/years');
      return res.data.data || res.data;
    },
  });

  // Forms
  const paymentForm = useForm<RecordPaymentValues>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      invoiceId: '',
      amount: 0,
      paymentMethod: 'CASH',
      remarks: '',
    },
  });

  const generateForm = useForm<GenerateInvoicesValues>({
    resolver: zodResolver(generateInvoicesSchema),
    defaultValues: {
      classId: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      title: `Tuition Fee — ${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
    },
  });

  const expenseForm = useForm<CreateExpenseValues>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      category: 'Utilities',
      title: '',
      amount: 0,
      vendorName: '',
      expenseDate: new Date().toISOString().split('T')[0],
    },
  });

  // Mutations
  const recordPaymentMutation = useMutation({
    mutationFn: (values: RecordPaymentValues) => apiClient.post('/finance/payments/record', values),
    onSuccess: (res: any) => {
      const data = res.data?.data || res.data;
      success('Payment recorded and digital receipt issued!');
      setSelectedInvoice(null);
      setSelectedReceipt(data.receipt);
      queryClient.invalidateQueries({ queryKey: ['finance-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['finance-cashbook'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Payment recording failed'),
  });

  const generateInvoicesMutation = useMutation({
    mutationFn: async (values: GenerateInvoicesValues) => {
      const yearId = values.academicYearId || years?.[0]?.id || 'ay-default';
      return apiClient.post('/finance/invoices/generate-monthly', { ...values, academicYearId: yearId });
    },
    onSuccess: (res: any) => {
      const msg = res.data?.data?.message || res.data?.message || 'Monthly invoices generated!';
      success(msg);
      setIsGenerateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['finance-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard-stats'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Invoice generation failed'),
  });

  const createExpenseMutation = useMutation({
    mutationFn: (values: CreateExpenseValues) => apiClient.post('/finance/expenses', values),
    onSuccess: () => {
      success('Expense recorded and posted to cashbook!');
      setIsExpenseOpen(false);
      expenseForm.reset();
      queryClient.invalidateQueries({ queryKey: ['finance-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['finance-cashbook'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to post expense'),
  });

  const handleOpenPayment = (inv: any) => {
    setSelectedInvoice(inv);
    const remaining = inv.totalAmount - (inv.paidAmount || 0);
    paymentForm.setValue('invoiceId', inv.id);
    paymentForm.setValue('amount', remaining);
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']}>
      <div className="space-y-6">
        <PageHeader
          heading="Institutional Finance & Accounting ERP"
          subheading="Student tuition billing, multi-gateway fee collections, digital receipts, cashbook ledger, and treasury accounting."
        >
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsExpenseOpen(true)} variant="outline">
              <Plus className="mr-1.5 h-4 w-4" />
              Record Expense
            </Button>
            <Button onClick={() => setIsGenerateOpen(true)} className="shadow-md">
              <Sparkles className="mr-1.5 h-4 w-4" />
              Generate Monthly Invoices
            </Button>
          </div>
        </PageHeader>

        {/* 8 Metric Telemetry Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            <StatCard
              title="Today's Collection"
              value={`৳ ${(stats?.todayCollection || 0).toLocaleString()}`}
              description="Campus counter & online"
              icon={DollarSign}
              iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50"
            />
            <StatCard
              title="Monthly Collection"
              value={`৳ ${(stats?.monthlyCollection || 0).toLocaleString()}`}
              description="Current month total"
              icon={TrendingUp}
              iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50"
            />
            <StatCard
              title="Outstanding Fees"
              value={`৳ ${(stats?.outstandingFees || 0).toLocaleString()}`}
              description="Receivable dues"
              icon={Receipt}
              iconColor="text-rose-600 bg-rose-50 dark:bg-rose-950/50"
            />
            <StatCard
              title="Today's Expenses"
              value={`৳ ${(stats?.todayExpenses || 0).toLocaleString()}`}
              description="Daily petty cash & bills"
              icon={ArrowUpRight}
              iconColor="text-amber-600 bg-amber-50 dark:bg-amber-950/50"
            />
            <StatCard
              title="Monthly Expenses"
              value={`৳ ${(stats?.monthlyExpenses || 0).toLocaleString()}`}
              description="Operational expenditures"
              icon={Banknote}
              iconColor="text-amber-600 bg-amber-50 dark:bg-amber-950/50"
            />
            <StatCard
              title="Cash in Hand"
              value={`৳ ${(stats?.cashBalance || 0).toLocaleString()}`}
              description="Campus physical cash"
              icon={Wallet}
              iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/50"
            />
            <StatCard
              title="Bank Operating"
              value={`৳ ${(stats?.bankBalance || 0).toLocaleString()}`}
              description="Treasury accounts"
              icon={Building2}
              iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50"
            />
            <StatCard
              title="Net Operating Balance"
              value={`৳ ${(stats?.netBalance || 0).toLocaleString()}`}
              description="Consolidated capital"
              icon={CheckCircle2}
              iconColor="text-teal-600 bg-teal-50 dark:bg-teal-950/50"
            />
          </div>
        )}

        <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="grid grid-cols-4 max-w-2xl">
            <TabsTrigger value="invoices">Student Invoices</TabsTrigger>
            <TabsTrigger value="structures">Fee Structures</TabsTrigger>
            <TabsTrigger value="cashbook">Cashbook & Banking</TabsTrigger>
            <TabsTrigger value="expenses">Expense Ledger</TabsTrigger>
          </TabsList>

          {/* TAB 1: INVOICES & PAYMENTS */}
          <TabsContent value="invoices">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Student Fee Invoices & Payment Ledger</CardTitle>
                  <CardDescription>Auditable student billing with 1-click counter collections</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {invLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Paid Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoicesData?.data?.map((inv: any) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-xs font-semibold text-primary">
                            {inv.invoiceNumber}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {inv.student?.firstName} {inv.student?.lastName}
                          </TableCell>
                          <TableCell className="text-xs">
                            {inv.student?.enrollments?.[0]?.section?.class?.name || 'Class'}
                          </TableCell>
                          <TableCell className="text-xs">{inv.title}</TableCell>
                          <TableCell className="font-mono font-semibold">${inv.totalAmount.toFixed(2)}</TableCell>
                          <TableCell className="font-mono text-emerald-600">${(inv.paidAmount || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(inv.dueDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                inv.status === 'PAID'
                                  ? 'success'
                                  : inv.status === 'PARTIAL'
                                  ? 'warning'
                                  : 'destructive'
                              }
                            >
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {inv.status !== 'PAID' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-emerald-600/30 text-emerald-600 hover:bg-emerald-50"
                                onClick={() => handleOpenPayment(inv)}
                              >
                                <DollarSign className="mr-1 h-3.5 w-3.5" /> Collect Fee
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8"
                                onClick={() => setSelectedReceipt({ receiptNumber: `RCP-${inv.invoiceNumber.substring(4)}`, amount: inv.totalAmount, invoice: inv })}
                              >
                                <Receipt className="mr-1 h-3.5 w-3.5" /> Receipt
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: FEE STRUCTURES */}
          <TabsContent value="structures">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Institutional Fee Structures</CardTitle>
                <CardDescription>Standardized class fee schedules (Tuition, Admission, Exam, Development)</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class / Grade</TableHead>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Billing Frequency</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeStructures?.map((fs: any) => (
                      <TableRow key={fs.id}>
                        <TableCell className="font-semibold text-foreground">{fs.class?.name}</TableCell>
                        <TableCell>{fs.feeType?.name}</TableCell>
                        <TableCell className="text-xs font-mono">{fs.frequency}</TableCell>
                        <TableCell className="font-mono font-bold text-foreground">${fs.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: CASHBOOK & BANKING */}
          <TabsContent value="cashbook">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Cashbook */}
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-emerald-600" />
                      <span>Cash In Hand Ledger</span>
                    </CardTitle>
                    <CardDescription>Running campus counter cash</CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-sm">
                    ৳ {(cashbook?.runningBalance || 0).toLocaleString()}
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cashbook?.transactions?.slice(0, 10).map((tx: any) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-xs font-mono">
                            {new Date(tx.transactionDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={tx.transactionType === 'CASH_IN' ? 'success' : 'destructive'}>
                              {tx.transactionType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs max-w-xs">{tx.description}</TableCell>
                          <TableCell className={`text-right font-mono font-semibold ${tx.transactionType === 'CASH_IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.transactionType === 'CASH_IN' ? '+' : '-'}৳ {tx.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Bank Ledger */}
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-indigo-600" />
                      <span>Bank Operating Accounts</span>
                    </CardTitle>
                    <CardDescription>Prime Commercial & Gateway Accounts</CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-sm">
                    ৳ {(bankTransactions?.runningBalance || 0).toLocaleString()}
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Bank / Channel</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bankTransactions?.transactions?.slice(0, 10).map((tx: any) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-xs font-mono">
                            {new Date(tx.transactionDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs font-semibold">{tx.bankName}</TableCell>
                          <TableCell>
                            <Badge variant={tx.transactionType === 'DEPOSIT' ? 'success' : 'destructive'}>
                              {tx.transactionType}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-mono font-semibold ${tx.transactionType === 'DEPOSIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.transactionType === 'DEPOSIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 4: EXPENSES */}
          <TabsContent value="expenses">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Institutional Expenditure Ledger</CardTitle>
                  <CardDescription>Categorized operational overhead, utilities, maintenance, and supplies</CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsExpenseOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Record Expense
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Vendor / Payee</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expensesData?.data?.map((exp: any) => (
                      <TableRow key={exp.id}>
                        <TableCell className="text-xs font-mono">
                          {new Date(exp.expenseDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{exp.category}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">{exp.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{exp.vendorName || '—'}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-rose-600">
                          ${exp.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal 1: Record Payment */}
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent onClose={() => setSelectedInvoice(null)}>
            <DialogHeader>
              <DialogTitle>Record Student Fee Payment</DialogTitle>
              <DialogDescription>
                Invoice #{selectedInvoice?.invoiceNumber} • Student: {selectedInvoice?.student?.firstName} {selectedInvoice?.student?.lastName}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={paymentForm.handleSubmit((v) => recordPaymentMutation.mutate(v))} className="space-y-4">
              <div className="rounded-xl border bg-muted/20 p-3 text-xs flex justify-between">
                <span>Total Invoice Due:</span>
                <span className="font-mono font-bold text-foreground">
                  ${(selectedInvoice?.totalAmount - (selectedInvoice?.paidAmount || 0)).toFixed(2)}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payAmount">Payment Amount ($)</Label>
                <Input id="payAmount" type="number" step="0.01" {...paymentForm.register('amount')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payMethod">Payment Gateway / Channel</Label>
                <Select id="payMethod" {...paymentForm.register('paymentMethod')}>
                  <option value="CASH">Cash at Campus Counter</option>
                  <option value="BKASH">bKash Merchant Gateway</option>
                  <option value="NAGAD">Nagad Direct</option>
                  <option value="CARD">Credit / Debit Card (Stripe)</option>
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payRemarks">Remarks / Reference</Label>
                <Input id="payRemarks" placeholder="e.g. Counter slip #104" {...paymentForm.register('remarks')} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedInvoice(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={recordPaymentMutation.isPending}>
                  {recordPaymentMutation.isPending ? 'Processing...' : 'Collect & Issue Receipt'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal 2: Generate Monthly Invoices */}
        <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
          <DialogContent onClose={() => setIsGenerateOpen(false)}>
            <DialogHeader>
              <DialogTitle>Generate Monthly Student Invoices</DialogTitle>
              <DialogDescription>
                Bulk generate itemized tuition invoices for all enrolled students in the class.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={generateForm.handleSubmit((v) => generateInvoicesMutation.mutate(v))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="genClass">Target Class</Label>
                <Select id="genClass" {...generateForm.register('classId')}>
                  <option value="">Select Class</option>
                  {classes?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="genTitle">Invoice Title</Label>
                <Input id="genTitle" {...generateForm.register('title')} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="genMonth">Billing Month (1-12)</Label>
                  <Input id="genMonth" type="number" {...generateForm.register('month')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="genDue">Payment Due Date</Label>
                  <Input id="genDue" type="date" {...generateForm.register('dueDate')} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsGenerateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={generateInvoicesMutation.isPending}>
                  {generateInvoicesMutation.isPending ? 'Generating...' : 'Generate Invoices'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal 3: Record Expense */}
        <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
          <DialogContent onClose={() => setIsExpenseOpen(false)}>
            <DialogHeader>
              <DialogTitle>Post Institutional Expense</DialogTitle>
              <DialogDescription>Record bills, facility maintenance, and operational costs into ledger</DialogDescription>
            </DialogHeader>

            <form onSubmit={expenseForm.handleSubmit((v) => createExpenseMutation.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="expCat">Category</Label>
                  <Select id="expCat" {...expenseForm.register('category')}>
                    <option value="Utilities">Utilities & Power</option>
                    <option value="Maintenance">Campus Maintenance</option>
                    <option value="Lab Supplies">Lab & Science Supplies</option>
                    <option value="IT & Software">IT & Software Licenses</option>
                    <option value="Printing & Stationery">Printing & Stationery</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="expAmt">Amount ($)</Label>
                  <Input id="expAmt" type="number" step="0.01" {...expenseForm.register('amount')} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expTitle">Expense Description</Label>
                <Input id="expTitle" placeholder="e.g. High-Speed Campus Fiber Internet" {...expenseForm.register('title')} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="expVen">Vendor / Payee</Label>
                  <Input id="expVen" placeholder="e.g. Metro Power Corp" {...expenseForm.register('vendorName')} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="expDt">Expense Date</Label>
                  <Input id="expDt" type="date" {...expenseForm.register('expenseDate')} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsExpenseOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createExpenseMutation.isPending}>
                  {createExpenseMutation.isPending ? 'Posting...' : 'Post Expense'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal 4: Digital Money Receipt Modal */}
        <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
          <DialogContent onClose={() => setSelectedReceipt(null)} className="max-w-md">
            <div className="space-y-4 p-4">
              <div className="text-center border-b pb-3 space-y-1">
                <h3 className="text-base font-bold text-foreground uppercase tracking-wider">Noble Residential High School</h3>
                <p className="text-[11px] text-muted-foreground">Official Digital Fee Collection Receipt</p>
                <Badge variant="success">PAYMENT VERIFIED & POSTED</Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Receipt Number:</span>
                  <span className="font-mono font-bold text-primary">{selectedReceipt?.receiptNumber}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Payment Date:</span>
                  <span className="font-medium text-foreground">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Payment Amount:</span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">${selectedReceipt?.amount?.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 text-center text-xs text-muted-foreground">
                <div className="border-t border-muted-foreground/40 w-32 mx-auto mb-1" />
                <span>Authorized Bursar Signature</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-1.5 h-4 w-4" /> Print PDF
              </Button>
              <Button onClick={() => setSelectedReceipt(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  );
}
