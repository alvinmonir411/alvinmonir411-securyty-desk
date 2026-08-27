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
import { Skeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  Users,
  Plus,
  Search,
  BookOpen,
  Edit2,
  Trash2,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  DollarSign,
  Eye,
} from 'lucide-react';

import { ImageUpload } from '@/components/ui/image-upload';

const createTeacherSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid institutional email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  designation: z.string().min(2, 'Designation is required'),
  department: z.string().min(2, 'Department is required'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  qualification: z.string().optional(),
  phone: z.string().optional(),
  baseSalary: z.coerce.number().optional(),
  avatarUrl: z.string().optional(),
});

type CreateTeacherFormValues = z.infer<typeof createTeacherSchema>;

export default function TeachersManagementPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  // Fetch Teachers
  const { data: teachers, isLoading, isError, refetch } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: async () => {
      const res = await apiClient.get('/teachers');
      return res.data.data || res.data;
    },
  });

  // Fetch detailed teacher profile when viewing
  const { data: teacher360, isLoading: isViewLoading } = useQuery({
    queryKey: ['teacher-details', selectedTeacher?.id],
    queryFn: async () => {
      if (!selectedTeacher?.id) return null;
      const res = await apiClient.get(`/teachers/${selectedTeacher.id}`);
      return res.data.data || res.data;
    },
    enabled: !!selectedTeacher?.id && isViewOpen,
  });

  // Create Teacher Form
  const createForm = useForm<CreateTeacherFormValues>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      designation: '',
      department: '',
      joiningDate: '',
      qualification: '',
      phone: '',
      baseSalary: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: CreateTeacherFormValues) => {
      return apiClient.post('/teachers', values);
    },
    onSuccess: () => {
      success('Teacher profile created successfully!');
      setIsCreateOpen(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['teachers-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to create teacher');
    },
  });

  // Edit Teacher Form
  const editForm = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      designation: '',
      department: '',
      qualification: '',
      phone: '',
      avatarUrl: '',
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      return apiClient.patch(`/teachers/${id}`, values);
    },
    onSuccess: () => {
      success('Teacher profile updated successfully!');
      setIsEditOpen(false);
      setSelectedTeacher(null);
      queryClient.invalidateQueries({ queryKey: ['teachers-list'] });
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to update teacher');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/teachers/${id}`);
    },
    onSuccess: () => {
      success('Teacher profile archived successfully.');
      setIsDeleteOpen(false);
      setSelectedTeacher(null);
      queryClient.invalidateQueries({ queryKey: ['teachers-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to archive teacher');
    },
  });

  const handleOpenEdit = (t: any) => {
    setSelectedTeacher(t);
    editForm.reset({
      firstName: t.firstName,
      lastName: t.lastName,
      designation: t.designation,
      department: t.department,
      qualification: t.qualification || '',
      phone: t.phone || '',
      avatarUrl: t.user?.avatarUrl || t.avatarUrl || '',
    });
    setIsEditOpen(true);
  };

  const handleOpenView = (t: any) => {
    setSelectedTeacher(t);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (t: any) => {
    setSelectedTeacher(t);
    setIsDeleteOpen(true);
  };

  // Filter teachers client-side
  const filteredTeachers = (teachers || []).filter((t: any) => {
    const matchesSearch =
      !search ||
      t.firstName.toLowerCase().includes(search.toLowerCase()) ||
      t.lastName.toLowerCase().includes(search.toLowerCase()) ||
      t.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      t.user?.email.toLowerCase().includes(search.toLowerCase());

    const matchesDept = !selectedDept || t.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set((teachers || []).map((t: any) => t.department))).filter(Boolean);

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']}>
      <div className="space-y-6">
        <PageHeader
          heading="Faculty & Teacher Directory"
          subheading="Manage academic educators, department allocations, teaching schedules, and salary structures."
        >
          <Button onClick={() => setIsCreateOpen(true)} className="shadow-md">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Faculty Member
          </Button>
        </PageHeader>

        {/* Search and Filters */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="relative sm:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by teacher name, employee ID, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div>
                <Select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                  <option value="">All Departments</option>
                  {departments.map((d: any) => (
                    <option key={d} value={d}>
                      {d} Department
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Active Teaching Faculty</CardTitle>
            <CardDescription>Showing {filteredTeachers.length} educators</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="p-8 text-center">
                <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-2" />
                <p className="text-sm font-medium text-destructive mb-3">Error fetching faculty directory.</p>
                <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <h4 className="text-sm font-semibold text-foreground">No faculty members found</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Add your first academic teacher or clear search filters.
                </p>
                <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Teacher
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Faculty Name</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Assigned Subjects</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((t: any) => (
                      <TableRow key={t.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {t.employeeId}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            {t.user?.avatarUrl ? (
                              <img
                                src={t.user.avatarUrl}
                                alt={`${t.firstName} ${t.lastName}`}
                                className="h-8 w-8 rounded-full object-cover border border-border shrink-0"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {t.firstName?.[0]}{t.lastName?.[0]}
                              </div>
                            )}
                            <div>
                              <span className="font-semibold text-foreground block">
                                {t.firstName} {t.lastName}
                              </span>
                              <p className="text-[11px] text-muted-foreground">{t.user?.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{t.designation}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{t.department}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {t.teacherSubjects?.length > 0 ? (
                            <span className="font-medium text-foreground">
                              {t.teacherSubjects.map((ts: any) => ts.subject?.name).join(', ')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">No subjects assigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">
                          {t.salaryStructure?.baseSalary ? `৳ ${Number(t.salaryStructure.baseSalary).toLocaleString()}` : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5"
                              onClick={() => handleOpenView(t)}
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Profile
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleOpenEdit(t)}
                              title="Edit Teacher"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:text-destructive"
                              onClick={() => handleOpenDelete(t)}
                              title="Archive Teacher"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 1. Add Teacher Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent onClose={() => setIsCreateOpen(false)} className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Academic Faculty Member</DialogTitle>
              <DialogDescription>
                Create educator portal account, department credentials, and monthly compensation baseline.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="tFirst">First Name</Label>
                  <Input id="tFirst" placeholder="Sarah" {...createForm.register('firstName')} />
                  {createForm.formState.errors.firstName && (
                    <p className="text-[11px] text-destructive">{createForm.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tLast">Last Name</Label>
                  <Input id="tLast" placeholder="Connor" {...createForm.register('lastName')} />
                  {createForm.formState.errors.lastName && (
                    <p className="text-[11px] text-destructive">{createForm.formState.errors.lastName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tEmail">Institutional Email</Label>
                  <Input id="tEmail" type="email" placeholder="sarah.connor@school.edu" {...createForm.register('email')} />
                  {createForm.formState.errors.email && (
                    <p className="text-[11px] text-destructive">{createForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tPassword">Temporary Password</Label>
                  <Input id="tPassword" type="text" {...createForm.register('password')} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tDesig">Designation / Title</Label>
                  <Input id="tDesig" placeholder="Senior Lecturer" {...createForm.register('designation')} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tDept">Academic Department</Label>
                  <Select id="tDept" {...createForm.register('department')}>
                    <option value="Science">Science & Physics</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Technology">Technology & Computer Science</option>
                    <option value="Languages">Languages & Literature</option>
                    <option value="Social Studies">Social Studies & Humanities</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tQual">Highest Qualification</Label>
                  <Input id="tQual" placeholder="M.Sc. in Physics, B.Ed." {...createForm.register('qualification')} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tPhone">Phone Contact</Label>
                  <Input id="tPhone" placeholder="+1-555-0188" {...createForm.register('phone')} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tSalary">Base Monthly Salary ($)</Label>
                  <Input id="tSalary" type="number" step="100" placeholder="4500" {...createForm.register('baseSalary')} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tJoin">Joining Date</Label>
                  <Input id="tJoin" type="date" {...createForm.register('joiningDate')} />
                </div>
              </div>

              <div className="space-y-1.5">
                <ImageUpload
                  label="Teacher Profile Photo (Cloudinary)"
                  value={createForm.watch('avatarUrl')}
                  onChange={(url) => createForm.setValue('avatarUrl', url)}
                  onRemove={() => createForm.setValue('avatarUrl', '')}
                  folder="teachers"
                  aspectRatio="square"
                  placeholderText="Upload educator profile photo"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Registering...' : 'Add Faculty'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 2. Edit Teacher Modal */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent onClose={() => setIsEditOpen(false)}>
            <DialogHeader>
              <DialogTitle>Edit Faculty Profile</DialogTitle>
              <DialogDescription>
                Update department designation and contact data for {selectedTeacher?.firstName} {selectedTeacher?.lastName}.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={editForm.handleSubmit((values) =>
                editMutation.mutate({ id: selectedTeacher?.id, values }),
              )}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edTFirst">First Name</Label>
                  <Input id="edTFirst" {...editForm.register('firstName')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edTLast">Last Name</Label>
                  <Input id="edTLast" {...editForm.register('lastName')} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edTDesig">Designation</Label>
                <Input id="edTDesig" {...editForm.register('designation')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edTDept">Department</Label>
                <Input id="edTDept" {...editForm.register('department')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edTQual">Qualification</Label>
                <Input id="edTQual" {...editForm.register('qualification')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edTPhone">Phone</Label>
                <Input id="edTPhone" {...editForm.register('phone')} />
              </div>

              <div className="space-y-1.5">
                <ImageUpload
                  label="Teacher Profile Photo (Cloudinary)"
                  value={editForm.watch('avatarUrl')}
                  onChange={(url) => editForm.setValue('avatarUrl', url)}
                  onRemove={() => editForm.setValue('avatarUrl', '')}
                  folder="teachers"
                  aspectRatio="square"
                  placeholderText="Upload or update educator photo"
                />
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

        {/* 3. Teacher 360 View Modal */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent onClose={() => setIsViewOpen(false)} className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Faculty Profile & Timetable</DialogTitle>
              <DialogDescription>
                {selectedTeacher?.firstName} {selectedTeacher?.lastName} ({selectedTeacher?.employeeId})
              </DialogDescription>
            </DialogHeader>

            {isViewLoading || !teacher360 ? (
              <div className="py-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 rounded-xl border p-3 bg-muted/30">
                  <div>
                    <span className="text-muted-foreground">Department:</span>
                    <p className="font-semibold text-foreground">{teacher360.department}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Designation:</span>
                    <p className="font-semibold text-foreground">{teacher360.designation}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Qualification:</span>
                    <p className="font-semibold text-foreground">{teacher360.qualification || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Base Salary:</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {teacher360.salaryStructure?.baseSalary ? `৳ ${Number(teacher360.salaryStructure.baseSalary).toLocaleString()}/month` : '—'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Weekly Teaching Schedule</h4>
                  {teacher360.routines?.length === 0 ? (
                    <p className="text-muted-foreground italic">No timetable routines assigned yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Day</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Class & Section</TableHead>
                          <TableHead>Subject</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teacher360.routines.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium text-foreground">{r.dayOfWeek}</TableCell>
                            <TableCell>{r.startTime} - {r.endTime}</TableCell>
                            <TableCell>{r.section?.class?.name} - {r.section?.name}</TableCell>
                            <TableCell className="font-semibold text-primary">{r.subject?.name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 4. Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent onClose={() => setIsDeleteOpen(false)}>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center">Archive Faculty Account?</DialogTitle>
              <DialogDescription className="text-center">
                Are you sure you want to archive <strong>{selectedTeacher?.firstName} {selectedTeacher?.lastName}</strong> ({selectedTeacher?.employeeId})?
                This will soft delete the teacher profile and deactivate their portal login credentials.
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
                onClick={() => deleteMutation.mutate(selectedTeacher?.id)}
              >
                {deleteMutation.isPending ? 'Archiving...' : 'Yes, Archive Faculty'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  );
}
