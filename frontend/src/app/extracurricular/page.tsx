'use client';

import React from 'react';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Compass, Palette, Code, Music, Shield } from 'lucide-react';

export default function ExtracurricularPage() {
  const activities = [
    { title: 'Robotics & AI Innovation Club', icon: Code, desc: 'Design, build, and program autonomous robotics for international competitions and FIRST Tech Challenge.' },
    { title: 'Model United Nations & Debate Society', icon: Compass, desc: 'Develop diplomatic negotiation, public speaking, and policy analysis through national debate circuits.' },
    { title: 'Olympic Athletics & Sports Academies', icon: Trophy, desc: 'Football, basketball, tennis, swimming, track & field, and martial arts coached by certified national trainers.' },
    { title: 'Symphony Orchestra & Jazz Ensemble', icon: Music, desc: 'Instrumental classical music, string ensembles, choir harmony, and annual stage concert performances.' },
    { title: 'Visual & Fine Arts Guild', icon: Palette, desc: 'Ceramics, digital 3D sculpting, oil canvas painting, photography, and juried youth gallery showcases.' },
    { title: 'Scouts & Community Leadership Patrol', icon: Shield, desc: 'Outdoor survival, environmental sustainability campaigns, community disaster response, and leadership camps.' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <Badge className="bg-primary text-primary-foreground mb-2">Student Life & Leadership</Badge>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground">Extracurricular Clubs & Athletics</h1>
            <p className="text-xs text-muted-foreground max-w-xl mx-auto">
              Cultivating leadership, teamwork, athletic discipline, and creative expression beyond the classroom.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((act, i) => {
              const Icon = act.icon;
              return (
                <Card key={i} className="shadow-sm hover:border-primary/40 transition-colors">
                  <CardContent className="p-6 space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-foreground text-sm">{act.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{act.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
