'use client';

import React, { useState } from 'react';
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
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileText,
  Calendar,
  Phone,
  Mail,
  User,
  ShieldAlert,
  Printer,
  Sparkles,
  Download,
  AlertTriangle,
  CreditCard,
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

export default function AdminAdmissionsPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
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
      const statusLabel = STATUS_MAP[variables.status]?.label || variables.status;
      success(`আবেদন সফলভাবে ${statusLabel} করা হয়েছে!`);
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

  // Filtered list
  const filteredApps = appsList.filter((app) => {
    const matchesSearch =
      !search ||
      app.applicationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      `${app.firstName} ${app.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      app.parentPhone?.includes(search) ||
      app.parentName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' || app.status === selectedStatus;
    const matchesClass = selectedClass === 'ALL' || app.classId === selectedClass || app.class?.name === selectedClass;

    return matchesSearch && matchesStatus && matchesClass;
  });

  // Counts for summary metrics
  const totalCount = appsList.length;
  const pendingCount = appsList.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length;
  const approvedCount = appsList.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = appsList.filter((a) => a.status === 'REJECTED').length;

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

  const handleQuickStatusChange = (appId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: appId, status: newStatus });
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']}>
      <div className="space-y-6">
        <PageHeader
          heading="ভর্তি আবেদন ব্যবস্থাপনা (Admissions Pipeline)"
          subheading="অনলাইনে দাখিলকৃত শিক্ষার্থীদের ভর্তি আবেদন পর্যালোচনা, অনুমোদন বা বাতিলের নিয়ন্ত্রণ প্যানেল"
        />

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 shadow-sm border border-border flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">মোট আবেদন</p>
              <h3 className="text-xl font-bold text-foreground">{totalCount}</h3>
            </div>
          </Card>

          <Card className="p-4 shadow-sm border border-border flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">অপেক্ষমাণ (Pending)</p>
              <h3 className="text-xl font-bold text-amber-600">{pendingCount}</h3>
            </div>
          </Card>

          <Card className="p-4 shadow-sm border border-border flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">অনুমোদিত (Approved)</p>
              <h3 className="text-xl font-bold text-emerald-600">{approvedCount}</h3>
            </div>
          </Card>

          <Card className="p-4 shadow-sm border border-border flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">বাতিল (Rejected)</p>
              <h3 className="text-xl font-bold text-rose-600">{rejectedCount}</h3>
            </div>
          </Card>
        </div>

        {/* Filter Controls */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="relative sm:col-span-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="আবেদন নং, শিক্ষার্থীর নাম বা ফোন..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div>
                <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="ALL">সকল স্ট্যাটাস (All Statuses)</option>
                  <option value="SUBMITTED">নতুন আবেদন (Pending / Submitted)</option>
                  <option value="UNDER_REVIEW">যাচাই চলছে (Under Review)</option>
                  <option value="EXAM_SCHEDULED">পরীক্ষা নির্ধারিত (Exam Scheduled)</option>
                  <option value="APPROVED">ভর্তি অনুমোদিত (Approved)</option>
                  <option value="REJECTED">বাতিলকৃত (Rejected)</option>
                  <option value="WAITLISTED">অপেক্ষমাণ তালিকা (Waitlisted)</option>
                </Select>
              </div>

              <div className="flex items-center justify-end">
                <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
                  রিফ্রেশ করুন
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Data Table */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">ভর্তি আবেদন তালিকা (Applications)</CardTitle>
              <CardDescription>মোট {filteredApps.length} টি আবেদন প্রদর্শন করা হচ্ছে</CardDescription>
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
                <UserPlus className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
                <h4 className="text-sm font-semibold text-foreground">কোনো আবেদন পাওয়া যায়নি</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  এখনো কোনো শিক্ষার্থী এই ফিল্টারের অধীনে অনলাইনে আবেদন জমা দেয়নি।
                </p>
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
                      <TableHead>তারিখ</TableHead>
                      <TableHead>বর্তমান স্ট্যাটাস</TableHead>
                      <TableHead className="text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApps.map((app) => {
                      const photoDoc = app.documents?.find((d: any) => d.documentType === 'PASSPORT_PHOTO');
                      const statusInfo = STATUS_MAP[app.status] || { label: app.status, variant: 'outline', color: '' };

                      return (
                        <TableRow key={app.id} className="hover:bg-muted/40 transition-colors">
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
                                <p className="font-semibold text-foreground">
                                  {app.firstName} {app.lastName}
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
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.color}`}>
                              {statusInfo.label}
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

                              {app.status !== 'APPROVED' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-7 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                                  title="Approve Admission"
                                  onClick={() => handleQuickStatusChange(app.id, 'APPROVED')}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </Button>
                              )}

                              {app.status !== 'REJECTED' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 px-2 text-[11px]"
                                  title="Reject Application"
                                  onClick={() => handleQuickStatusChange(app.id, 'REJECTED')}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
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
                <span>আবেদন পর্যালোচনা (Application Review)</span>
                <span className="font-mono text-sm text-primary font-bold">{selectedApp?.applicationNumber}</span>
              </DialogTitle>
              <DialogDescription>
                শিক্ষার্থীর সকল তথ্যাবলী ও আপলোডকৃত ডকুমেন্ট যাচাই করুন।
              </DialogDescription>
            </DialogHeader>

            {selectedApp && (
              <div className="space-y-4 text-xs">
                {/* Status Bar */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border">
                  <div>
                    <span className="text-muted-foreground">বর্তমান স্ট্যাটাস: </span>
                    <span className="font-bold text-foreground">
                      {STATUS_MAP[selectedApp.status]?.label || selectedApp.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    আবেদনের তারিখ: {new Date(selectedApp.createdAt).toLocaleDateString('bn-BD')}
                  </span>
                </div>

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
                      <CheckCircle2 className="h-4 w-4" /> Approve
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
