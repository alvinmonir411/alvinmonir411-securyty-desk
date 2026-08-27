'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  UserCheck,
  Phone,
  Calendar,
  Layers,
} from 'lucide-react';

import { ImageUpload } from '@/components/ui/image-upload';

const createStudentSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid institutional email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().min(7, 'Emergency contact is required'),
  presentAddress: z.string().optional(),
  sectionId: z.string().min(1, 'Section is required — please select a class and section'),
  rollNumber: z.coerce.number().optional(),
  avatarUrl: z.string().optional(),
});

type CreateStudentFormValues = z.infer<typeof createStudentSchema>;

export default function StudentsManagementPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Modal-specific class selection (separate from filter)
  const [modalClassId, setModalClassId] = useState('');

  // Fetch Classes for filter and creation dropdown
  const { data: classesData } = useQuery({
    queryKey: ['classes-list'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/classes');
      return res.data.data || res.data;
    },
  });

  // Fetch Sections for dropdown
  const { data: sectionsData } = useQuery({
    queryKey: ['sections-list'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/sections');
      return res.data.data || res.data;
    },
  });

  // Fetch Students with TanStack Query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['students', page, search, selectedClass, selectedSection, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedSection) params.append('sectionId', selectedSection);
      if (selectedStatus) params.append('status', selectedStatus);

      const res = await apiClient.get(`/students?${params.toString()}`);
      return res.data;
    },
  });

  // Create Student Mutation
  const createForm = useForm<CreateStudentFormValues>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      dateOfBirth: '',
      gender: 'MALE',
      bloodGroup: 'O_POSITIVE',
      emergencyContact: '',
      presentAddress: '',
      rollNumber: 1,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: CreateStudentFormValues) => {
      return apiClient.post('/students', values);
    },
    onSuccess: () => {
      success('Student registered successfully!');
      setIsCreateOpen(false);
      createForm.reset();
      setModalClassId(''); // reset modal class selection
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to create student');
    },
  });

  // Delete / Archive Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/students/${id}`);
    },
    onSuccess: () => {
      success('Student profile archived successfully.');
      setIsDeleteOpen(false);
      setSelectedStudent(null);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to archive student');
    },
  });

  // Edit Mutation
  const editForm = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      emergencyContact: '',
      presentAddress: '',
      status: 'ACTIVE',
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      return apiClient.patch(`/students/${id}`, values);
    },
    onSuccess: () => {
      success('Student profile updated successfully!');
      setIsEditOpen(false);
      setSelectedStudent(null);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to update student');
    },
  });

  const handleOpenEdit = (student: any) => {
    setSelectedStudent(student);
    editForm.reset({
      firstName: student.firstName,
      lastName: student.lastName,
      emergencyContact: student.emergencyContact || '',
      presentAddress: student.presentAddress || '',
      status: student.status,
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (student: any) => {
    setSelectedStudent(student);
    setIsDeleteOpen(true);
  };

  const studentsList = Array.isArray(data) ? data : (data?.data || []);
  const meta = data?.meta || { totalPages: 1, totalItems: studentsList.length };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'TEACHER', 'ACCOUNTANT']}>
      <div className="space-y-6">
        <PageHeader
          heading="Student Information System"
          subheading="Directory of enrolled learners, enrollment classes, attendance, and student 360 profiles."
        >
          <Button onClick={() => setIsCreateOpen(true)} className="shadow-md">
            <Plus className="mr-1.5 h-4 w-4" />
            Register Student
          </Button>
        </PageHeader>

        {/* Filters and Search Bar */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or admission no..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>

              <div>
                <Select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Classes / Grades</option>
                  {classesData?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Select
                  value={selectedSection}
                  onChange={(e) => {
                    setSelectedSection(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Sections</option>
                  {sectionsData?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.class?.name ? `${s.class.name} - ` : ''}{s.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="GRADUATED">GRADUATED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="TRANSFERRED">TRANSFERRED</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Enrolled Students</CardTitle>
              <CardDescription>
                Showing {studentsList.length} of {meta.totalItems} learners
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
                <p className="text-sm font-medium text-destructive mb-3">Error fetching student records.</p>
                <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
              </div>
            ) : studentsList.length === 0 ? (
              <div className="p-12 text-center">
                <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <h4 className="text-sm font-semibold text-foreground">No students found</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  No records match your search filters or no students are enrolled yet.
                </p>
                <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Admit First Student
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admission No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Grade & Section</TableHead>
                      <TableHead>Roll</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsList.map((st: any) => {
                      const activeEnrollment = st.enrollments?.[0];
                      return (
                        <TableRow key={st.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-xs font-semibold text-primary">
                            {st.admissionNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-semibold text-foreground">
                                {st.firstName} {st.lastName}
                              </span>
                              <p className="text-[11px] text-muted-foreground">{st.user?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {activeEnrollment?.section ? (
                              <span className="text-xs font-medium">
                                {activeEnrollment.section.class?.name || 'Class'} — {activeEnrollment.section.name}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Not enrolled</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {activeEnrollment?.rollNumber ?? '—'}
                          </TableCell>
                          <TableCell className="text-xs">{st.gender}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                st.status === 'ACTIVE'
                                  ? 'success'
                                  : st.status === 'GRADUATED'
                                  ? 'default'
                                  : 'destructive'
                              }
                            >
                              {st.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link href={`/admin/students/${st.id}`}>
                                <Button size="sm" variant="outline" className="h-8 px-2.5" title="Student 360 View">
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  360° Profile
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleOpenEdit(st)}
                                title="Edit Student"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:text-destructive"
                                onClick={() => handleOpenDelete(st)}
                                title="Archive Student"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-6 py-3">
                <span className="text-xs text-muted-foreground">
                  Page {meta.page} of {meta.totalPages} ({meta.totalItems} total)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={meta.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 1. Register New Student Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent onClose={() => setIsCreateOpen(false)} className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Register New Student</DialogTitle>
              <DialogDescription>
                Create student authentication credentials, profile data, and initial class enrollment.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="Alex" {...createForm.register('firstName')} />
                  {createForm.formState.errors.firstName && (
                    <p className="text-[11px] text-destructive">{createForm.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Johnson" {...createForm.register('lastName')} />
                  {createForm.formState.errors.lastName && (
                    <p className="text-[11px] text-destructive">{createForm.formState.errors.lastName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Portal Email Address</Label>
                  <Input id="email" type="email" placeholder="student@school.edu" {...createForm.register('email')} />
                  {createForm.formState.errors.email && (
                    <p className="text-[11px] text-destructive">{createForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Temporary Password</Label>
                  <Input id="password" type="text" {...createForm.register('password')} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input id="dateOfBirth" type="date" {...createForm.register('dateOfBirth')} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gender">Gender</Label>
                  <Select id="gender" {...createForm.register('gender')}>
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                    <option value="OTHER">OTHER</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="emergencyContact">Emergency Contact Phone</Label>
                  <Input id="emergencyContact" placeholder="+1-555-0199" {...createForm.register('emergencyContact')} />
                  {createForm.formState.errors.emergencyContact && (
                    <p className="text-[11px] text-destructive">{createForm.formState.errors.emergencyContact.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select id="bloodGroup" {...createForm.register('bloodGroup')}>
                    <option value="O_POSITIVE">O+</option>
                    <option value="A_POSITIVE">A+</option>
                    <option value="B_POSITIVE">B+</option>
                    <option value="AB_POSITIVE">AB+</option>
                    <option value="O_NEGATIVE">O-</option>
                    <option value="A_NEGATIVE">A-</option>
                    <option value="B_NEGATIVE">B-</option>
                    <option value="AB_NEGATIVE">AB-</option>
                  </Select>
                </div>

                {/* Class Selector */}
                <div className="space-y-1.5">
                  <Label htmlFor="modalClassId">
                    শ্রেণী (Class) <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    id="modalClassId"
                    value={modalClassId}
                    onChange={(e) => {
                      setModalClassId(e.target.value);
                      createForm.setValue('sectionId', ''); // reset section when class changes
                    }}
                  >
                    <option value="">-- শ্রেণী বেছে নিন --</option>
                    {classesData
                      ?.slice()
                      .sort((a: any, b: any) => (a.numericOrder ?? 0) - (b.numericOrder ?? 0))
                      .map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                  </Select>
                </div>

                {/* Section Selector — filtered by selected class */}
                <div className="space-y-1.5">
                  <Label htmlFor="sectionId">
                    সেকশন (Section) <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    id="sectionId"
                    {...createForm.register('sectionId')}
                    disabled={!modalClassId}
                  >
                    <option value="">
                      {modalClassId ? '-- সেকশন বেছে নিন --' : '← আগে শ্রেণী বেছে নিন'}
                    </option>
                    {sectionsData
                      ?.filter((s: any) => s.classId === modalClassId || s.class?.id === modalClassId)
                      .map((s: any) => (
                        <option key={s.id} value={s.id}>
                          সেকশন {s.name}
                        </option>
                      ))}
                  </Select>
                  {createForm.formState.errors.sectionId && (
                    <p className="text-[11px] text-destructive">{createForm.formState.errors.sectionId.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rollNumber">Class Roll Number</Label>
                  <Input id="rollNumber" type="number" placeholder="1" {...createForm.register('rollNumber')} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="presentAddress">Residential Address</Label>
                <Input id="presentAddress" placeholder="123 Main St, Springfield" {...createForm.register('presentAddress')} />
              </div>

              <div className="space-y-1.5">
                <ImageUpload
                  label="Student Profile Photo (Cloudinary)"
                  value={createForm.watch('avatarUrl')}
                  onChange={(url) => createForm.setValue('avatarUrl', url)}
                  onRemove={() => createForm.setValue('avatarUrl', '')}
                  folder="students"
                  aspectRatio="square"
                  placeholderText="Upload student profile picture"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Registering...' : 'Register Student'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 2. Edit Student Modal */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent onClose={() => setIsEditOpen(false)}>
            <DialogHeader>
              <DialogTitle>Edit Student Profile</DialogTitle>
              <DialogDescription>
                Update demographic details and status for {selectedStudent?.firstName} {selectedStudent?.lastName}.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={editForm.handleSubmit((values) =>
                editMutation.mutate({ id: selectedStudent?.id, values }),
              )}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input id="editFirstName" {...editForm.register('firstName')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input id="editLastName" {...editForm.register('lastName')} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editEmergency">Emergency Contact</Label>
                <Input id="editEmergency" {...editForm.register('emergencyContact')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editAddress">Present Address</Label>
                <Input id="editAddress" {...editForm.register('presentAddress')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editStatus">Academic Status</Label>
                <Select id="editStatus" {...editForm.register('status')}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="GRADUATED">GRADUATED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="TRANSFERRED">TRANSFERRED</option>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editMutation.isPending}>
                  {editMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 3. Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent onClose={() => setIsDeleteOpen(false)}>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center">Archive Student Record?</DialogTitle>
              <DialogDescription className="text-center">
                Are you sure you want to archive student{' '}
                <strong>{selectedStudent?.firstName} {selectedStudent?.lastName}</strong> ({selectedStudent?.admissionNumber})?
                This performs a soft delete and deactivates the login credentials.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="sm:justify-center">
              <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(selectedStudent?.id)}
              >
                {deleteMutation.isPending ? 'Archiving...' : 'Yes, Archive Student'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  );
}
