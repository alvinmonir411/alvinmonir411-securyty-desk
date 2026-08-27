'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, ChevronRight, BellOff } from 'lucide-react';

interface NewsTickerProps {
  notices?: Array<{ id: string; title: string }>;
}

export function NewsTicker({ notices }: NewsTickerProps) {
  const items = notices || [];

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs flex items-center gap-3 overflow-hidden">
      <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 shrink-0 bg-amber-500/20 px-2.5 py-0.5 rounded-full text-[11px]">
        <Flame className="h-3.5 w-3.5" />
        <span>LATEST UPDATES</span>
      </div>

      <div className="overflow-hidden whitespace-nowrap w-full flex items-center">
        {items.length === 0 ? (
          <span className="text-muted-foreground text-xs italic flex items-center gap-1.5">
            <BellOff className="h-3.5 w-3.5 text-muted-foreground/60" />
            No latest announcements
          </span>
        ) : (
          <div className="inline-block animate-marquee flex items-center gap-8">
            {items.map((item, i) => (
              <Link
                key={item.id || i}
                href="/notices"
                className="text-muted-foreground hover:text-foreground font-medium transition-colors inline-flex items-center gap-1.5 text-xs"
              >
                <span>{item.title}</span>
                <ChevronRight className="h-3 w-3 text-amber-500" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
