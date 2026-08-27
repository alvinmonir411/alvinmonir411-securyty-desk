'use client';

import React from 'react';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download } from 'lucide-react';

export default function SyllabusPage() {
  const syllabuses = [
    { grade: 'Grade 10 (Secondary)', size: '3.4 MB', updated: 'March 2026', subjects: 'Mathematics, Physics, Chemistry, Biology, English, ICT' },
    { grade: 'Grade 9 (Secondary)', size: '3.1 MB', updated: 'March 2026', subjects: 'General Math, Physics, Chemistry, English, Social Science' },
    { grade: 'Grade 8 (Middle School)', size: '2.8 MB', updated: 'February 2026', subjects: 'Mathematics, Integrated Science, English, World History' },
    { grade: 'Grade 7 (Middle School)', size: '2.5 MB', updated: 'February 2026', subjects: 'Mathematics, General Science, English, Geography' },
    { grade: 'Grade 6 (Middle School)', size: '2.2 MB', updated: 'February 2026', subjects: 'Mathematics, Science, English Literature, Arts' },
    { grade: 'Primary School (Grades 1-5)', size: '4.8 MB', updated: 'January 2026', subjects: 'Comprehensive Primary Curriculum Guide' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <Badge className="bg-primary text-primary-foreground mb-2">Academic Curriculum Guides</Badge>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground">Course Syllabus & Learning Outcomes</h1>
            <p className="text-xs text-muted-foreground mt-1">Download official term syllabuses for each grade level</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {syllabuses.map((s, i) => (
              <Card key={i} className="shadow-sm hover:border-primary/40 transition-colors">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{s.grade}</h3>
                      <span className="text-[10px] text-muted-foreground font-mono">PDF • {s.size}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong>Covers:</strong> {s.subjects}
                  </p>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => window.open('#', '_blank')}>
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Download Syllabus PDF
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
