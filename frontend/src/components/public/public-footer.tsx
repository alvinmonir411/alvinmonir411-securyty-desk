'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Award, Facebook, ShieldCheck } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="print:hidden border-t border-border bg-card text-card-foreground">
      {/* Main Links */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden shadow-md border border-primary/20 bg-white p-0.5">
                <img
                  src="/logo.jpg"
                  alt="Noble Residential High School Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-foreground block">
                  NOBLE RESIDENTIAL
                </span>
                <span className="text-[10px] text-primary uppercase block -mt-1 font-bold tracking-wider">
                  High School (নোবেল রেসিডেন্সিয়াল)
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dedicated to academic brilliance, moral integrity, modern technological education, and holistic character building in a secure residential learning environment.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://www.facebook.com/nrschoolpr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-full"
              >
                <Facebook className="h-4 w-4" />
                <span>Follow on Facebook</span>
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Academic Portal</h4>
            <ul className="space-y-2 text-xs text-muted-foreground font-medium">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">About Noble Residential</Link>
              </li>
              <li>
                <Link href="/academics" className="hover:text-primary transition-colors">Curriculum & Programs</Link>
              </li>
              <li>
                <Link href="/routine" className="hover:text-primary transition-colors">Class & Exam Routines</Link>
              </li>
              <li>
                <Link href="/syllabus" className="hover:text-primary transition-colors">Download Syllabus</Link>
              </li>
              <li>
                <Link href="/booklist" className="hover:text-primary transition-colors">Academic Booklist</Link>
              </li>
              <li>
                <Link href="/results" className="hover:text-primary transition-colors">Board & Term Results</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Student & Community */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Community & Life</h4>
            <ul className="space-y-2 text-xs text-muted-foreground font-medium">
              <li>
                <Link href="/admissions" className="hover:text-primary transition-colors">Online Admissions 2026</Link>
              </li>
              <li>
                <Link href="/notices" className="hover:text-primary transition-colors">Notice Board & Circulars</Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-primary transition-colors">Campus News & Updates</Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-primary transition-colors">Events Calendar</Link>
              </li>
              <li>
                <Link href="/teachers" className="hover:text-primary transition-colors">Faculty Directory</Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-primary transition-colors">Photo Gallery</Link>
              </li>
              <li>
                <a href="https://www.facebook.com/nrschoolpr" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors text-primary font-semibold">Facebook Community ↗</a>
              </li>
            </ul>
          </div>

          {/* Col 4: Campus Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Campus Contact</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span>Noble Residential High School Campus, Pirgachha, Rangpur, Bangladesh (Estd. 2010)</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>+880 1711-234567 / +880 1819-876543</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span>info@nobleschool.edu.bd</span>
              </p>
            </div>
            <div className="pt-2">
              <Link href="/contact">
                <span className="text-xs font-semibold text-primary hover:underline">
                  View Interactive Campus Map & Inquiry Form →
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-8 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} Noble Residential High School. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/login" className="hover:underline font-semibold text-primary">Staff & Parent Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
