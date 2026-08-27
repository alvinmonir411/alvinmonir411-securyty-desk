'use client';

import React, { useState } from 'react';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const photos = [
    { title: 'Modern Science & Robotics Atrium', category: 'Campus', url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800&auto=format&fit=crop' },
    { title: 'Inter-School Athletics Championship', category: 'Sports', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop' },
    { title: 'Annual Science & Tech Fair Expo', category: 'Science', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop' },
    { title: 'Spring Symphony Orchestra Gala', category: 'Cultural', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop' },
    { title: 'Graduation Commencement Ceremony', category: 'Graduation', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop' },
    { title: 'Interactive Computing & AI Laboratory', category: 'Campus', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop' },
  ];

  const categories = ['ALL', 'Campus', 'Sports', 'Science', 'Cultural', 'Graduation'];

  const filtered = selectedCategory === 'ALL' ? photos : photos.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <Badge className="bg-primary text-primary-foreground mb-2">Campus Visual Tour</Badge>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground">Campus Life Photo Gallery</h1>
            <p className="text-xs text-muted-foreground max-w-xl mx-auto">
              Visual glimpses of campus life, competitions, athletics, and cultural milestones.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Photos Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p, i) => (
              <Card key={i} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                <img
                  src={p.url}
                  alt={p.title}
                  className="h-56 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{p.title}</span>
                  <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
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
