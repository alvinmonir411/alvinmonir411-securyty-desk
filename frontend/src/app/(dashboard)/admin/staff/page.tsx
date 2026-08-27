'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  Users,
  Search,
  Mail,
  Phone,
  Shield,
  Clock,
  UserCheck,
} from 'lucide-react';

export default function StaffManagementPage() {
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const { data: staffList, isLoading, isError, refetch } = useQuery({
    queryKey: ['staff-members'],
    queryFn: async () => {
      const res = await apiClient.get('/teachers/staff/all');
      return res.data.data || res.data;
    },
  });

  const filteredStaff = (staffList || []).filter((s: any) => {
    const matchesSearch =
      !search ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.username && s.username.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = !selectedRole || s.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']}>
      <div className="space-y-6">
        <PageHeader
          heading="Administrative & Support Staff"
          subheading="Directory of system administrators, financial accountants, and support personnel."
        />

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="relative sm:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search staff by email or username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div>
                <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  <option value="">All Staff Roles</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="ACCOUNTANT">ACCOUNTANT</option>
                  <option value="STAFF">STAFF</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Staff Directory</CardTitle>
            <CardDescription>Showing {filteredStaff.length} team members</CardDescription>
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
                <p className="text-sm font-medium text-destructive mb-3">Failed to load staff directory.</p>
                <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Email</TableHead>
                    <TableHead>Assigned System Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contact Phone</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                            {s.email[0].toUpperCase()}
                          </div>
                          <span>{s.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.role === 'ADMIN'
                              ? 'destructive'
                              : s.role === 'ACCOUNTANT'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {s.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'ACTIVE' ? 'success' : 'default'}>
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {s.phoneNumber || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString() : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
