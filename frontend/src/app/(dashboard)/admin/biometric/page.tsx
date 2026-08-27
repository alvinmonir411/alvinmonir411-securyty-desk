'use client';

import React from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { RouteGuard } from '@/components/auth/route-guard';
import { Fingerprint } from 'lucide-react';

export default function AdminBiometricPage() {
  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']}>
      <div className="space-y-6">
        <PageHeader
          heading="Biometric Integration & Fingerprint Devices"
          subheading="Automated Attendance Push Hardware Integration & ADMS Punch Logs"
        />

        <Card className="shadow-sm border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-8 text-center space-y-3">
            <Fingerprint className="mx-auto h-12 w-12 text-amber-600" />
            <h3 className="text-base font-bold text-foreground">Biometric Module Maintenance</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              বায়োমেট্রিক ও ফিঙ্গারপ্রিন্ট ডিভাইস ইন্টিগ্রেশন প্রিজমা স্কিমা মাইগ্রেশনের অপেক্ষায় রয়েছে। খুব শীঘ্রই সক্রিয় হবে।
            </p>
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
