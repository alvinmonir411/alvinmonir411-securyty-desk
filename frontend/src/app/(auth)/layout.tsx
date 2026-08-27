import React from 'react';
import { Logo } from '@/components/shared/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Logo />
      </div>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Noble Residential High School. Secured by Multi-Factor Authentication.
      </p>
    </div>
  );
}
