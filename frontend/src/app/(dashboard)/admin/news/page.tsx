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
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  Search,
} from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';

const newsSchema = z.object({
  title: z.string().min(3, 'সংবাদের শিরোনাম প্রয়োজন'),
  summary: z.string().min(5, 'সংক্ষিপ্ত সারসংক্ষেপ প্রয়োজন'),
  content: z.string().min(10, 'সংবাদের মূল বিষয়বস্তু প্রয়োজন'),
  coverImage: z.string().optional(),
});

type NewsFormValues = z.infer<typeof newsSchema>;

export default function AdminNewsPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: newsList, isLoading } = useQuery({
    queryKey: ['admin-news-list'],
    queryFn: async () => {
      const res = await apiClient.get('/cms/news');
      return res.data.data || res.data || [];
    },
  });

  const form = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: '',
      summary: '',
      content: '',
      coverImage: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: NewsFormValues) => apiClient.post('/cms/news', values),
    onSuccess: () => {
      success('সংবাদ সফলভাবে প্রকাশ করা হয়েছে!');
      setIsCreateOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['admin-news-list'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'সংবাদ প্রকাশ ব্যর্থ হয়েছে'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/cms/news/${id}`),
    onSuccess: () => {
      success('সংবাদ মুছে ফেলা হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['admin-news-list'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'মুছে ফেলতে ব্যর্থ হয়েছে'),
  });

  const list = (newsList || []).filter((n: any) =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']}>
      <div className="space-y-6">
        <PageHeader
          heading="ক্যাম্পাস নিউজ পরিচালনা (Campus News Management)"
          subheading="বিদ্যালয়ের অর্জনের খবর, প্রেস রিলিজ ও কভারেজ প্রকাশ করুন"
        >
          <Button onClick={() => setIsCreateOpen(true)} className="shadow-md">
            <Plus className="mr-1.5 h-4 w-4" />
            নতুন সংবাদ প্রকাশ করুন
          </Button>
        </PageHeader>

        {/* Search */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="সংবাদ খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">সংবাদ লোড হচ্ছে...</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed rounded-2xl">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/40 mb-2" />
            <p className="font-semibold text-foreground">কোনো ক্যাম্পাস সংবাদ পাওয়া যায়নি</p>
            <p className="text-xs text-muted-foreground mt-1">নতুন সংবাদ প্রকাশ করতে উপরের বাটনে ক্লিক করুন</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {list.map((item: any) => (
              <Card key={item.id} className="shadow-sm hover:border-primary/40 transition-colors flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {new Date(item.createdAt).toLocaleDateString('bn-BD')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm('এই সংবাদটি মুছে ফেলতে চান?')) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-base font-bold mt-1">{item.title}</CardTitle>
                  <CardDescription className="text-xs font-medium text-foreground/80 line-clamp-2">
                    {item.summary}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 text-xs text-muted-foreground pt-0">
                  <p className="line-clamp-4 border-t pt-2">{item.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent onClose={() => setIsCreateOpen(false)} className="max-w-lg">
            <DialogHeader>
              <DialogTitle>নতুন কভারেজ বা সংবাদ প্রকাশ করুন (Publish News)</DialogTitle>
              <DialogDescription>
                বিদ্যালয়ের কৃতিত্ব, পদক ও সাফল্য সম্পর্কিত সংবাদ পোর্টাল প্রকাশ করুন।
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">সংবাদের শিরোনাম (Title)</Label>
                <Input id="title" placeholder="যেমন: জাতীয় গণিত অলিম্পিয়াডে নোবেল স্কুলের ১ম স্থান অর্জন" {...form.register('title')} />
                {form.formState.errors.title && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="summary">সংক্ষিপ্ত সারসংক্ষেপ (Short Summary)</Label>
                <Input id="summary" placeholder="সংবাদের ১-২ লাইনের মূল বক্তব্য..." {...form.register('summary')} />
                {form.formState.errors.summary && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.summary.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="content">মূল বিষয়বস্তু (Full Article Content)</Label>
                <textarea
                  id="content"
                  rows={5}
                  placeholder="সম্পূর্ণ সংবাদের বর্ণনা লিখুন..."
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  {...form.register('content')}
                />
                {form.formState.errors.content && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.content.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <ImageUpload
                  label="সংবাদের ফিচার বা কভার ছবি (News Cover Image)"
                  value={form.watch('coverImage')}
                  onChange={(url) => form.setValue('coverImage', url)}
                  onRemove={() => form.setValue('coverImage', '')}
                  folder="news"
                  aspectRatio="video"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  বাতিল
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'প্রকাশ হচ্ছে...' : 'সংবাদ প্রকাশ করুন'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  );
}
