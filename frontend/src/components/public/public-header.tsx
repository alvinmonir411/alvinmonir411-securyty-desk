'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
  Phone,
  Mail,
  Clock,
  ExternalLink,
} from 'lucide-react';

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="print:hidden sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
      {/* 1. Top Information Bar */}
      <div className="hidden bg-primary px-4 py-1.5 text-xs text-primary-foreground sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 font-medium">
              <Phone className="h-3.5 w-3.5" /> +880 1711-234567 / +880 1819-876543
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Mail className="h-3.5 w-3.5" /> info@nobleschool.edu.bd
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5" /> Mon - Sat: 8:00 AM - 4:30 PM
            </span>
          </div>
          <div className="flex items-center gap-4 font-semibold">
            <a
              href="https://www.facebook.com/nrschoolpr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full"
            >
              <span>Facebook</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <span>•</span>
            <Link href="/admissions" className="hover:underline">
              Admissions
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:underline">
              Portal Login
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Left: Logo + School Name + Tagline */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl overflow-hidden shadow-md border border-primary/30 bg-white group-hover:scale-105 transition-transform p-0.5 shrink-0">
            <img
              src="/logo.jpg"
              alt="Noble Residential High School Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-foreground block leading-snug">
              NOBLE RESIDENTIAL HIGH SCHOOL
            </span>
            <span className="text-[11px] font-semibold text-primary block -mt-0.5">
              নোবেল রেসিডেন্সিয়াল হাই স্কুল <span className="text-[10px] text-muted-foreground font-normal italic">• পীরগাছা, রংপুর (Est. 2010)</span>
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <Link href="/about" className="hover:text-primary transition-colors">About</Link>
          <Link href="/academics" className="hover:text-primary transition-colors">Academics</Link>
          <Link href="/admissions" className="hover:text-primary transition-colors">Admissions</Link>
          <Link href="/results" className="hover:text-primary transition-colors">Results</Link>
          <Link href="/notices" className="hover:text-primary transition-colors">Notices</Link>
          <Link href="/teachers" className="hover:text-primary transition-colors">Faculty</Link>
          <Link href="/gallery" className="hover:text-primary transition-colors">Gallery</Link>
          <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
        </nav>

        {/* Right: Actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          <Link href="/admissions">
            <Button size="sm" className="shadow-sm font-semibold">
              Apply Admission
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm" variant="outline" className="font-semibold">
              Portal Login
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-card px-4 py-4 space-y-2.5 text-sm font-semibold">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block py-1">Home</Link>
          <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="block py-1">About</Link>
          <Link href="/academics" onClick={() => setMobileMenuOpen(false)} className="block py-1">Academics</Link>
          <Link href="/admissions" onClick={() => setMobileMenuOpen(false)} className="block py-1">Admissions</Link>
          <Link href="/results" onClick={() => setMobileMenuOpen(false)} className="block py-1">Results</Link>
          <Link href="/notices" onClick={() => setMobileMenuOpen(false)} className="block py-1">Notices</Link>
          <Link href="/teachers" onClick={() => setMobileMenuOpen(false)} className="block py-1">Faculty</Link>
          <Link href="/gallery" onClick={() => setMobileMenuOpen(false)} className="block py-1">Gallery</Link>
          <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block py-1">Contact</Link>
          <div className="pt-3 border-t flex flex-col gap-2">
            <Link href="/admissions" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full">Apply Admission</Button>
            </Link>
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full">Portal Login</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
