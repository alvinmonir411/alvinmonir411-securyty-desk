'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/shared/logo';
import { useAuth } from '@/providers/auth-provider';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
  CreditCard,
  Banknote,
  UserPlus,
  FileText,
  Bell,
  ShieldAlert,
  LogOut,
  Calendar,
  Layers,
  Globe,
  Settings,
  UserCheck,
  Receipt,
  FileCheck,
  Sparkles,
  Fingerprint,
} from 'lucide-react';

interface NavGroup {
  groupName?: string;
  items: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getNavGroups = (): NavGroup[] => {
    switch (user?.role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
      case 'PRINCIPAL':
        return [
          {
            items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
          },
          {
            groupName: 'PEOPLE',
            items: [
              { label: 'Students', href: '/admin/students', icon: GraduationCap },
              { label: 'Teachers & Staff', href: '/admin/teachers', icon: Users },
            ],
          },
          {
            groupName: 'ACADEMICS',
            items: [
              { label: 'Classes & Subjects', href: '/admin/academics', icon: BookOpen },
              { label: 'Class Routine', href: '/admin/routine', icon: Calendar },
              { label: 'Syllabus & Books', href: '/admin/syllabus', icon: Layers },
            ],
          },
          {
            groupName: 'ATTENDANCE',
            items: [
              { label: 'Daily Attendance', href: '/admin/attendance', icon: CalendarCheck },
              { label: 'Biometric / Fingerprint', href: '/admin/biometric', icon: Fingerprint },
            ],
          },
          {
            groupName: 'EXAMINATION',
            items: [
              { label: 'Exams & Marks', href: '/admin/exams', icon: Award },
              { label: 'Results Search', href: '/admin/results', icon: FileCheck },
            ],
          },
          {
            groupName: 'FINANCE & HR',
            items: [
              { label: 'Finance & Invoices', href: '/admin/finance', icon: CreditCard },
              { label: 'Payroll & Salary', href: '/admin/payroll', icon: Banknote },
            ],
          },
          {
            groupName: 'ADMISSIONS',
            items: [{ label: 'Admissions Pipeline', href: '/admin/admissions', icon: UserPlus }],
          },
          {
            groupName: 'WEBSITE & CMS',
            items: [
              { label: 'Hero Banner Slider', href: '/admin/hero-slides', icon: Globe },
              { label: 'Notices Board', href: '/admin/notices', icon: FileText },
              { label: 'Campus News', href: '/admin/news', icon: Sparkles },
              { label: 'Events Calendar', href: '/admin/events', icon: Calendar },
            ],
          },
          {
            groupName: 'SYSTEM & SECURITY',
            items: [
              { label: 'Audit Trails', href: '/admin/audit', icon: ShieldAlert },
              { label: 'Public Website', href: '/', icon: Globe },
            ],
          },
        ];
      case 'TEACHER':
        return [
          {
            items: [
              { label: 'Teacher Dashboard', href: '/teacher', icon: LayoutDashboard },
              { label: 'Mark Attendance', href: '/teacher/attendance', icon: CalendarCheck },
              { label: 'Grade & Exam Marks', href: '/teacher/marks', icon: Award },
              { label: 'My Timetable', href: '/teacher/timetable', icon: BookOpen },
              { label: 'Leave Requests', href: '/teacher/leaves', icon: FileText },
            ],
          },
        ];
      case 'STUDENT':
        return [
          {
            items: [
              { label: 'Student Dashboard', href: '/student', icon: LayoutDashboard },
              { label: 'Class Timetable', href: '/student/timetable', icon: BookOpen },
              { label: 'My Attendance', href: '/student/attendance', icon: CalendarCheck },
              { label: 'Grades & Report Cards', href: '/student/grades', icon: Award },
              { label: 'Fee Invoices & Dues', href: '/student/fees', icon: CreditCard },
            ],
          },
        ];
      case 'PARENT':
        return [
          {
            items: [
              { label: 'Parent Portal', href: '/parent', icon: LayoutDashboard },
              { label: 'Ward Attendance', href: '/parent/attendance', icon: CalendarCheck },
              { label: 'Report Cards', href: '/parent/grades', icon: Award },
              { label: 'Pay Fees Online', href: '/parent/fees', icon: CreditCard },
            ],
          },
        ];
      case 'ACCOUNTANT':
        return [
          {
            items: [
              { label: 'Finance Dashboard', href: '/accountant', icon: LayoutDashboard },
              { label: 'Fee Invoices', href: '/accountant/invoices', icon: CreditCard },
              { label: 'Record Payments', href: '/accountant/payments', icon: Receipt },
              { label: 'Monthly Payroll', href: '/accountant/payroll', icon: Banknote },
            ],
          },
        ];
      default:
        return [{ items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard }] }];
    }
  };

  const navGroups = getNavGroups();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Logo />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {navGroups.map((group, index) => (
          <div key={index} className="space-y-1">
            {group.groupName && (
              <h4 className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70 mb-1.5 font-mono">
                {group.groupName}
              </h4>
            )}
            <nav className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-4 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            {user?.username?.[0] || user?.email?.[0] || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-foreground truncate">{user?.username || user?.email || 'Admin'}</p>
            <p className="text-[10px] text-muted-foreground capitalize truncate">{user?.role?.replace('_', ' ') || 'User'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
