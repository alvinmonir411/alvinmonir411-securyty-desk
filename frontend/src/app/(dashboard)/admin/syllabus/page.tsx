'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  BookOpen,
  Download,
  Layers,
  FileText,
  Search,
  CheckCircle2,
} from 'lucide-react';

export default function AdminSyllabusPage() {
  const [selectedClass, setSelectedClass] = useState('');
  const [search, setSearch] = useState('');

  const { data: classes } = useQuery({
    queryKey: ['syllabus-classes-list'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/classes');
      return res.data.data || res.data || [];
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ['syllabus-subjects-list'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/subjects');
      return res.data.data || res.data || [];
    },
  });

  const filteredSubjects = (subjects || []).filter((s: any) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'TEACHER']}>
      <div className="space-y-6">
        <PageHeader
          heading="সিলেবাস ও পাঠ্যপুস্তক তালিকা (Syllabus & Textbook List)"
          subheading="জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB) অনুমোদিত কারিকুলাম ও সিলেবাস"
        />

        {/* Filter Bar */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="">সকল শ্রেণী (Class 1 - Class 10)</option>
                {classes?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </Select>
              <Input
                placeholder="বিষয় খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Subjects & Textbook Directory */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">এনসিটিবি পাঠ্যপুস্তক ও সিলেবাস ইনভেন্টরি</CardTitle>
            <CardDescription>বোর্ড অনুমোদিত বিষয়ভিত্তিক সিলেবাস ও পাঠ্যপুস্তক তালিকা</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>বিষয় কোড</TableHead>
                  <TableHead>বিষয়ের নাম (Subject Name)</TableHead>
                  <TableHead>ধরন (Type)</TableHead>
                  <TableHead>মোট নম্বর (Total Marks)</TableHead>
                  <TableHead>পাশ নম্বর (Pass Marks)</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      কোনো পাঠ্যবিষয় পাওয়া যায়নি
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubjects.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono font-bold text-primary">{s.code}</TableCell>
                      <TableCell className="font-semibold text-foreground">{s.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {s.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{s.totalMarks || 100}</TableCell>
                      <TableCell className="font-mono">{s.passMarks || 33}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          onClick={() => alert(`NCTB ${s.name} syllabus PDF details.`)}
                        >
                          <Download className="mr-1 h-3 w-3" /> সিলেবাস PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
