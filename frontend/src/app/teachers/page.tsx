'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, GraduationCap } from 'lucide-react';

export default function TeachersPage() {
  const { data: teachers, isLoading } = useQuery({
    queryKey: ['public-faculty-directory'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/teachers');
        return res.data.data || res.data || [];
      } catch {
        return [];
      }
    },
  });

  const teachersList = Array.isArray(teachers) ? teachers : [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <Badge className="bg-primary text-primary-foreground mb-2">Faculty Directory</Badge>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground">Our Distinguished Educators</h1>
            <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
              World-class scholars, researchers, and mentors committed to personalized academic excellence.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-64 animate-pulse bg-muted/30" />
              ))}
            </div>
          ) : teachersList.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed rounded-3xl space-y-2">
              <GraduationCap className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-semibold text-foreground">No faculty profiles published yet.</p>
              <p className="text-xs text-muted-foreground">Please check back shortly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {teachersList.map((t: any) => {
                const avatar = t.user?.avatarUrl || t.avatarUrl;

                return (
                  <Card key={t.id} className="shadow-sm hover:border-primary/40 transition-colors text-center overflow-hidden group">
                    <CardContent className="p-6 space-y-3">
                      {avatar ? (
                        <div className="h-24 w-24 rounded-full overflow-hidden mx-auto border-2 border-primary/30 shadow-md">
                          <img
                            src={avatar}
                            alt={`${t.firstName} ${t.lastName}`}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-xl font-bold font-mono border border-primary/20">
                          {t.firstName?.[0]}{t.lastName?.[0]}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-foreground text-sm">{t.firstName} {t.lastName}</h3>
                        <p className="text-[11px] text-primary font-semibold">{t.designation || 'Lecturer'}</p>
                        <span className="text-[10px] text-muted-foreground block">{t.department}</span>
                      </div>
                      <div className="pt-2 border-t text-[10px] text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">{t.qualification || '—'}</p>
                        <p className="font-mono text-[9px] text-muted-foreground">{t.email || t.user?.email || ''}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
