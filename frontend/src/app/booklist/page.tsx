'use client';

import React from 'react';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Download } from 'lucide-react';

export default function BooklistPage() {
  const booklists = [
    { grade: 'Grade 10 Textbook Booklist', session: '2026-2027', items: '12 Prescribed Books & Lab Manuals', size: '650 KB' },
    { grade: 'Grade 9 Textbook Booklist', session: '2026-2027', items: '11 Prescribed Books & Exercise Notebooks', size: '620 KB' },
    { grade: 'Grade 8 Textbook Booklist', session: '2026-2027', items: '9 Prescribed Books & Stationery Kit', size: '580 KB' },
    { grade: 'Grade 7 Textbook Booklist', session: '2026-2027', items: '8 Prescribed Books & Activity Guides', size: '540 KB' },
    { grade: 'Grade 6 Textbook Booklist', session: '2026-2027', items: '8 Prescribed Books & Workbooks', size: '520 KB' },
    { grade: 'Primary (Grades 1-5) Booklist', session: '2026-2027', items: 'Storybooks, Phonics, Art Supplies', size: '920 KB' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <Badge className="bg-primary text-primary-foreground mb-2">Prescribed Learning Materials</Badge>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground">Academic Textbook Booklists</h1>
            <p className="text-xs text-muted-foreground mt-1">Official prescribed booklists and stationery guides for session 2026-2027</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {booklists.map((b, i) => (
              <Card key={i} className="shadow-sm hover:border-primary/40 transition-colors">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{b.grade}</h3>
                      <span className="text-[10px] text-muted-foreground font-mono">Session {b.session}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{b.items}</p>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => window.open('#', '_blank')}>
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Download Booklist PDF
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
