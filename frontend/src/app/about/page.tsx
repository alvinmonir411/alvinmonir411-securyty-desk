'use client';

import React from 'react';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Award, ShieldCheck, Target, Eye, Users, BookOpen } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="flex-1 py-12 space-y-16">
        {/* Header Hero */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge className="bg-primary text-primary-foreground border-none">About Our Institution</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Noble Residential High School (নোবেল রেসিডেন্সিয়াল হাই স্কুল)
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Dedicated to fostering academic brilliance, moral integrity, modern technological education, and holistic character building in a secure residential learning environment.
          </p>
        </section>

        {/* History & Campus */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Our Inspiring Journey & Residential Care</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Noble Residential High School provides students with a disciplined, caring, and intellectually stimulating environment. Our modern campus houses specialized science laboratories, computer training facilities, sports grounds, and safe residential hostels with round-the-clock teacher supervision.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                With a low student-to-teacher ratio, our dedicated faculty nurtures every scholar's innate talents and prepares them for 100% board GPA success.
              </p>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-xl border">
              <img
                src="https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=1200&auto=format&fit=crop"
                alt="Campus Architecture"
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        </section>

        {/* Core Pillars */}
        <section className="bg-muted/20 py-16 border-y border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Our Foundational Pillars</h2>
              <p className="text-xs text-muted-foreground">The values that guide every aspect of life at Noble Residential High School</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="shadow-sm">
                <CardContent className="p-6 space-y-2 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                    <Target className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">Academic Rigor</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Internationally benchmarked curriculum combining experimental sciences, computational thinking, and liberal arts.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-6 space-y-2 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">Moral Integrity</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Instilling profound ethical values, community empathy, and social responsibility in our young leaders.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-6 space-y-2 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">Global Citizenship</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Empowering scholars to engage meaningfully with global challenges, sustainability, and cultural collaboration.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
