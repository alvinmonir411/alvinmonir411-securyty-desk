'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileText,
  Calendar,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Printer,
  Sparkles,
  Download,
  AlertTriangle,
  CreditCard,
  History,
  GraduationCap,
  ArrowRight,
  Filter,
  Check,
} from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'destructive' | 'warning' | 'outline'; color: string }> = {
  SUBMITTED: { label: 'নতুন আবেদন (Pending)', variant: 'warning', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  UNDER_REVIEW: { label: 'যাচাই চলছে (Under Review)', variant: 'outline', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  DOCUMENT_VERIFIED: { label: 'কাগজপত্র যাচাইকৃত', variant: 'outline', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30' },
  EXAM_SCHEDULED: { label: 'পরীক্ষা নির্ধারিত', variant: 'outline', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  APPROVED: { label: 'অনুমোদিত (Approved)', variant: 'success', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  WAITLISTED: { label: 'অপেক্ষমাণ (Waitlisted)', variant: 'outline', color: 'bg-slate-500/10 text-slate-600 border-slate-500/30' },
  REJECTED: { label: 'বাতিল (Rejected)', variant: 'destructive', color: 'bg-rose-500/10 text-rose-600 border-rose-500/30' },
};

type ActiveTab = 'PENDING' | 'APPROVED_HISTORY' | 'REJECTED' | 'ALL';

export default function AdminAdmissionsPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>('ALL');
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');

  // Review Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [testDate, setTestDate] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [customRollNumber, setCustomRollNumber] = useState<string>('');

  // Fetch Admission Applications
  const { data: applications, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-admissions-list'],
    queryFn: async () => {
      const res = await apiClient.get('/admissions');
      return res.data.data || res.data || [];
    },
  });

  // Fetch Sections for Assignment
  const { data: sectionsData } = useQuery({
    queryKey: ['admin-admissions-sections'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/sections');
      return res.data.data || res.data || [];
    },
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
      testDate,
      sectionId,
      rollNumber,
    }: {
      id: string;
      status: string;
      notes?: string;
      testDate?: string;
      sectionId?: string;
      rollNumber?: number;
    }) => {
      const res = await apiClient.patch(`/admissions/${id}/status`, {
        status,
        notes: notes || undefined,
        testDate: testDate || undefined,
        sectionId: sectionId || undefined,
        rollNumber: rollNumber ? Number(rollNumber) : undefined,
      });
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-admissions-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-students-list'] });
      const statusLabel = STATUS_MAP[variables.status]?.label || variables.status;
      success(`আবেদন সফলভাবে ${statusLabel} করা হয়েছে এবং এনরোল সম্পন্ন হয়েছে!`);
      if (selectedApp?.id === variables.id) {
        setSelectedApp({ ...selectedApp, status: variables.status, notes: variables.notes });
      }
      setIsReviewOpen(false);
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'আবেদনের স্ট্যাটাস পরিবর্তন করতে ব্যর্থ হয়েছে');
    },
  });

  const appsList: any[] = Array.isArray(applications) ? applications : [];

  // Counts for summary metrics
  const totalCount = appsList.length;
  const pendingCount = appsList.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW' || a.status === 'DOCUMENT_VERIFIED' || a.status === 'EXAM_SCHEDULED').length;
  const approvedCount = appsList.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = appsList.filter((a) => a.status === 'REJECTED').length;

  // Filtered list based on active tab and search filters
  const filteredApps = appsList.filter((app) => {
    // Tab filtering
    if (activeTab === 'PENDING') {
      if (app.status === 'APPROVED' || app.status === 'REJECTED') return false;
    } else if (activeTab === 'APPROVED_HISTORY') {
      if (app.status !== 'APPROVED') return false;
    } else if (activeTab === 'REJECTED') {
      if (app.status !== 'REJECTED') return false;
    }

    const matchesSearch =
      !search ||
      app.applicationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      `${app.firstName} ${app.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      app.parentPhone?.includes(search) ||
      app.parentName?.toLowerCase().includes(search.toLowerCase());

    const matchesClass = selectedClass === 'ALL' || app.classId === selectedClass || app.class?.name === selectedClass;

    return matchesSearch && matchesClass;
  });

  const handleOpenReview = (app: any) => {
    setSelectedApp(app);
    setReviewNotes(app.notes || '');
    setTestDate(app.testDate ? new Date(app.testDate).toISOString().split('T')[0] : '');

    const matchingSection = sectionsData?.find(
      (s: any) => s.classId === app.classId || s.class?.id === app.classId,
    );
    setSelectedSectionId(matchingSection?.id || '');
    setCustomRollNumber('');
    setIsReviewOpen(true);
  };

  const handleQuickApprove = (appId: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই আবেদনটি অনুমোদন করে শিক্ষার্থীকে স্বয়ংক্রিয়ভাবে এনরোল করতে চান?')) {
      updateStatusMutation.mutate({ id: appId, status: 'APPROVED' });
    }
  };

  const handleQuickReject = (appId: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই ভর্তি আবেদনটি বাতিল করতে চান?')) {
      updateStatusMutation.mutate({ id: appId, status: 'REJECTED' });
    }
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']}>
      <div className="space-y-6">
        <PageHeader
          heading="ভর্তি আবেদন ও এনরোলমেন্ট ব্যবস্থাপনা (Admissions Pipeline)"
          subheading="অনলাইনে দাখিলকৃত আবেদন পর্যালোচনা, অনুমোদন, এনরোলমেন্ট ও অনুমোদিত ভর্তি ইতিহাস"
        />

        {/* Summary Metrics Cards with Instant Tab Filtering */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* All */}
          <Card
            onClick={() => setActiveTab('ALL')}
            className={`p-4 shadow-sm border cursor-pointer transition-all ${
              activeTab === 'ALL'
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                : 'border-border hover:border-primary/40 hover:bg-muted/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">মোট আবেদন (All)</p>
                <h3 className="text-xl font-bold text-foreground">{totalCount}</h3>
              </div>
            </div>
          </Card>

          {/* Pending */}
          <Card
            onClick={() => setActiveTab('PENDING')}
            className={`p-4 shadow-sm border cursor-pointer transition-all ${
              activeTab === 'PENDING'
                ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5'
                : 'border-border hover:border-amber-500/40 hover:bg-muted/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">অপেক্ষমাণ (Pending)</p>
                <h3 className="text-xl font-bold text-amber-600">{pendingCount}</h3>
              </div>
            </div>
          </Card>

          {/* Approved History */}
          <Card
            onClick={() => setActiveTab('APPROVED_HISTORY')}
            className={`p-4 shadow-sm border cursor-pointer transition-all ${
              activeTab === 'APPROVED_HISTORY'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5'
                : 'border-border hover:border-emerald-500/40 hover:bg-muted/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">অনুমোদিত ইতিহাস (Approved)</p>
                <h3 className="text-xl font-bold text-emerald-600">{approvedCount}</h3>
              </div>
            </div>
          </Card>

          {/* Rejected */}
          <Card
            onClick={() => setActiveTab('REJECTED')}
            className={`p-4 shadow-sm border cursor-pointer transition-all ${
              activeTab === 'REJECTED'
                ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5'
                : 'border-border hover:border-rose-500/40 hover:bg-muted/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">বাতিল (Rejected)</p>
                <h3 className="text-xl font-bold text-rose-600">{rejectedCount}</h3>
              </div>
            </div>
          </Card>
        </div>

        {/* Admissions View Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            সকল আবেদন ({totalCount})
          </button>

          <button
            onClick={() => setActiveTab('PENDING')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'PENDING'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            অপেক্ষমাণ আবেদন ({pendingCount})
          </button>

          <button
            onClick={() => setActiveTab('APPROVED_HISTORY')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'APPROVED_HISTORY'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            অনুমোদিত ভর্তি ইতিহাস ({approvedCount})
          </button>

          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            বাতিলকৃত তালিকা ({rejectedCount})
          </button>
        </div>

        {/* Filter Controls */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="relative sm:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="আবেদন নং, শিক্ষার্থীর নাম বা ফোন নম্বর দিয়ে খুঁজুন..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
                  রিফ্রেশ করুন
                </Button>
                {activeTab === 'APPROVED_HISTORY' && (
                  <Link href="/admin/students">
                    <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5" /> শিক্ষার্থী তালিকা
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Data Table */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                {activeTab === 'APPROVED_HISTORY' ? (
                  <>
                    <History className="h-4 w-4 text-emerald-600" />
                    অনুমোদিত ভর্তি ইতিহাস (Approved Admissions History)
                  </>
                ) : activeTab === 'PENDING' ? (
                  <>
                    <Clock className="h-4 w-4 text-amber-600" />
                    অপেক্ষমাণ আবেদনসমূহ (Pending Submissions Queue)
                  </>
                ) : activeTab === 'REJECTED' ? (
                  <>
                    <XCircle className="h-4 w-4 text-rose-600" />
                    বাতিলকৃত আবেদন তালিকা (Rejected Applications)
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 text-primary" />
                    সকল ভর্তি আবেদন তালিকা (All Applications)
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {activeTab === 'APPROVED_HISTORY'
                  ? `মোট ${filteredApps.length} জন শিক্ষার্থীর ভর্তি অনুমোদন ও এনরোলমেন্ট রেকর্ড পাওয়া গেছে`
                  : `মোট ${filteredApps.length} টি আবেদন প্রদর্শন করা হচ্ছে`}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="p-8 text-center">
                <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-2" />
                <p className="text-sm font-medium text-destructive mb-3">আবেদন তালিকা লোড করতে সমস্যা হয়েছে</p>
                <Button size="sm" variant="outline" onClick={() => refetch()}>পুনরায় চেষ্টা করুন</Button>
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="p-12 text-center">
                {activeTab === 'APPROVED_HISTORY' ? (
                  <>
                    <History className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                    <h4 className="text-sm font-semibold text-foreground">কোনো অনুমোদিত ভর্তি রেকর্ড নেই</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      অপেক্ষমাণ আবেদন পর্যালোচনা করে অনুমোদন দিলে সেগুলো স্বয়ংক্রিয়ভাবে এখানে ইতিহাস হিসেবে যুক্ত হবে।
                    </p>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                    <h4 className="text-sm font-semibold text-foreground">কোনো আবেদন পাওয়া যায়নি</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      এই ক্যাটাগরিতে বর্তমানে কোনো আবেদন নেই।
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>আবেদন নম্বর</TableHead>
                      <TableHead>শিক্ষার্থীর নাম ও ছবি</TableHead>
                      <TableHead>অভিভাবকের নাম ও ফোন</TableHead>
                      <TableHead>ভর্তির শ্রেণী</TableHead>
                      <TableHead>আবেদনের তারিখ</TableHead>
                      <TableHead>বর্তমান স্ট্যাটাস</TableHead>
                      <TableHead className="text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApps.map((app) => {
                      const photoDoc = app.documents?.find((d: any) => d.documentType === 'PASSPORT_PHOTO');
                      const statusInfo = STATUS_MAP[app.status] || { label: app.status, variant: 'outline', color: '' };
                      const isApproved = app.status === 'APPROVED';

                      return (
                        <TableRow
                          key={app.id}
                          className={`transition-colors ${
                            isApproved ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-muted/40'
                          }`}
                        >
                          <TableCell className="font-mono font-bold text-primary">
                            {app.applicationNumber}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              {photoDoc?.fileUrl ? (
                                <img
                                  src={photoDoc.fileUrl}
                                  alt={app.firstName}
                                  className="h-8 w-8 rounded-full object-cover border border-border"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                  {app.firstName?.[0] || 'S'}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-foreground flex items-center gap-1.5">
                                  {app.firstName} {app.lastName}
                                  {isApproved && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" title="Enrolled" />
                                  )}
                                </p>
                                <p className="text-[10px] text-muted-foreground">{app.gender}</p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <p className="font-medium text-foreground">{app.parentName}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{app.parentPhone}</p>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className="text-[11px] font-semibold">
                              {app.class?.name || 'Class 1'}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-muted-foreground font-mono text-[11px]">
                            {new Date(app.createdAt).toLocaleDateString('bn-BD')}
                          </TableCell>

                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.color}`}>
                              {isApproved ? '✅ অনুমোদিত ও এনরোল্ড' : statusInfo.label}
                            </span>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-[11px] font-semibold gap-1"
                                onClick={() => handleOpenReview(app)}
                              >
                                <Eye className="h-3.5 w-3.5" /> পর্যালোচনা
                              </Button>

                              {/* If already approved, show View Student Link instead of re-approve */}
                              {isApproved ? (
                                <Link href="/admin/students">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-[11px] text-emerald-600 border-emerald-500/40 hover:bg-emerald-50 gap-1 font-semibold"
                                    title="View Student in Directory"
                                  >
                                    <GraduationCap className="h-3.5 w-3.5" /> শিক্ষার্থী
                                  </Button>
                                </Link>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                                    title="Approve Admission & Auto Enroll"
                                    onClick={() => handleQuickApprove(app.id)}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <Check className="h-3.5 w-3.5" /> অনুমোদন
                                  </Button>

                                  {app.status !== 'REJECTED' && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="h-7 px-2 text-[11px]"
                                      title="Reject Application"
                                      onClick={() => handleQuickReject(app.id)}
                                      disabled={updateStatusMutation.isPending}
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Application Review Modal */}
        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <DialogContent onClose={() => setIsReviewOpen(false)} className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>আবেদন পর্যালোচনা ও এনরোলমেন্ট (Application Review)</span>
                <span className="font-mono text-sm text-primary font-bold">{selectedApp?.applicationNumber}</span>
              </DialogTitle>
              <DialogDescription>
                শিক্ষার্থীর সকল তথ্যাবলী, পেমেন্ট স্লিপ ও আপলোডকৃত ডকুমেন্ট যাচাই করুন।
              </DialogDescription>
            </DialogHeader>

            {selectedApp && (
              <div className="space-y-4 text-xs">
                {/* Status Bar */}
                <div className={`flex items-center justify-between p-3 rounded-xl border ${
                  selectedApp.status === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-muted/40'
                }`}>
                  <div>
                    <span className="text-muted-foreground">বর্তমান স্ট্যাটাস: </span>
                    <span className="font-bold text-foreground">
                      {selectedApp.status === 'APPROVED' ? '✅ অনুমোদিত ও এনরোল্ড শিক্ষার্থী (Approved)' : STATUS_MAP[selectedApp.status]?.label || selectedApp.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    আবেদনের তারিখ: {new Date(selectedApp.createdAt).toLocaleDateString('bn-BD')}
                  </span>
                </div>

                {/* Approved Success Notice if already approved */}
                {selectedApp.status === 'APPROVED' && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                      <div>
                        <p className="font-bold">এই আবেদনটি অনুমোদিত হয়েছে!</p>
                        <p className="text-[11px] opacity-80">শিক্ষার্থী অ্যাকাউন্টে স্বয়ংক্রিয়ভাবে ক্লাস রোল ও সেকশন নির্ধারণ সম্পন্ন হয়েছে।</p>
                      </div>
                    </div>
                    <Link href="/admin/students">
                      <Button size="sm" variant="outline" className="text-xs bg-card border-emerald-500/40 text-emerald-600 hover:bg-emerald-50">
                        শিক্ষার্থী প্রোফাইল দেখুন
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Student Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border bg-card">
                  {/* Photo */}
                  <div className="flex flex-col items-center justify-center p-2 border-b sm:border-b-0 sm:border-r border-border">
                    {selectedApp.documents?.find((d: any) => d.documentType === 'PASSPORT_PHOTO')?.fileUrl ? (
                      <div className="space-y-2 text-center">
                        <img
                          src={selectedApp.documents.find((d: any) => d.documentType === 'PASSPORT_PHOTO').fileUrl}
                          alt="Student Photo"
                          className="h-28 w-28 rounded-xl object-cover border-2 border-primary/20 shadow-sm mx-auto"
                        />
                        <Badge variant="outline" className="text-[10px]">Cloudinary Photo</Badge>
                      </div>
                    ) : (
                      <div className="h-28 w-28 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-center p-2">
                        কোনো ছবি আপলোড করা হয়নি
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="sm:col-span-2 space-y-2">
                    <h4 className="text-sm font-bold text-foreground">{selectedApp.firstName} {selectedApp.lastName}</h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-muted-foreground block">ভর্তির শ্রেণী:</span>
                        <strong className="text-foreground">{selectedApp.class?.name || 'Class 1'}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">লিঙ্গ:</span>
                        <strong className="text-foreground">{selectedApp.gender}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">জন্ম তারিখ:</span>
                        <strong className="text-foreground">{new Date(selectedApp.dateOfBirth).toLocaleDateString()}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">পূর্ববর্তী বিদ্যালয়:</span>
                        <strong className="text-foreground">{selectedApp.previousSchool || 'N/A'}</strong>
                      </div>
                    </div>
                    <div className="pt-2 border-t text-[11px]">
                      <span className="text-muted-foreground block">ঠিকানা:</span>
                      <span className="text-foreground">{selectedApp.address}</span>
                    </div>
                  </div>
                </div>

                {/* Guardian & Payment Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl border bg-card space-y-1.5">
                    <h5 className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                      <User className="h-3.5 w-3.5 text-primary" /> অভিভাবকের তথ্য
                    </h5>
                    <p><strong>নাম:</strong> {selectedApp.parentName}</p>
                    <p><strong>মোবাইল:</strong> <span className="font-mono">{selectedApp.parentPhone}</span></p>
                    <p><strong>ইমেইল:</strong> {selectedApp.parentEmail}</p>
                  </div>

                  <div className="p-3 rounded-xl border bg-card space-y-1.5">
                    <h5 className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                      <CreditCard className="h-3.5 w-3.5 text-primary" /> ফি ও মোবাইল ব্যাংকিং পেমেন্ট
                    </h5>
                    {selectedApp.payments && selectedApp.payments.length > 0 ? (
                      selectedApp.payments.map((p: any, i: number) => (
                        <div key={i} className="text-[11px] space-y-1">
                          <p><strong>ফি:</strong> ৳ {Number(p.amount).toFixed(2)} (<span className="text-emerald-600 font-bold">{p.paymentMethod}</span>)</p>
                          <p><strong>TrxID / প্রেরক:</strong> <span className="font-mono text-primary font-bold">{p.transactionId}</span></p>
                          <p><strong>স্ট্যাটাস:</strong> <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">{p.paymentStatus}</Badge></p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-[11px]">পেমেন্ট তথ্য পাওয়া যায়নি</p>
                    )}
                  </div>
                </div>

                {/* Supporting Documents & Payment Slip */}
                <div className="p-3 rounded-xl border bg-card space-y-2">
                  <h5 className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                    <FileText className="h-3.5 w-3.5 text-primary" /> সংযুক্ত কাগজপত্র ও পেমেন্ট স্লিপ (Cloudinary)
                  </h5>
                  {selectedApp.documents && selectedApp.documents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {selectedApp.documents.map((doc: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg border bg-muted/20">
                          <span className="font-medium text-[11px]">
                            {doc.documentType === 'PASSPORT_PHOTO'
                              ? 'পাসপোর্ট ছবি'
                              : doc.documentType === 'BIRTH_CERTIFICATE'
                              ? 'জন্ম সনদ / প্রত্যয়ন'
                              : 'পেমেন্ট স্ক্রিনশট / স্লিপ'}
                          </span>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold text-[11px]"
                          >
                            <Download className="h-3 w-3" /> দেখুন
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-[11px]">কোনো কাগজপত্র সংযুক্ত নেই</p>
                  )}
                </div>

                {/* Status Update Actions */}
                <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                  <h5 className="font-bold text-foreground text-xs">সিদ্ধান্ত ও শিক্ষার্থী এনরোলমেন্ট (Decision & Class Enrollment)</h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">
                        সেকশন নির্ধারণ (Assigned Section) *
                      </label>
                      <Select
                        value={selectedSectionId}
                        onChange={(e) => setSelectedSectionId(e.target.value)}
                      >
                        <option value="">-- সেকশন বেছে নিন (ডিফল্ট ১ম সেকশন) --</option>
                        {sectionsData
                          ?.filter(
                            (s: any) =>
                              !selectedApp.classId ||
                              s.classId === selectedApp.classId ||
                              s.class?.id === selectedApp.classId,
                          )
                          .map((s: any) => (
                            <option key={s.id} value={s.id}>
                              সেকশন {s.name}
                            </option>
                          ))}
                      </Select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">
                        ক্লাস রোল নম্বর (Class Roll Number)
                      </label>
                      <input
                        type="number"
                        placeholder="খালি রাখলে পরবর্তী ক্রমিক রোল পাবে (Auto)"
                        value={customRollNumber}
                        onChange={(e) => setCustomRollNumber(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">
                        ভর্তি পরীক্ষার তারিখ (প্রযোজ্য হলে)
                      </label>
                      <input
                        type="date"
                        value={testDate}
                        onChange={(e) => setTestDate(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">
                        অফিসিয়াল মন্তব্য / নোট
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: সকল সনদপত্র সঠিক রয়েছে..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: selectedApp.id,
                          status: 'APPROVED',
                          notes: reviewNotes,
                          testDate,
                          sectionId: selectedSectionId,
                          rollNumber: customRollNumber ? Number(customRollNumber) : undefined,
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4" /> {selectedApp.status === 'APPROVED' ? 'এনরোলমেন্ট আপডেট করুন' : 'Approve & Enroll'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-purple-500/40 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950 font-semibold gap-1"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: selectedApp.id,
                          status: 'EXAM_SCHEDULED',
                          notes: reviewNotes,
                          testDate,
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      <Calendar className="h-4 w-4" /> পরীক্ষার তারিখ নির্ধারণ
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-500/40 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 font-semibold gap-1"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: selectedApp.id,
                          status: 'UNDER_REVIEW',
                          notes: reviewNotes,
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      <Clock className="h-4 w-4" /> যাচাইকরণে রাখুন (Under Review)
                    </Button>

                    {selectedApp.status !== 'REJECTED' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="font-semibold gap-1"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: selectedApp.id,
                            status: 'REJECTED',
                            notes: reviewNotes,
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        <XCircle className="h-4 w-4" /> আবেদন বাতিল করুন (Reject)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReviewOpen(false)}>
                বন্ধ করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  );
}
