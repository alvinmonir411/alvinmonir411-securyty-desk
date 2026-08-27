'use client';

import React from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Sparkles, Award, Atom, Laptop, Music, ArrowRight } from 'lucide-react';

export default function AcademicsPage() {
  const divisions = [
    { title: 'Early Childhood & Kindergarten', grades: 'Pre-K to KG', desc: 'Play-based experiential discovery, foundational literacy, and sensory motor development.' },
    { title: 'Primary School Academy', grades: 'Grades 1 to 5', desc: 'Inquiry-driven core literacy, mathematics, exploratory science, and foreign languages.' },
    { title: 'Middle School Division', grades: 'Grades 6 to 8', desc: 'Critical thinking, advanced algebra, life sciences, robotics, and social studies.' },
    { title: 'Senior High School', grades: 'Grades 9 to 12', desc: 'College preparatory advanced placement (AP), higher mathematics, physics, and university counseling.' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="flex-1 py-12 space-y-16">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge className="bg-primary text-primary-foreground border-none">Curriculum & Learning</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Academic Excellence & Innovation
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Our comprehensive educational continuum empowers students with the depth, versatility, and analytical competence needed to thrive in top global universities.
          </p>
        </section>

        {/* Academic Divisions */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {divisions.map((div, i) => (
              <Card key={i} className="shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline">{div.grades}</Badge>
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-bold">{div.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">{div.desc}</p>
                  <Link href="/admissions">
                    <Button size="sm" variant="outline" className="w-full">
                      Enroll in {div.grades} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Specialized Programs */}
        <section className="bg-muted/20 py-16 border-y border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Specialized Centers of Excellence</h2>
              <p className="text-xs text-muted-foreground">Enrichment beyond the standard curriculum</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border bg-card space-y-3">
                <Atom className="h-8 w-8 text-primary" />
                <h3 className="font-bold text-foreground text-sm">Advanced STEM & Robotics</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Equipped with 3D printers, micro-controllers, drone testing arenas, and biotechnology apparatus.
                </p>
              </div>

              <div className="p-6 rounded-2xl border bg-card space-y-3">
                <Laptop className="h-8 w-8 text-indigo-600" />
                <h3 className="font-bold text-foreground text-sm">Computer Science & AI Hub</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  High-speed computing lab teaching Python, web architecture, cybersecurity, and machine learning fundamentals.
                </p>
              </div>

              <div className="p-6 rounded-2xl border bg-card space-y-3">
                <Music className="h-8 w-8 text-emerald-600" />
                <h3 className="font-bold text-foreground text-sm">Conservatory of Arts & Symphony</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Classical orchestra, choir studio, digital graphic design suites, and oil painting workshops.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
