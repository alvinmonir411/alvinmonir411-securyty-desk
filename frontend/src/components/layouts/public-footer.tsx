import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/shared/logo';
import { Mail, Phone, MapPin, Shield, Facebook } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Noble Residential High School (নোবেল রেসিডেন্সিয়াল হাই স্কুল) — Empowering future leaders through academic excellence, character building, and moral discipline.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Our School</Link></li>
              <li><Link href="/academics" className="hover:text-primary transition-colors">Academic Programs</Link></li>
              <li><Link href="/admissions" className="hover:text-primary transition-colors">Admissions 2026-2027</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Campus Location & Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">Portals & Services</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/login" className="hover:text-primary transition-colors">Student Portal</Link></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">Parent Portal</Link></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">Teacher & Staff Portal</Link></li>
              <li><Link href="/results" className="hover:text-primary transition-colors">Exam Results Search</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">Campus Contact</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span>Noble Residential Campus, Dhaka, Bangladesh</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>+880 1711-234567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span>info@nobleschool.edu.bd</span>
              </li>
              <li className="flex items-center gap-2">
                <Facebook className="h-4 w-4 text-blue-500 shrink-0" />
                <a href="https://www.facebook.com/nrschoolpr" target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-500 font-medium">
                  facebook.com/nrschoolpr
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border/60 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} Noble Residential High School (নোবেল রেসিডেন্সিয়াল হাই স্কুল). All rights reserved.</p>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>Official School ERP & Portal System</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
