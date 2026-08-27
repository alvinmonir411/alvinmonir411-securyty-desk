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
import { Select } from '@/components/ui/select';
import { RouteGuard } from '@/components/auth/route-guard';
import {
  FileCheck,
  Search,
  Printer,
  Award,
  BookOpen,
  GraduationCap,
  AlertTriangle,
} from 'lucide-react';

export default function AdminResultsPage() {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Queries
  const { data: classes } = useQuery({
    queryKey: ['results-classes-list'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/classes');
      return res.data.data || res.data || [];
    },
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['results-students-list', selectedClass, search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '20' });
      if (selectedClass) params.append('classId', selectedClass);
      if (search) params.append('search', search);
      const res = await apiClient.get(`/students?${params.toString()}`);
      return res.data.data?.data || res.data.data || [];
    },
  });

  const { data: reportCard, isLoading: reportLoading } = useQuery({
    queryKey: ['student-report-card-view', selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent?.id) return null;
      const res = await apiClient.get(`/examinations/results/student/${selectedStudent.id}`).catch(() => ({ data: null }));
      return res.data?.data || res.data;
    },
    enabled: !!selectedStudent?.id,
  });

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'TEACHER']}>
      <div className="space-y-6">
        <PageHeader
          heading="ফলাফল ও রিপোর্ট কার্ড অনুসন্ধান (Student Results & Transcripts)"
          subheading="শিক্ষার্থীদের বোর্ড রেজাল্ট, মেধা তালিকা ও মার্কশীট অনুসন্ধান করুন"
        />

        {/* Filter Bar */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative sm:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="শিক্ষার্থীর নাম বা রোল নম্বর দিয়ে খুঁজুন..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="">সকল শ্রেণী (All Classes)</option>
                {classes?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Layout Grid: Student Selection Table & Transcript Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Col: Students Table */}
          <Card className="shadow-sm lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">শিক্ষার্থী তালিকা</CardTitle>
              <CardDescription>রিপোর্ট কার্ড দেখতে শিক্ষার্থীর নাম সিলেক্ট করুন</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {studentsLoading ? (
                <div className="p-6 text-center text-xs text-muted-foreground">শিক্ষার্থী লোড হচ্ছে...</div>
              ) : !students || students.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">কোনো শিক্ষার্থী পাওয়া যায়নি</div>
              ) : (
                <div className="divide-y max-h-[500px] overflow-y-auto">
                  {students.map((st: any) => {
                    const isSelected = selectedStudent?.id === st.id;
                    const enrollment = st.enrollments?.[0];
                    return (
                      <button
                        key={st.id}
                        onClick={() => setSelectedStudent(st)}
                        className={`w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-center justify-between text-xs ${
                          isSelected ? 'bg-primary/10 border-l-4 border-primary font-semibold' : ''
                        }`}
                      >
                        <div>
                          <p className="font-bold text-foreground">{st.firstName} {st.lastName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">আইডি: {st.admissionNumber}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {enrollment?.section?.class?.name || 'Class'}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Col: Official Report Card Preview */}
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3 print:border-none">
              <div>
                <CardTitle className="text-base font-semibold">একাডেমিক ট্রান্সক্রিপ্ট ও মার্কশীট</CardTitle>
                <CardDescription>বাংলাদেশ গ্রেডিং সিস্টেম অনুযায়ী ট্রান্সক্রিপ্ট</CardDescription>
              </div>
              {selectedStudent && (
                <Button onClick={() => window.print()} size="sm" className="print:hidden shadow-sm">
                  <Printer className="mr-1.5 h-4 w-4" />
                  রিপোর্ট কার্ড প্রিন্ট করুন
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              {!selectedStudent ? (
                <div className="py-20 text-center text-muted-foreground space-y-2">
                  <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <p className="font-medium text-sm">বামদিকের তালিকা থেকে শিক্ষার্থী নির্বাচন করুন</p>
                </div>
              ) : reportLoading ? (
                <div className="py-20 text-center text-xs text-muted-foreground">মার্কশীট লোড হচ্ছে...</div>
              ) : (
                /* Official Report Card Printable Document */
                <div className="space-y-6 print:p-0">
                  {/* Header */}
                  <div className="text-center space-y-1 border-b pb-4">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <img src="/logo.jpg" alt="Logo" className="h-12 w-12 object-contain" />
                      <div>
                        <h2 className="text-lg font-extrabold text-foreground">নোবেল রেসিডেন্সিয়াল হাই স্কুল</h2>
                        <p className="text-[11px] text-muted-foreground">NOBLE RESIDENTIAL HIGH SCHOOL • DHAKA, BANGLADESH</p>
                      </div>
                    </div>
                    <Badge className="bg-primary text-primary-foreground text-xs font-mono uppercase tracking-wider">
                      ACADEMIC TRANSCRIPT & REPORT CARD
                    </Badge>
                  </div>

                  {/* Student Info */}
                  <div className="grid grid-cols-2 gap-4 text-xs bg-muted/20 p-3 rounded-xl border">
                    <div>
                      <p><span className="text-muted-foreground">Student Name:</span> <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong></p>
                      <p><span className="text-muted-foreground">Admission No:</span> <strong className="font-mono">{selectedStudent.admissionNumber}</strong></p>
                    </div>
                    <div>
                      <p><span className="text-muted-foreground">Class & Section:</span> <strong>{selectedStudent.enrollments?.[0]?.section?.class?.name || 'Class 10'} ({selectedStudent.enrollments?.[0]?.section?.name || 'Section A'})</strong></p>
                      <p><span className="text-muted-foreground">Gender:</span> <strong>{selectedStudent.gender}</strong></p>
                    </div>
                  </div>

                  {/* Marks Table */}
                  <Table className="text-xs border">
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>বিষয় (Subject)</TableHead>
                        <TableHead className="text-center">মোট নম্বর</TableHead>
                        <TableHead className="text-center">প্রাপ্ত নম্বর</TableHead>
                        <TableHead className="text-center">গ্রেড (Grade)</TableHead>
                        <TableHead className="text-center">গ্রেড পয়েন্ট (GP)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportCard && Array.isArray(reportCard.subjects) && reportCard.subjects.length > 0 ? (
                        reportCard.subjects.map((sub: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-semibold">{sub.subjectName}</TableCell>
                            <TableCell className="text-center font-mono">{sub.totalMarks || 100}</TableCell>
                            <TableCell className="text-center font-mono font-bold text-primary">{sub.obtainedMarks}</TableCell>
                            <TableCell className="text-center font-bold">{sub.gradeLetter}</TableCell>
                            <TableCell className="text-center font-mono">{sub.gradePoint}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                            এই শিক্ষার্থীর জন্য কোনো পরীক্ষার নম্বর অন্তর্ভুক্ত করা হয়নি। (No exam marks recorded for this student yet.)
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {/* Summary Bar */}
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-primary/5 text-foreground font-semibold text-xs">
                    <span>GPA (Grade Point Average):</span>
                    <span className="text-base font-bold font-mono text-primary">
                      {reportCard?.gpa ? `${Number(reportCard.gpa).toFixed(2)} (${reportCard.gradeLetter || '—'})` : '—'}
                    </span>
                  </div>

                  {/* Signatures for Print */}
                  <div className="hidden print:grid grid-cols-2 gap-12 pt-16 text-center text-xs">
                    <div className="border-t border-black pt-1">
                      <p className="font-semibold">শ্রেণী শিক্ষকের স্বাক্ষর</p>
                      <p className="text-[10px] text-gray-500">Class Teacher Signature</p>
                    </div>
                    <div className="border-t border-black pt-1">
                      <p className="font-bold">প্রধান শিক্ষকের স্বাক্ষর ও সীলামোহর</p>
                      <p className="text-[10px] text-gray-500">Headmaster Signature & Seal</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RouteGuard>
  );
}
