'use client';

import React, { useState } from 'react';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Award, Search, Trophy, CheckCircle2, Printer } from 'lucide-react';

import { apiClient } from '@/lib/api/client';

export default function PublicResultsPage() {
  const [studentId, setStudentId] = useState('');
  const [searchedResult, setSearchedResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) return;

    setLoading(true);
    setSearched(true);
    setErrorMsg('');
    setSearchedResult(null);

    try {
      const res = await apiClient.get(`/students?search=${encodeURIComponent(studentId.trim())}`);
      const students = res.data.data?.data || res.data.data || res.data || [];
      const found = Array.isArray(students) ? students[0] : null;

      if (!found) {
        setErrorMsg(`No student record found with Admission / Roll number "${studentId}".`);
        return;
      }

      const activeResult = found.results?.[0];
      setSearchedResult({
        studentName: `${found.firstName} ${found.lastName}`,
        admissionNumber: found.admissionNumber,
        examTitle: activeResult?.exam?.title || 'Academic Term Evaluation',
        gpa: activeResult?.gpa ?? 0,
        gradeLetter: activeResult?.gradeLetter || '—',
        classRank: activeResult?.classRank ?? '—',
        totalMarks: activeResult?.totalScore ?? '—',
        status: activeResult?.isPassed ? 'PASSED' : 'REFERRED',
        subjects: activeResult?.subjectResults?.map((sr: any) => ({
          name: sr.subject?.name || 'Subject',
          score: sr.obtainedMarks,
          grade: sr.gradeLetter,
        })) || [],
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to search student record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <Badge className="bg-primary text-primary-foreground mb-2">Examination Transcripts</Badge>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              Academic & Term Examination Results
            </h1>
            <p className="text-xs text-muted-foreground">Search and view official term examination transcripts and GPA</p>
          </div>

          {/* Search Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Student Result Lookup</CardTitle>
              <CardDescription>Enter candidate Student ID / Admission Number</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="e.g. ADM-2026-0042 or student name"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="font-mono"
                />
                <Button type="submit" disabled={loading}>
                  <Search className="mr-1.5 h-4 w-4" /> {loading ? 'Searching...' : 'Search Result'}
                </Button>
              </form>

              {errorMsg && (
                <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive font-medium">
                  {errorMsg}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Result Marksheet Card */}
          {searchedResult && (
            <Card className="shadow-lg border-primary/30">
              <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">{searchedResult.studentName}</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    {searchedResult.admissionNumber} • {searchedResult.examTitle}
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-1.5 h-3.5 w-3.5" /> Print Marksheet
                </Button>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <span className="text-muted-foreground text-[10px] block">Cumulative GPA</span>
                    <strong className="text-lg font-bold text-primary font-mono">{searchedResult.gpa.toFixed(2)}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-muted-foreground text-[10px] block">Letter Grade</span>
                    <strong className="text-lg font-bold text-emerald-600">{searchedResult.gradeLetter}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-muted-foreground text-[10px] block">Class Rank</span>
                    <strong className="text-lg font-bold text-amber-600 font-mono">#{searchedResult.classRank}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <span className="text-muted-foreground text-[10px] block">Total Marks</span>
                    <strong className="text-lg font-bold text-blue-600 font-mono">{searchedResult.totalMarks} / {searchedResult.maxMarks}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">Subject-Wise Marks Breakdown</h4>
                  <div className="divide-y border rounded-xl overflow-hidden">
                    {searchedResult.subjects.map((sub: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-3 text-xs">
                        <span className="font-medium text-foreground">{sub.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="font-mono font-semibold">{sub.score} / 100</span>
                          <Badge variant="default">{sub.grade}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
