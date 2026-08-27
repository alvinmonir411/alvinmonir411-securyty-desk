'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '@/lib/api/client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  FileText,
  Plus,
  Trash2,
  Pin,
  Calendar,
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

const noticeSchema = z.object({
  title: z.string().min(3, 'শিরনাম প্রয়োজন (Title required)'),
  content: z.string().min(5, 'বিস্তারিত তথ্য প্রয়োজন (Content required)'),
  target: z.enum(['ALL', 'STUDENTS', 'TEACHERS', 'PARENTS']),
  isPinned: z.boolean().default(false),
  attachmentUrl: z.string().optional(),
});

type NoticeFormValues = z.infer<typeof noticeSchema>;

export default function AdminNoticesPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: notices, isLoading, refetch } = useQuery({
    queryKey: ['admin-notices-list'],
    queryFn: async () => {
      const res = await apiClient.get('/cms/notices');
      return res.data.data || res.data || [];
    },
  });

  const form = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: '',
      content: '',
      target: 'ALL',
      isPinned: false,
      attachmentUrl: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: NoticeFormValues) => apiClient.post('/cms/notices', values),
    onSuccess: () => {
      success('নোটিশ সফলভাবে প্রকাশ করা হয়েছে!');
      setIsCreateOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['admin-notices-list'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'নোটিশ তৈরি ব্যর্থ হয়েছে'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/cms/notices/${id}`),
    onSuccess: () => {
      success('নোটিশ মুছে ফেলা হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['admin-notices-list'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'মুছে ফেলতে ব্যর্থ হয়েছে'),
  });

  const list = (notices || []).filter((n: any) =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']}>
      <div className="space-y-6">
        <PageHeader
          heading="নোটিশ বোর্ড পরিচালনা (Notices Management)"
          subheading="বিদ্যালয়ের প্রাতিষ্ঠানিক নোটিশ প্রকাশ ও ব্রডকাস্ট করুন"
        >
          <Button onClick={() => setIsCreateOpen(true)} className="shadow-md">
            <Plus className="mr-1.5 h-4 w-4" />
            নতুন নোটিশ লিখুন
          </Button>
        </PageHeader>

        {/* Filter / Search */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="নোটিশ খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notices Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">নোটিশ লোড হচ্ছে...</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed rounded-2xl">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/40 mb-2" />
            <p className="font-semibold text-foreground">কোনো নোটিশ পাওয়া যায়নি</p>
            <p className="text-xs text-muted-foreground mt-1">নতুন নোটিশ তৈরি করতে উপরের বাটনে ক্লিক করুন</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map((notice: any) => (
              <Card key={notice.id} className="shadow-sm hover:border-primary/40 transition-colors relative">
                <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {notice.isPinned && (
                        <Badge variant="default" className="text-[10px] gap-1 bg-amber-500 text-white">
                          <Pin className="h-3 w-3" /> পিন করা
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {notice.target || 'ALL'}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold">{notice.title}</CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground">
                      {new Date(notice.createdAt).toLocaleDateString('bn-BD')}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm('এই নোটিশটি মুছে ফেলতে চান?')) {
                        deleteMutation.mutate(notice.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-2 text-xs text-muted-foreground space-y-3">
                  <p className="whitespace-pre-line leading-relaxed">{notice.content}</p>
                  {notice.attachmentUrl && (
                    <a
                      href={notice.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline text-xs font-semibold"
                    >
                      <FileText className="h-3.5 w-3.5" /> সংযুক্ত ফাইল দেখুন (Attachment)
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent onClose={() => setIsCreateOpen(false)} className="max-w-lg">
            <DialogHeader>
              <DialogTitle>নতুন নোটিশ তৈরি করুন (Publish Notice)</DialogTitle>
              <DialogDescription>
                শিক্ষার্থী, শিক্ষক বা অভিভাবকদের জন্য নতুন নোটিশ জারি করুন।
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">নোটিশ শিরোনাম (Title)</Label>
                <Input id="title" placeholder="যেমন: বার্ষিক বিজ্ঞান মেলা ২০২৬" {...form.register('title')} />
                {form.formState.errors.title && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="target">কাদের জন্য প্রযোজ্য (Target Audience)</Label>
                <Select id="target" {...form.register('target')}>
                  <option value="ALL">সকলের জন্য (All School)</option>
                  <option value="STUDENTS">শুধু শিক্ষার্থীদের জন্য (Students)</option>
                  <option value="TEACHERS">শুধু শিক্ষকদের জন্য (Teachers)</option>
                  <option value="PARENTS">শুধু অভিভাবকদের জন্য (Parents)</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="content">বিস্তারিত তথ্য (Content)</Label>
                <textarea
                  id="content"
                  rows={4}
                  placeholder="নোটিশের বিস্তারিত লিখুন..."
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  {...form.register('content')}
                />
                {form.formState.errors.content && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.content.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="attachmentUrl">সংযুক্ত ফাইল লিংক (Attachment URL)</Label>
                <Input id="attachmentUrl" placeholder="https://..." {...form.register('attachmentUrl')} />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPinned"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  {...form.register('isPinned')}
                />
                <Label htmlFor="isPinned" className="text-xs cursor-pointer font-semibold">
                  উপরে পিন করে রাখুন (Pin to top)
                </Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  বাতিল
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'প্রকাশ হচ্ছে...' : 'নোটিশ প্রকাশ করুন'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  );
}
