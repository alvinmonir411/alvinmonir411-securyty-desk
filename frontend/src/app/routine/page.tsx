'use client';

import React from 'react';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Clock, Printer } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';

export default function RoutinePage() {
  const { data: routines, isLoading } = useQuery({
    queryKey: ['public-routines'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/academics/routines');
        return res.data.data || res.data || [];
      } catch {
        return [];
      }
    },
  });

  const routinesList: any[] = Array.isArray(routines) ? routines : [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
            <div>
              <Badge className="bg-primary text-primary-foreground mb-2">Daily Timetable & Exam Schedules</Badge>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground">Class Routine & Schedules</h1>
              <p className="text-xs text-muted-foreground mt-1">Official master academic routine for active sessions</p>
            </div>
            <Button onClick={() => window.print()} variant="outline">
              <Printer className="mr-1.5 h-4 w-4" /> Print Timetable
            </Button>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Master Daily Classroom Routine</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : routinesList.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  No class routines published yet. Please check back later.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Time Slot</TableHead>
                      <TableHead>Class & Section</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Room</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routinesList.map((r: any, i: number) => (
                      <TableRow key={r.id || i}>
                        <TableCell className="font-bold text-foreground">{r.dayOfWeek}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{r.startTime} - {r.endTime}</TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {r.section?.class?.name || 'Class'} - {r.section?.name || 'Section'}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-primary">{r.subject?.name || 'Subject'}</TableCell>
                        <TableCell className="text-xs text-foreground">
                          {r.teacher ? `${r.teacher.firstName} ${r.teacher.lastName}` : '—'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.roomNumber || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
