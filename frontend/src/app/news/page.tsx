'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { Newspaper } from 'lucide-react';

export default function NewsPage() {
  const { data: news, isLoading } = useQuery({
    queryKey: ['public-news-all'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/cms/news');
        return res.data.data || res.data || [];
      } catch {
        return [];
      }
    },
  });

  const newsList = Array.isArray(news) ? news : [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <Badge className="bg-primary text-primary-foreground mb-2">Media & Press Releases</Badge>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground">Campus News & Spotlight</h1>
            <p className="text-xs text-muted-foreground mt-1">Discover latest student accomplishments, research, and campus milestones</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="h-64 animate-pulse bg-muted/30" />
              ))}
            </div>
          ) : newsList.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed rounded-3xl space-y-2">
              <Newspaper className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-semibold text-foreground">No news articles published yet.</p>
              <p className="text-xs text-muted-foreground">Please check back soon for campus news updates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsList.map((item: any, i: number) => (
                <Card key={item.slug || i} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                  {item.coverImage && (
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <CardContent className="p-5 space-y-2">
                    <span className="text-[10px] font-mono text-primary font-semibold block">
                      {new Date(item.publishedAt || item.createdAt).toLocaleDateString()}
                    </span>
                    <h3 className="font-bold text-foreground text-sm line-clamp-2">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{item.summary || item.content}</p>
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
