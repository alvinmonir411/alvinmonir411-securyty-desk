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
import { useToast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  BookOpen,
  Calendar,
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Users,
  Award,
  AlertTriangle,
  Search,
} from 'lucide-react';

const createYearSchema = z.object({
  name: z.string().min(4, 'Session name is required (e.g. 2026-2027)'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isCurrent: z.boolean().default(true),
});

const createClassSchema = z.object({
  name: z.string().min(2, 'Class name is required (e.g. Class 10)'),
  code: z.string().min(1, 'Unique class code is required (e.g. C10)'),
  numericOrder: z.coerce.number().min(1),
  description: z.string().optional(),
});

const createSectionSchema = z.object({
  classId: z.string().min(1, 'Please select a parent class'),
  name: z.string().min(1, 'Section name is required (e.g. Section A)'),
  capacity: z.coerce.number().default(40),
});

const createSubjectSchema = z.object({
  name: z.string().min(2, 'Subject name is required'),
  code: z.string().min(2, 'Subject code is required (e.g. MATH-10)'),
  creditHours: z.coerce.number().default(1.0),
  totalMarks: z.coerce.number().default(100.0),
  passMarks: z.coerce.number().default(33.0),
  classId: z.string().optional(),
});

export default function AcademicsManagementPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  // Modals state (Create)
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(false);
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);

  // Modals state (Edit)
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);

  const [isEditSectionOpen, setIsEditSectionOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);

  const [isEditSubjectOpen, setIsEditSubjectOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);

  // Modals state (Delete Confirmation)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'class' | 'section' | 'subject';
    id: string;
    name: string;
  } | null>(null);

  // Search filter
  const [searchClass, setSearchClass] = useState('');
  const [searchSection, setSearchSection] = useState('');
  const [searchSubject, setSearchSubject] = useState('');

  // Queries
  const { data: years, isLoading: yearsLoading } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/years');
      return res.data.data || res.data;
    },
  });

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['academic-classes'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/classes');
      return res.data.data || res.data;
    },
  });

  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['academic-sections'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/sections');
      return res.data.data || res.data;
    },
  });

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['academic-subjects'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/subjects');
      return res.data.data || res.data;
    },
  });

  // Forms (Create)
  const yearForm = useForm({
    resolver: zodResolver(createYearSchema),
    defaultValues: { name: '2027-2028', startDate: '2027-01-01', endDate: '2027-12-31', isCurrent: false },
  });

  const classForm = useForm({
    resolver: zodResolver(createClassSchema),
    defaultValues: { name: '', code: '', numericOrder: 1, description: '' },
  });

  const sectionForm = useForm({
    resolver: zodResolver(createSectionSchema),
    defaultValues: { classId: '', name: 'Section A', capacity: 40 },
  });

  const subjectForm = useForm({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: { name: '', code: '', creditHours: 3.0, totalMarks: 100, passMarks: 33, classId: '' },
  });

  // Forms (Edit)
  const editClassForm = useForm({
    resolver: zodResolver(createClassSchema),
    defaultValues: { name: '', code: '', numericOrder: 1, description: '' },
  });

  const editSectionForm = useForm({
    resolver: zodResolver(z.object({ name: z.string().min(1), capacity: z.coerce.number().default(40) })),
    defaultValues: { name: '', capacity: 40 },
  });

  const editSubjectForm = useForm({
    resolver: zodResolver(z.object({
      name: z.string().min(2),
      code: z.string().min(1),
      totalMarks: z.coerce.number().default(100),
      passMarks: z.coerce.number().default(33),
    })),
    defaultValues: { name: '', code: '', totalMarks: 100, passMarks: 33 },
  });

  // ---------------- MUTATIONS ---------------- //

  // Class Mutations
  const createClassMutation = useMutation({
    mutationFn: (values: any) => apiClient.post('/academics/classes', values),
    onSuccess: () => {
      success('নতুন শ্রেণী সফলভাবে তৈরি করা হয়েছে!');
      setIsClassOpen(false);
      classForm.reset();
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
      queryClient.invalidateQueries({ queryKey: ['classes-list'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'শ্রেণী তৈরি করতে ব্যর্থ হয়েছে'),
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: any }) =>
      apiClient.patch(`/academics/classes/${id}`, values),
    onSuccess: () => {
      success('শ্রেণী সফলভাবে আপডেট করা হয়েছে!');
      setIsEditClassOpen(false);
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
      queryClient.invalidateQueries({ queryKey: ['classes-list'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'শ্রেণী আপডেট করতে ব্যর্থ হয়েছে'),
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/academics/classes/${id}`),
    onSuccess: () => {
      success('শ্রেণী সফলভাবে মুছে ফেলা হয়েছে!');
      setDeleteConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
      queryClient.invalidateQueries({ queryKey: ['classes-list'] });
      queryClient.invalidateQueries({ queryKey: ['academic-sections'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'শ্রেণী মুছতে ব্যর্থ হয়েছে (অধীনস্থ সেকশন বা শিক্ষার্থী থাকতে পারে)'),
  });

  // Section Mutations
  const createSectionMutation = useMutation({
    mutationFn: (values: any) => apiClient.post('/academics/sections', values),
    onSuccess: () => {
      success('সেকশন তৈরি করা হয়েছে!');
      setIsSectionOpen(false);
      sectionForm.reset();
      queryClient.invalidateQueries({ queryKey: ['academic-sections'] });
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'সেকশন তৈরি করতে ব্যর্থ হয়েছে'),
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: any }) =>
      apiClient.patch(`/academics/sections/${id}`, values),
    onSuccess: () => {
      success('সেকশন আপডেট করা হয়েছে!');
      setIsEditSectionOpen(false);
      queryClient.invalidateQueries({ queryKey: ['academic-sections'] });
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'সেকশন আপডেট করতে ব্যর্থ হয়েছে'),
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/academics/sections/${id}`),
    onSuccess: () => {
      success('সেকশন মুছে ফেলা হয়েছে!');
      setDeleteConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['academic-sections'] });
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'সেকশন মুছতে ব্যর্থ হয়েছে'),
  });

  // Subject Mutations
  const createSubjectMutation = useMutation({
    mutationFn: (values: any) => apiClient.post('/academics/subjects', values),
    onSuccess: () => {
      success('পাঠ্যবিষয় তৈরি করা হয়েছে!');
      setIsSubjectOpen(false);
      subjectForm.reset();
      queryClient.invalidateQueries({ queryKey: ['academic-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'বিষয় তৈরি করতে ব্যর্থ হয়েছে'),
  });

  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: any }) =>
      apiClient.patch(`/academics/subjects/${id}`, values),
    onSuccess: () => {
      success('পাঠ্যবিষয় আপডেট করা হয়েছে!');
      setIsEditSubjectOpen(false);
      queryClient.invalidateQueries({ queryKey: ['academic-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'বিষয় আপডেট করতে ব্যর্থ হয়েছে'),
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/academics/subjects/${id}`),
    onSuccess: () => {
      success('পাঠ্যবিষয় মুছে ফেলা হয়েছে!');
      setDeleteConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['academic-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'বিষয় মুছতে ব্যর্থ হয়েছে'),
  });

  // Year Mutation
  const createYearMutation = useMutation({
    mutationFn: (values: any) => apiClient.post('/academics/years', values),
    onSuccess: () => {
      success('শিক্ষাবর্ষ সেশন তৈরি করা হয়েছে!');
      setIsYearOpen(false);
      yearForm.reset();
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'শিক্ষাবর্ষ তৈরি করতে ব্যর্থ হয়েছে'),
  });

  // Handlers for Edit
  const handleOpenEditClass = (cls: any) => {
    setEditingClass(cls);
    editClassForm.reset({
      name: cls.name,
      code: cls.code,
      numericOrder: cls.numericOrder ?? 1,
      description: cls.description || '',
    });
    setIsEditClassOpen(true);
  };

  const handleOpenEditSection = (sec: any) => {
    setEditingSection(sec);
    editSectionForm.reset({
      name: sec.name,
      capacity: sec.capacity ?? 40,
    });
    setIsEditSectionOpen(true);
  };

  const handleOpenEditSubject = (sub: any) => {
    setEditingSubject(sub);
    editSubjectForm.reset({
      name: sub.name,
      code: sub.code,
      totalMarks: sub.totalMarks ?? 100,
      passMarks: sub.passMarks ?? 33,
    });
    setIsEditSubjectOpen(true);
  };

  // Filtered lists
  const filteredClasses = (classes || []).filter((c: any) =>
    !searchClass ||
    c.name.toLowerCase().includes(searchClass.toLowerCase()) ||
    c.code.toLowerCase().includes(searchClass.toLowerCase()),
  );

  const filteredSections = (sections || []).filter((s: any) =>
    !searchSection ||
    s.name.toLowerCase().includes(searchSection.toLowerCase()) ||
    s.class?.name?.toLowerCase().includes(searchSection.toLowerCase()),
  );

  const filteredSubjects = (subjects || []).filter((sub: any) =>
    !searchSubject ||
    sub.name.toLowerCase().includes(searchSubject.toLowerCase()) ||
    sub.code.toLowerCase().includes(searchSubject.toLowerCase()),
  );

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']}>
      <div className="space-y-6">
        <PageHeader
          heading="শ্রেণী, সেকশন ও পাঠ্যক্রম ব্যবস্থাপনা (Classes & Academics)"
          subheading="বিদ্যালয়ের শ্রেণী (Classes), শাখা (Sections), বিষয়সমূহ (Subjects) ও শিক্ষাবর্ষ যোগ, পরিবর্তন বা মুছে ফেলুন।"
        />

        <Tabs defaultValue="classes" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1.5 gap-1">
            <TabsTrigger value="classes">শ্রেণী তালিকা (Classes)</TabsTrigger>
            <TabsTrigger value="sections">শাখা / সেকশন (Sections)</TabsTrigger>
            <TabsTrigger value="subjects">পাঠ্য বিষয় (Subjects)</TabsTrigger>
            <TabsTrigger value="years">শিক্ষাবর্ষ / সেশন (Sessions)</TabsTrigger>
          </TabsList>

          {/* TAB 1: CLASSES */}
          <TabsContent value="classes">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">বিদ্যালয়ের শ্রেণী তালিকা (Classes & Grades)</CardTitle>
                  <CardDescription>মোট {filteredClasses.length} টি শ্রেণী কনফিগার করা আছে</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-48 sm:w-60">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="শ্রেণী খুঁজুন..."
                      value={searchClass}
                      onChange={(e) => setSearchClass(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                  <Button size="sm" onClick={() => setIsClassOpen(true)} className="h-8 gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    নতুন শ্রেণী যোগ করুন
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {classesLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : filteredClasses.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-xs">
                    কোনো শ্রেণী পাওয়া যায়নি
                  </div>
                ) : (
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead>ক্রমিক (Order)</TableHead>
                        <TableHead>শ্রেণীর নাম (Class Name)</TableHead>
                        <TableHead>কোড (Code)</TableHead>
                        <TableHead>শাখাসমূহ (Sections)</TableHead>
                        <TableHead>ম্যাপকৃত বিষয় (Subjects)</TableHead>
                        <TableHead className="text-right">অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClasses.map((c: any) => (
                        <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="font-mono font-bold text-primary">{c.numericOrder}</TableCell>
                          <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                          <TableCell className="font-mono">{c.code}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {c.sections && c.sections.length > 0 ? (
                                c.sections.map((s: any) => (
                                  <Badge key={s.id} variant="outline" className="text-[10px]">
                                    সেকশন {s.name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-[11px]">কোনো সেকশন নেই</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-medium">
                              {c.classSubjects?.length || 0} টি বিষয়
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px] gap-1"
                                onClick={() => handleOpenEditClass(c)}
                              >
                                <Edit2 className="h-3 w-3" /> এডিট
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: 'class',
                                    id: c.id,
                                    name: c.name,
                                  })
                                }
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: SECTIONS */}
          <TabsContent value="sections">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">শাখা / সেকশন তালিকা (Sections)</CardTitle>
                  <CardDescription>শ্রেণীভিত্তিক সেকশন ও ধারণক্ষমতা</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-48 sm:w-60">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="সেকশন খুঁজুন..."
                      value={searchSection}
                      onChange={(e) => setSearchSection(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                  <Button size="sm" onClick={() => setIsSectionOpen(true)} className="h-8 gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    নতুন সেকশন যোগ করুন
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {sectionsLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : filteredSections.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-xs">
                    কোনো সেকশন পাওয়া যায়নি
                  </div>
                ) : (
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead>মূল শ্রেণী (Class)</TableHead>
                        <TableHead>সেকশনের নাম</TableHead>
                        <TableHead>ধারণক্ষমতা (Capacity)</TableHead>
                        <TableHead className="text-right">অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSections.map((s: any) => (
                        <TableRow key={s.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="font-semibold text-foreground">
                            {s.class?.name} ({s.class?.code})
                          </TableCell>
                          <TableCell className="font-medium text-primary">সেকশন {s.name}</TableCell>
                          <TableCell>{s.capacity} জন শিক্ষার্থী</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px] gap-1"
                                onClick={() => handleOpenEditSection(s)}
                              >
                                <Edit2 className="h-3 w-3" /> এডিট
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: 'section',
                                    id: s.id,
                                    name: `${s.class?.name} - সেকশন ${s.name}`,
                                  })
                                }
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: SUBJECTS */}
          <TabsContent value="subjects">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">পাঠ্য বিষয় তালিকা (Subjects)</CardTitle>
                  <CardDescription>কারিকুলাম বিষয়, পূর্ণমান ও পাশ নম্বর</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-48 sm:w-60">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="বিষয় খুঁজুন..."
                      value={searchSubject}
                      onChange={(e) => setSearchSubject(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                  <Button size="sm" onClick={() => setIsSubjectOpen(true)} className="h-8 gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    নতুন বিষয় তৈরি করুন
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {subjectsLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : filteredSubjects.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-xs">
                    কোনো বিষয় পাওয়া যায়নি
                  </div>
                ) : (
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead>বিষয় কোড</TableHead>
                        <TableHead>বিষয়ের নাম</TableHead>
                        <TableHead>মোট নম্বর (Full Marks)</TableHead>
                        <TableHead>পাশ নম্বর (Pass Marks)</TableHead>
                        <TableHead className="text-right">অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubjects.map((sub: any) => (
                        <TableRow key={sub.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="font-mono font-bold text-primary">{sub.code}</TableCell>
                          <TableCell className="font-medium text-foreground">{sub.name}</TableCell>
                          <TableCell className="font-mono">{sub.totalMarks}</TableCell>
                          <TableCell className="font-semibold text-rose-600 dark:text-rose-400 font-mono">
                            {sub.passMarks}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px] gap-1"
                                onClick={() => handleOpenEditSubject(sub)}
                              >
                                <Edit2 className="h-3 w-3" /> এডিট
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: 'subject',
                                    id: sub.id,
                                    name: sub.name,
                                  })
                                }
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: ACADEMIC YEARS */}
          <TabsContent value="years">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">শিক্ষাবর্ষ ও সেশন (Academic Sessions)</CardTitle>
                  <CardDescription>সক্রিয় শিক্ষাবর্ষ ও পূর্ববর্তী সেশনসমূহ</CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsYearOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  নতুন শিক্ষাবর্ষ যোগ
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {yearsLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead>সেশনের নাম</TableHead>
                        <TableHead>শুরুর তারিখ</TableHead>
                        <TableHead>সমাপ্তি তারিখ</TableHead>
                        <TableHead>বর্তমান স্ট্যাটাস</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {years?.map((y: any) => (
                        <TableRow key={y.id}>
                          <TableCell className="font-bold text-foreground">{y.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {new Date(y.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {new Date(y.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={y.isCurrent ? 'success' : 'default'}>
                              {y.isCurrent ? 'ACTIVE CURRENT' : 'ARCHIVED'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ---------------- MODALS: CREATE ---------------- */}

        {/* 1. Modal: Create Class */}
        <Dialog open={isClassOpen} onOpenChange={setIsClassOpen}>
          <DialogContent onClose={() => setIsClassOpen(false)}>
            <DialogHeader>
              <DialogTitle>নতুন শ্রেণী যোগ করুন (Add Class)</DialogTitle>
              <DialogDescription>বিদ্যালয়ের জন্য নতুন শ্রেণী বা গ্রেড লেভেল তৈরি করুন</DialogDescription>
            </DialogHeader>
            <form onSubmit={classForm.handleSubmit((v) => createClassMutation.mutate(v))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cName">শ্রেণীর নাম (যেমন: Class 1, Class 10, ইত্যাদি)</Label>
                <Input id="cName" placeholder="Class 10" {...classForm.register('name')} />
                {classForm.formState.errors.name && (
                  <p className="text-[11px] text-destructive">{classForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cCode">শ্রেণী কোড (Code)</Label>
                  <Input id="cCode" placeholder="C10" {...classForm.register('code')} />
                  {classForm.formState.errors.code && (
                    <p className="text-[11px] text-destructive">{classForm.formState.errors.code.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cOrder">ক্রমিক সংখ্যা (Numeric Order)</Label>
                  <Input id="cOrder" type="number" {...classForm.register('numericOrder')} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsClassOpen(false)}>
                  বাতিল
                </Button>
                <Button type="submit" disabled={createClassMutation.isPending}>
                  {createClassMutation.isPending ? 'তৈরি হচ্ছে...' : 'শ্রেণী তৈরি করুন'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 2. Modal: Edit Class */}
        <Dialog open={isEditClassOpen} onOpenChange={setIsEditClassOpen}>
          <DialogContent onClose={() => setIsEditClassOpen(false)}>
            <DialogHeader>
              <DialogTitle>শ্রেণী পরিবর্তন করুন (Edit Class)</DialogTitle>
              <DialogDescription>{editingClass?.name} এর তথ্য সংশোধন করুন</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={editClassForm.handleSubmit((values) =>
                updateClassMutation.mutate({ id: editingClass?.id, values }),
              )}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="ecName">শ্রেণীর নাম (Class Name)</Label>
                <Input id="ecName" {...editClassForm.register('name')} />
                {editClassForm.formState.errors.name && (
                  <p className="text-[11px] text-destructive">{editClassForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ecCode">শ্রেণী কোড (Code)</Label>
                  <Input id="ecCode" {...editClassForm.register('code')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ecOrder">ক্রমিক সংখ্যা (Numeric Order)</Label>
                  <Input id="ecOrder" type="number" {...editClassForm.register('numericOrder')} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditClassOpen(false)}>
                  বাতিল
                </Button>
                <Button type="submit" disabled={updateClassMutation.isPending}>
                  {updateClassMutation.isPending ? 'আপডেট হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 3. Modal: Create Section */}
        <Dialog open={isSectionOpen} onOpenChange={setIsSectionOpen}>
          <DialogContent onClose={() => setIsSectionOpen(false)}>
            <DialogHeader>
              <DialogTitle>নতুন সেকশন যোগ করুন (Add Section)</DialogTitle>
              <DialogDescription>শ্রেণীর অধীনে শাখা তৈরি করুন</DialogDescription>
            </DialogHeader>
            <form onSubmit={sectionForm.handleSubmit((v) => createSectionMutation.mutate(v))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="secClass">মূল শ্রেণী নির্বাচন করুন</Label>
                <Select id="secClass" {...sectionForm.register('classId')}>
                  <option value="">-- শ্রেণী বেছে নিন --</option>
                  {classes?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="secName">সেকশনের নাম (যেমন: A, B, Padma, ইত্যাদি)</Label>
                <Input id="secName" placeholder="A" {...sectionForm.register('name')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="secCap">সর্বোচ্চ ধারণক্ষমতা (Student Capacity)</Label>
                <Input id="secCap" type="number" placeholder="40" {...sectionForm.register('capacity')} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSectionOpen(false)}>
                  বাতিল
                </Button>
                <Button type="submit" disabled={createSectionMutation.isPending}>
                  {createSectionMutation.isPending ? 'তৈরি হচ্ছে...' : 'সেকশন তৈরি করুন'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 4. Modal: Edit Section */}
        <Dialog open={isEditSectionOpen} onOpenChange={setIsEditSectionOpen}>
          <DialogContent onClose={() => setIsEditSectionOpen(false)}>
            <DialogHeader>
              <DialogTitle>সেকশন এডিট করুন (Edit Section)</DialogTitle>
              <DialogDescription>সেকশন নাম ও ধারণক্ষমতা সংশোধন করুন</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={editSectionForm.handleSubmit((values) =>
                updateSectionMutation.mutate({ id: editingSection?.id, values }),
              )}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="esName">সেকশন নাম</Label>
                <Input id="esName" {...editSectionForm.register('name')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="esCap">ধারণক্ষমতা (Capacity)</Label>
                <Input id="esCap" type="number" {...editSectionForm.register('capacity')} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditSectionOpen(false)}>
                  বাতিল
                </Button>
                <Button type="submit" disabled={updateSectionMutation.isPending}>
                  সংরক্ষণ করুন
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 5. Modal: Create Subject */}
        <Dialog open={isSubjectOpen} onOpenChange={setIsSubjectOpen}>
          <DialogContent onClose={() => setIsSubjectOpen(false)}>
            <DialogHeader>
              <DialogTitle>নতুন পাঠ্যবিষয় যোগ করুন (Add Subject)</DialogTitle>
              <DialogDescription>কারিকুলামে নতুন বিষয়ের নাম, কোড ও নম্বর বণ্টন নির্ধারণ করুন</DialogDescription>
            </DialogHeader>
            <form onSubmit={subjectForm.handleSubmit((v) => createSubjectMutation.mutate(v))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subName">বিষয়ের নাম (Subject Name)</Label>
                <Input id="subName" placeholder="যেমন: সাধারণ গণিত" {...subjectForm.register('name')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="subCode">বিষয় কোড (Code)</Label>
                  <Input id="subCode" placeholder="MATH-10" {...subjectForm.register('code')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subTotal">পূর্ণমান (Total Marks)</Label>
                  <Input id="subTotal" type="number" {...subjectForm.register('totalMarks')} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subPass">পাশ নম্বর (Pass Marks)</Label>
                <Input id="subPass" type="number" {...subjectForm.register('passMarks')} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSubjectOpen(false)}>
                  বাতিল
                </Button>
                <Button type="submit" disabled={createSubjectMutation.isPending}>
                  {createSubjectMutation.isPending ? 'তৈরি হচ্ছে...' : 'বিষয় তৈরি করুন'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 6. Modal: Edit Subject */}
        <Dialog open={isEditSubjectOpen} onOpenChange={setIsEditSubjectOpen}>
          <DialogContent onClose={() => setIsEditSubjectOpen(false)}>
            <DialogHeader>
              <DialogTitle>বিষয় এডিট করুন (Edit Subject)</DialogTitle>
              <DialogDescription>বিষয়ের নাম, কোড ও নম্বর সংশোধন করুন</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={editSubjectForm.handleSubmit((values) =>
                updateSubjectMutation.mutate({ id: editingSubject?.id, values }),
              )}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="esubName">বিষয়ের নাম</Label>
                <Input id="esubName" {...editSubjectForm.register('name')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="esubCode">বিষয় কোড</Label>
                  <Input id="esubCode" {...editSubjectForm.register('code')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="esubTotal">পূর্ণমান (Total)</Label>
                  <Input id="esubTotal" type="number" {...editSubjectForm.register('totalMarks')} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="esubPass">পাশ নম্বর</Label>
                <Input id="esubPass" type="number" {...editSubjectForm.register('passMarks')} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditSubjectOpen(false)}>
                  বাতিল
                </Button>
                <Button type="submit" disabled={updateSubjectMutation.isPending}>
                  সংরক্ষণ করুন
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 7. Modal: Create Session Year */}
        <Dialog open={isYearOpen} onOpenChange={setIsYearOpen}>
          <DialogContent onClose={() => setIsYearOpen(false)}>
            <DialogHeader>
              <DialogTitle>নতুন শিক্ষাবর্ষ তৈরি করুন (Academic Session)</DialogTitle>
              <DialogDescription>যেমন: 2026-2027</DialogDescription>
            </DialogHeader>
            <form onSubmit={yearForm.handleSubmit((v) => createYearMutation.mutate(v))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="yName">সেশনের নাম</Label>
                <Input id="yName" placeholder="2027-2028" {...yearForm.register('name')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="yStart">শুরুর তারিখ</Label>
                  <Input id="yStart" type="date" {...yearForm.register('startDate')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="yEnd">সমাপ্তি তারিখ</Label>
                  <Input id="yEnd" type="date" {...yearForm.register('endDate')} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsYearOpen(false)}>
                  বাতিল
                </Button>
                <Button type="submit" disabled={createYearMutation.isPending}>
                  সংরক্ষণ করুন
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 8. Modal: Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent onClose={() => setDeleteConfirm(null)}>
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> নিশ্চিতকরণ প্রয়োজন (Delete Confirmation)
              </DialogTitle>
              <DialogDescription>
                আপনি কি নিশ্চিতভাবে <strong>{deleteConfirm?.name}</strong> মুছে ফেলতে চান? এটি মুছে ফেলা হলে এর সাথে সংশ্লিষ্ট সকল ডাটা স্থায়ীভাবে মুছে যেতে পারে।
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                বাতিল করুন
              </Button>
              <Button
                variant="destructive"
                disabled={
                  deleteClassMutation.isPending ||
                  deleteSectionMutation.isPending ||
                  deleteSubjectMutation.isPending
                }
                onClick={() => {
                  if (!deleteConfirm) return;
                  if (deleteConfirm.type === 'class') {
                    deleteClassMutation.mutate(deleteConfirm.id);
                  } else if (deleteConfirm.type === 'section') {
                    deleteSectionMutation.mutate(deleteConfirm.id);
                  } else if (deleteConfirm.type === 'subject') {
                    deleteSubjectMutation.mutate(deleteConfirm.id);
                  }
                }}
              >
                হ্যাঁ, মুছে ফেলুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  );
}
