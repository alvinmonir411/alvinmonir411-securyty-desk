'use client';

import React from 'react';
import Link from 'next/link';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 font-bold tracking-tight ${className}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-md border border-primary/20 bg-white">
        <img
          src="/logo.jpg"
          alt="Noble Residential High School Logo"
          className="h-full w-full object-contain p-0.5"
        />
      </div>
      <div className="flex flex-col">
        <span className="text-sm sm:text-base font-extrabold leading-tight text-foreground tracking-tight">
          Noble Residential High School
        </span>
        <span className="text-[10px] font-semibold tracking-wider text-primary uppercase">
          Excellence in Education
        </span>
      </div>
    </Link>
  );
}
