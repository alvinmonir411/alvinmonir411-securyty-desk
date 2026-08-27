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
  Calendar,
  Plus,
  Trash2,
  MapPin,
  Clock,
  Search,
} from 'lucide-react';

import { ImageUpload } from '@/components/ui/image-upload';

const eventSchema = z.object({
  title: z.string().min(3, 'ইভেন্টের নাম প্রয়োজন'),
  description: z.string().min(5, 'বিস্তারিত বর্ণনা প্রয়োজন'),
  venue: z.string().min(2, 'স্থান / ভেন্যু প্রয়োজন'),
  startDate: z.string().min(1, 'শুরুর তারিখ ও সময় দিন'),
  endDate: z.string().min(1, 'শেষের তারিখ ও সময় দিন'),
  coverImage: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function AdminEventsPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-events-list'],
    queryFn: async () => {
      const res = await apiClient.get('/cms/events');
      return res.data.data || res.data || [];
    },
  });

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      venue: 'বিদ্যালয় মাঠ / মিলনায়তন',
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      coverImage: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: EventFormValues) => apiClient.post('/cms/events', values),
    onSuccess: () => {
      success('ইভেন্ট সফলভাবে প্রকাশ করা হয়েছে!');
      setIsCreateOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['admin-events-list'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'ইভেন্ট তৈরি ব্যর্থ হয়েছে'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/cms/events/${id}`),
    onSuccess: () => {
      success('ইভেন্ট মুছে ফেলা হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['admin-events-list'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'মুছে ফেলতে ব্যর্থ হয়েছে'),
  });

  const list = (events || []).filter((e: any) =>
    !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.venue.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']}>
      <div className="space-y-6">
        <PageHeader
          heading="ইভেন্ট ক্যালেন্ডার পরিচালনা (Events Management)"
          subheading="বিদ্যালয়ের সকল ক্রীড়া, সাংস্কৃতিক ও একাডেমিক ইভেন্ট পরিচালনা করুন"
        >
          <Button onClick={() => setIsCreateOpen(true)} className="shadow-md">
            <Plus className="mr-1.5 h-4 w-4" />
            নতুন ইভেন্ট যোগ করুন
          </Button>
        </PageHeader>

        {/* Search */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ইভেন্ট বা স্থান খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">ইভেন্ট লোড হচ্ছে...</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed rounded-2xl">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/40 mb-2" />
            <p className="font-semibold text-foreground">কোনো ইভেন্ট যুক্ত করা হয়নি</p>
            <p className="text-xs text-muted-foreground mt-1">নতুন ইভেন্ট তৈরি করতে উপরের বাটনে ক্লিক করুন</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map((ev: any) => (
              <Card key={ev.id} className="shadow-sm hover:border-primary/40 transition-colors flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-mono border-primary text-primary">
                      {new Date(ev.startDate).toLocaleDateString('bn-BD')}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm('এই ইভেন্টটি মুছে ফেলতে চান?')) {
                          deleteMutation.mutate(ev.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-base font-bold mt-2">{ev.title}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 text-xs text-muted-foreground flex-1">
                  <p className="line-clamp-3">{ev.description}</p>
                  <div className="pt-2 border-t space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{ev.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {new Date(ev.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(ev.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent onClose={() => setIsCreateOpen(false)} className="max-w-lg">
            <DialogHeader>
              <DialogTitle>নতুন ইভেন্ট যুক্ত করুন (Create Event)</DialogTitle>
              <DialogDescription>
                বিদ্যালয়ের ক্যালেন্ডারে নতুন একাডেমিক বা সাংস্কৃতিক ইভেন্ট প্রকাশ করুন।
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">ইভেন্টের নাম (Title)</Label>
                <Input id="title" placeholder="যেমন: বার্ষিক ক্রীড়া প্রতিযোগিতা ২০২৬" {...form.register('title')} />
                {form.formState.errors.title && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="venue">স্থান / ভেন্যু (Venue)</Label>
                <Input id="venue" placeholder="যেমন: বিদ্যালয় মূল মাঠ" {...form.register('venue')} />
                {form.formState.errors.venue && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.venue.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate">শুরুর সময় (Start Date & Time)</Label>
                  <Input id="startDate" type="datetime-local" {...form.register('startDate')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate">শেষের সময় (End Date & Time)</Label>
                  <Input id="endDate" type="datetime-local" {...form.register('endDate')} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">বিস্তারিত বিবরণ (Description)</Label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder="ইভেন্টের বিস্তারিত সময়সূচী ও কর্মসূচি লিখুন..."
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  {...form.register('description')}
                />
                {form.formState.errors.description && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <ImageUpload
                  label="ইভেন্ট কভার ছবি (Event Cover Photo)"
                  value={form.watch('coverImage')}
                  onChange={(url) => form.setValue('coverImage', url)}
                  onRemove={() => form.setValue('coverImage', '')}
                  folder="events"
                  aspectRatio="video"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  বাতিল
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'ইভেন্ট প্রকাশ করুন'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  );
}
