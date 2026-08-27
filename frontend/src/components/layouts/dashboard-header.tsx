'use client';

import React from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { getRoleBadgeColor } from '@/lib/utils';
import { Bell, Search, User as UserIcon } from 'lucide-react';

export function DashboardHeader() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search students, invoices, marks..."
            className="h-9 w-64 rounded-lg border border-input bg-muted/40 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="relative rounded-full p-2 text-muted-foreground hover:bg-muted"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>

        <div className="flex items-center gap-3 border-l border-border pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserIcon className="h-5 w-5" />
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-semibold text-foreground leading-tight">
              {user?.email.split('@')[0] || 'User'}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {user?.role && (
                <span className={`inline-block rounded px-1.5 py-0.2 font-medium ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
