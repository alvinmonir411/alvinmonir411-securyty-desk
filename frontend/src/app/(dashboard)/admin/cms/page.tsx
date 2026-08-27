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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  Globe,
  Plus,
  Bell,
  Sparkles,
  Calendar,
  Image as ImageIcon,
  FileText,
  Pin,
  Trash2,
  Eye,
} from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';

const createNoticeSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  content: z.string().min(10, 'Content is required'),
  target: z.enum(['ALL', 'STUDENTS', 'TEACHERS', 'PARENTS']),
  isPinned: z.boolean().default(false),
});

const createSlideSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  subtitle: z.string().optional(),
  imageUrl: z.string().min(1, 'Image is required'),
  buttonText: z.string().default('Learn More'),
  buttonLink: z.string().default('/admissions'),
});

const createNewsSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  summary: z.string().min(10, 'Summary is required'),
  content: z.string().min(20, 'Content is required'),
  coverImage: z.string().min(1, 'Cover image is required'),
});

const createEventSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  venue: z.string().min(2, 'Venue is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  coverImage: z.string().min(1, 'Cover image is required'),
});

type CreateNoticeValues = z.infer<typeof createNoticeSchema>;
type CreateSlideValues = z.infer<typeof createSlideSchema>;
type CreateNewsValues = z.infer<typeof createNewsSchema>;
type CreateEventValues = z.infer<typeof createEventSchema>;

