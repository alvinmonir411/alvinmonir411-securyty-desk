'use client';

import React from 'react';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, GraduationCap } from 'lucide-react';

export default function AlumniPage() {
  const alumni = [
    { name: 'Dr. Julian Thorne, MD', classOf: 'Class of 2008', role: 'Senior Medical Researcher', quote: 'Noble Residential High School taught me that rigorous scientific discipline is incomplete without deep human empathy.' },
    { name: 'Aria Chen', classOf: 'Class of 2014', role: 'Founder & CEO, Tech Innovation Inc.', quote: 'The experimental science lab at Noble Residential High School sparked my lifelong passion for technology and engineering.' },
    { name: 'Marcus Sterling', classOf: 'Class of 2018', role: 'Rhodes Scholar, Oxford University', quote: 'The mentorship from our faculty prepared me to debate with clarity, nuance, and global perspective.' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <Badge className="bg-primary text-primary-foreground mb-2">Global Alumni Network</Badge>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground">Distinguished Alumni Worldwide</h1>
            <p className="text-xs text-muted-foreground max-w-xl mx-auto">
              Our graduates lead groundbreaking research, launch innovative enterprises, and drive social progress across the globe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {alumni.map((a, i) => (
              <Card key={i} className="shadow-sm hover:border-primary/40 transition-colors">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs font-mono">
                      {a.name.split(' ')[0][0]}{a.name.split(' ')[1]?.[0] || 'A'}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{a.name}</h3>
                      <span className="text-[10px] text-primary font-semibold">{a.classOf}</span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-foreground">{a.role}</p>
                  <p className="text-xs text-muted-foreground italic leading-relaxed">"{a.quote}"</p>
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
