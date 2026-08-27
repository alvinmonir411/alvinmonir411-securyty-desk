'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bell, Download, Calendar, Search, Pin } from 'lucide-react';

export default function NoticesPage() {
  const [search, setSearch] = useState('');

  const { data: notices, isLoading } = useQuery({
    queryKey: ['public-notices-all'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/cms/notices');
        return res.data.data || res.data || [];
      } catch {
        return [];
      }
    },
  });

  const noticesList = Array.isArray(notices) ? notices : [];
  const filtered = noticesList.filter((n: any) =>
    (n.title || '').toLowerCase().includes(search.toLowerCase()) || (n.content || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
            <div>
              <Badge className="bg-primary text-primary-foreground mb-2">Institutional Notice Board</Badge>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground">Notices & Official Circulars</h1>
              <p className="text-xs text-muted-foreground mt-1">Official announcements for parents, students, and staff</p>
            </div>
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search notices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="h-28 animate-pulse bg-muted/30" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed rounded-3xl space-y-2">
              <Bell className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-semibold text-foreground">No circular notices published.</p>
              <p className="text-xs text-muted-foreground">Check back later for school administration circulars.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((n: any) => (
                <Card key={n.id} className={`shadow-sm transition-all hover:border-primary/40 ${n.isPinned ? 'border-primary/30 bg-primary/5' : ''}`}>
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {n.isPinned && (
                          <Badge variant="default" className="flex items-center gap-1 text-[10px]">
                            <Pin className="h-3 w-3" /> PINNED
                          </Badge>
                        )}
                        <span className="font-mono text-xs text-muted-foreground">
                          {new Date(n.publishedAt || n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge variant="outline">{n.target || 'ALL'}</Badge>
                    </div>

                    <h3 className="text-base font-bold text-foreground">{n.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{n.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