export default function AdminCMSPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const [isEventOpen, setIsEventOpen] = useState(false);

  // Queries
  const { data: notices, isLoading: noticesLoading } = useQuery({
    queryKey: ['admin-cms-notices'],
    queryFn: async () => {
      const res = await apiClient.get('/cms/notices');
      return res.data.data || res.data;
    },
  });

  const { data: slides, isLoading: slidesLoading } = useQuery({
    queryKey: ['admin-cms-slides'],
    queryFn: async () => {
      const res = await apiClient.get('/cms/hero-slides');
      return res.data.data || res.data;
    },
  });

  const { data: news, isLoading: newsLoading } = useQuery({
    queryKey: ['admin-cms-news'],
    queryFn: async () => {
      const res = await apiClient.get('/cms/news');
      return res.data.data || res.data;
    },
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-cms-events'],
    queryFn: async () => {
      const res = await apiClient.get('/cms/events');
      return res.data.data || res.data;
    },
  });

  // Forms
  const noticeForm = useForm<CreateNoticeValues>({
    resolver: zodResolver(createNoticeSchema),
    defaultValues: { title: '', content: '', target: 'ALL', isPinned: false },
  });

  const slideForm = useForm<CreateSlideValues>({
    resolver: zodResolver(createSlideSchema),
    defaultValues: { title: '', subtitle: '', imageUrl: '', buttonText: 'Apply for Admission', buttonLink: '/admissions' },
  });

  const newsForm = useForm<CreateNewsValues>({
    resolver: zodResolver(createNewsSchema),
    defaultValues: { title: '', summary: '', content: '', coverImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800' },
  });

  const eventForm = useForm<CreateEventValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { title: '', description: '', venue: 'Main Auditorium', startDate: '2026-04-15T09:00', endDate: '2026-04-16T17:00', coverImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800' },
  });

  // Mutations
  const noticeMutation = useMutation({
    mutationFn: (values: CreateNoticeValues) => apiClient.post('/cms/notices', values),
    onSuccess: () => {
      success('Notice published to school portal and website!');
      setIsNoticeOpen(false);
      noticeForm.reset();
      queryClient.invalidateQueries({ queryKey: ['admin-cms-notices'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to post notice'),
  });

  const slideMutation = useMutation({
    mutationFn: (values: CreateSlideValues) => apiClient.post('/cms/hero-slides', values),
    onSuccess: () => {
      success('Hero slider banner added to homepage!');
      setIsSlideOpen(false);
      slideForm.reset();
      queryClient.invalidateQueries({ queryKey: ['admin-cms-slides'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to add slide'),
  });

  const newsMutation = useMutation({
    mutationFn: (values: CreateNewsValues) => apiClient.post('/cms/news', values),
    onSuccess: () => {
      success('News article published!');
      setIsNewsOpen(false);
      newsForm.reset();
      queryClient.invalidateQueries({ queryKey: ['admin-cms-news'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to publish news'),
  });

  const eventMutation = useMutation({
    mutationFn: (values: CreateEventValues) => apiClient.post('/cms/events', values),
    onSuccess: () => {
      success('Campus calendar event created!');
      setIsEventOpen(false);
      eventForm.reset();
      queryClient.invalidateQueries({ queryKey: ['admin-cms-events'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to create event'),
  });

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
      <div className="space-y-6">
        <PageHeader
          heading="Public Website & Content Management System (CMS)"
          subheading="Manage homepage hero banners, circular notice boards, news stories, and campus event calendars."
        >
          <Button onClick={() => setIsNoticeOpen(true)} className="shadow-md">
            <Plus className="mr-1.5 h-4 w-4" />
            Publish Notice
          </Button>
        </PageHeader>

        <Tabs defaultValue="notices" className="w-full">
          <TabsList className="grid grid-cols-4 max-w-2xl">
            <TabsTrigger value="notices">Notice Board</TabsTrigger>
            <TabsTrigger value="slides">Hero Banners</TabsTrigger>
            <TabsTrigger value="news">News Articles</TabsTrigger>
            <TabsTrigger value="events">Calendar Events</TabsTrigger>
          </TabsList>

          {/* TAB 1: NOTICES */}
          <TabsContent value="notices">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Institutional Notices & Circulars</CardTitle>
                  <CardDescription>Targeted notices for all users, parents, or faculty</CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsNoticeOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Notice
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {noticesLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Target Audience</TableHead>
                        <TableHead>Pinned?</TableHead>
                        <TableHead>Published Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notices?.map((n: any) => (
                        <TableRow key={n.id}>
                          <TableCell className="font-semibold text-foreground">{n.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{n.target}</Badge>
                          </TableCell>
                          <TableCell>
                            {n.isPinned ? (
                              <Badge variant="default" className="text-[10px]">
                                <Pin className="h-3 w-3 mr-1" /> PINNED
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Standard</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {new Date(n.publishedAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: HERO SLIDES */}
          <TabsContent value="slides">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Homepage Hero Slider Banners</CardTitle>
                  <CardDescription>Dynamic full-width banners on the public website</CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsSlideOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Slide
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Banner Preview</TableHead>
                      <TableHead>Title & Subtitle</TableHead>
                      <TableHead>CTA Button</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slides?.map((s: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <img src={s.imageUrl} alt="Banner" className="h-14 w-24 object-cover rounded-lg" />
                        </TableCell>
                        <TableCell>
                          <h4 className="font-bold text-foreground text-xs">{s.title}</h4>
                          <p className="text-[11px] text-muted-foreground">{s.subtitle}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{s.buttonText || 'Learn More'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: NEWS */}
          <TabsContent value="news">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">News & Press Releases</CardTitle>
                  <CardDescription>School milestones and student accomplishments</CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsNewsOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Article
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cover</TableHead>
                      <TableHead>Article Title</TableHead>
                      <TableHead>Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {news?.map((item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <img src={item.coverImage} alt="Cover" className="h-12 w-16 object-cover rounded-lg" />
                        </TableCell>
                        <TableCell className="font-semibold text-foreground text-xs">{item.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{item.summary}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: EVENTS */}
          <TabsContent value="events">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Campus Calendar Events</CardTitle>
                  <CardDescription>Academic fairs, sports galas, and parent conferences</CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsEventOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Event
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Title</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events?.map((ev: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-semibold text-foreground text-xs">{ev.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{ev.venue}</TableCell>
                        <TableCell className="text-xs font-mono">{new Date(ev.startDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal: Create Notice */}
        <Dialog open={isNoticeOpen} onOpenChange={setIsNoticeOpen}>
          <DialogContent onClose={() => setIsNoticeOpen(false)}>
            <DialogHeader>
              <DialogTitle>Publish Institutional Notice</DialogTitle>
              <DialogDescription>Add circular to notice board and target specific user groups</DialogDescription>
            </DialogHeader>

            <form onSubmit={noticeForm.handleSubmit((v) => noticeMutation.mutate(v))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ntTitle">Notice Title</Label>
                <Input id="ntTitle" {...noticeForm.register('title')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ntTarget">Target Audience</Label>
                <Select id="ntTarget" {...noticeForm.register('target')}>
                  <option value="ALL">All (Public, Students, Parents, Faculty)</option>
                  <option value="STUDENTS">Students Only</option>
                  <option value="PARENTS">Parents Only</option>
                  <option value="TEACHERS">Faculty / Teachers Only</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ntContent">Notice Content</Label>
                <textarea
                  id="ntContent"
                  rows={4}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  {...noticeForm.register('content')}
                />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="ntPin" {...noticeForm.register('isPinned')} className="rounded" />
                <Label htmlFor="ntPin" className="text-xs">Pin to top of Notice Board</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsNoticeOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={noticeMutation.isPending}>
                  {noticeMutation.isPending ? 'Publishing...' : 'Publish Notice'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal: Create Slide */}
        <Dialog open={isSlideOpen} onOpenChange={setIsSlideOpen}>
          <DialogContent onClose={() => setIsSlideOpen(false)}>
            <DialogHeader>
              <DialogTitle>Add Homepage Hero Banner Slide</DialogTitle>
              <DialogDescription>Full-width banner image, title, and call to action</DialogDescription>
            </DialogHeader>

            <form onSubmit={slideForm.handleSubmit((v) => slideMutation.mutate(v))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="slTitle">Slide Title</Label>
                <Input id="slTitle" {...slideForm.register('title')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slSub">Subtitle / Summary</Label>
                <Input id="slSub" {...slideForm.register('subtitle')} />
              </div>

              <div className="space-y-1.5">
                <ImageUpload
                  label="Slide Background Banner (Cloudinary)"
                  value={slideForm.watch('imageUrl')}
                  onChange={(url) => slideForm.setValue('imageUrl', url)}
                  onRemove={() => slideForm.setValue('imageUrl', '')}
                  folder="hero-slides"
                  aspectRatio="banner"
                  placeholderText="Upload hero banner photo to Cloudinary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="slBtn">Button Text</Label>
                  <Input id="slBtn" {...slideForm.register('buttonText')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slLnk">Button Link</Label>
                  <Input id="slLnk" {...slideForm.register('buttonLink')} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSlideOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={slideMutation.isPending}>
                  Add Hero Slide
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  );
}
