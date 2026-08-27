'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Mail, ArrowLeft, KeyRound } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid institutional email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await apiClient.post('/auth/forgot-password', values);
      setSuccessMessage(
        'If an account exists with this email address, a password reset link has been dispatched to your inbox.',
      );
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to request password reset. Please try again.',
      );
    }
  };

  return (
    <Card className="border-border/60 shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription>
          Enter your registered institutional email to receive a password recovery link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage ? (
          <div className="space-y-4 text-center">
            <div className="flex flex-col items-center gap-2 rounded-lg bg-emerald-500/10 p-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
              <span>{successMessage}</span>
            </div>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Institutional Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@school.edu"
                  className="pl-9"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
              {isSubmitting ? 'Dispatching Link...' : 'Send Recovery Link'}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
