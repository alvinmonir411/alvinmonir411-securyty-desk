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
  Phone,
  Mail,
  GraduationCap,
  Link as LinkIcon,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const createParentSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(7, 'Phone number is required'),
  occupation: z.string().optional(),
  address: z.string().optional(),
});

type CreateParentValues = z.infer<typeof createParentSchema>;

export default function ParentsManagementPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<any>(null);

  // Queries
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['parents-list', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.append('search', search);
      const res = await apiClient.get(`/parents?${params.toString()}`);
      return res.data.data || res.data;
    },
  });

  const { data: studentsData } = useQuery({
    queryKey: ['all-students-dropdown'],
    queryFn: async () => {
      const res = await apiClient.get('/students?limit=100');
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isLinkOpen,
  });

  // Forms
  const createForm = useForm<CreateParentValues>({
    resolver: zodResolver(createParentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      occupation: '',
      address: '',
    },
  });

  const linkForm = useForm({
    defaultValues: {
      studentId: '',
      relation: 'FATHER',
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (values: CreateParentValues) => apiClient.post('/parents', values),
    onSuccess: () => {
      success('Parent account registered successfully!');
      setIsCreateOpen(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['parents-list'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to create parent'),
  });

  const linkMutation = useMutation({
    mutationFn: (values: any) =>
      apiClient.post('/parents/link-student', {
        ...values,
        parentId: selectedParent?.id,
      }),
    onSuccess: () => {
      success('Student ward successfully linked to parent!');
      setIsLinkOpen(false);
      linkForm.reset();
      queryClient.invalidateQueries({ queryKey: ['parents-list'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to link student'),
  });

  const handleOpenLink = (parent: any) => {
    setSelectedParent(parent);
    setIsLinkOpen(true);
  };

  const parentsList = data?.data || [];
  const meta = data?.meta || { totalPages: 1, totalItems: 0 };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']}>
      <div className="space-y-6">
        <PageHeader
          heading="Parents & Guardians Directory"
          subheading="Manage family profiles, contact details, and linked student relationships."
        >
          <Button onClick={() => setIsCreateOpen(true)} className="shadow-md">
            <Plus className="mr-1.5 h-4 w-4" />
            Register Parent
          </Button>
        </PageHeader>

        {/* Search Bar */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by parent name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Registered Guardians</CardTitle>
            <CardDescription>Showing {parentsList.length} of {meta.totalItems} guardians</CardDescription>
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
                <p className="text-sm font-medium text-destructive mb-3">Failed to load parent records.</p>
                <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
              </div>
            ) : parentsList.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <h4 className="text-sm font-semibold text-foreground">No parents registered</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Register your first parent account.
                </p>
                <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Register Parent
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parent Name</TableHead>
                    <TableHead>Email Account</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Occupation</TableHead>
                    <TableHead>Linked Student Wards</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parentsList.map((p: any) => (
                    <TableRow key={p.id} className="hover:bg-muted/50">
                      <TableCell className="font-semibold text-foreground">
                        {p.firstName} {p.lastName}
                      </TableCell>
                      <TableCell className="text-xs">{p.email || p.user?.email}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.phone || '—'}
                      </TableCell>
                      <TableCell className="text-xs">{p.occupation || 'Guardian'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {p.students?.length > 0 ? (
                            p.students.map((stRel: any) => (
                              <Badge key={stRel.student?.id || Math.random()} variant="outline">
                                <GraduationCap className="mr-1 h-3 w-3" />
                                {stRel.student?.firstName} {stRel.student?.lastName}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No wards linked</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => handleOpenLink(p)}
                        >
                          <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
                          Link Student
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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

        {/* Modal: Register Parent */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent onClose={() => setIsCreateOpen(false)}>
            <DialogHeader>
              <DialogTitle>Register Parent / Guardian</DialogTitle>
              <DialogDescription>Create parent portal access credentials</DialogDescription>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pFirst">First Name</Label>
                  <Input id="pFirst" placeholder="David" {...createForm.register('firstName')} />
                  {createForm.formState.errors.firstName && (
                    <p className="text-[11px] text-destructive">{createForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pLast">Last Name</Label>
                  <Input id="pLast" placeholder="Johnson" {...createForm.register('lastName')} />
                  {createForm.formState.errors.lastName && (
                    <p className="text-[11px] text-destructive">{createForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pEmail">Email Address</Label>
                <Input id="pEmail" type="email" placeholder="parent@family.com" {...createForm.register('email')} />
                {createForm.formState.errors.email && (
                  <p className="text-[11px] text-destructive">{createForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pPass">Temporary Password</Label>
                <Input id="pPass" type="text" {...createForm.register('password')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pPhone">Contact Phone</Label>
                <Input id="pPhone" placeholder="+1-555-0144" {...createForm.register('phone')} />
                {createForm.formState.errors.phone && (
                  <p className="text-[11px] text-destructive">{createForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pOcc">Occupation</Label>
                <Input id="pOcc" placeholder="Civil Engineer" {...createForm.register('occupation')} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  Register Parent
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal: Link Student */}
        <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
          <DialogContent onClose={() => setIsLinkOpen(false)}>
            <DialogHeader>
              <DialogTitle>Link Student Ward</DialogTitle>
              <DialogDescription>
                Assign a student to {selectedParent?.firstName} {selectedParent?.lastName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={linkForm.handleSubmit((v) => linkMutation.mutate(v))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="wardSelect">Select Student</Label>
                <Select id="wardSelect" {...linkForm.register('studentId')}>
                  <option value="">Select Enrolled Student</option>
                  {studentsData?.map((st: any) => (
                    <option key={st.id} value={st.id}>
                      {st.firstName} {st.lastName} ({st.admissionNumber})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="relSelect">Relationship</Label>
                <Select id="relSelect" {...linkForm.register('relation')}>
                  <option value="FATHER">FATHER</option>
                  <option value="MOTHER">MOTHER</option>
                  <option value="GUARDIAN">LEGAL GUARDIAN</option>
                  <option value="OTHER">OTHER</option>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsLinkOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={linkMutation.isPending}>
                  Link Student
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  );
}
