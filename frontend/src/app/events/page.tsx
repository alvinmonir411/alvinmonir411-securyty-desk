'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock } from 'lucide-react';

export default function EventsPage() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['public-events-all'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/cms/events');
        return res.data.data || res.data || [];
      } catch {
        return [];
      }
    },
  });

  const eventsList = Array.isArray(events) ? events : [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <Badge className="bg-primary text-primary-foreground mb-2">Campus Calendar</Badge>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground">Upcoming Campus Events</h1>
            <p className="text-xs text-muted-foreground mt-1">Conferences, athletics galas, academic fairs, and artistic showcases</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="h-72 animate-pulse bg-muted/30" />
              ))}
            </div>
          ) : eventsList.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed rounded-3xl space-y-2">
              <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-semibold text-foreground">No upcoming campus events scheduled.</p>
              <p className="text-xs text-muted-foreground">Please check back soon for calendar updates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventsList.map((ev: any, i: number) => (
                <Card key={i} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                  {ev.coverImage && (
                    <img
                      src={ev.coverImage}
                      alt={ev.title}
                      className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-primary font-semibold">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(ev.startDate || ev.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-foreground text-sm line-clamp-2">{ev.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{ev.description}</p>
                    {ev.venue && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>{ev.venue}</span>
                      </div>
                    )}
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
