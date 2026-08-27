'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormValues } from '@/lib/validators/auth.schema';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Lock, Mail, ArrowRight, Eye, EyeOff, Shield, KeyRound, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage('');
    try {
      const response = await apiClient.post('/auth/login', values);
      const resData = response.data.data || response.data;
      login(resData.accessToken, resData.refreshToken, resData.user);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setErrorMessage('Too many login attempts. Please wait 1 minute before trying again.');
      } else {
        setErrorMessage(
          err.response?.data?.message || 'Invalid email or password. Please verify your credentials.',
        );
      }
    }
  };

  const handleDemoFill = (email: string, pass: string = 'Pass@123456') => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    setErrorMessage('');
  };

  const demoAccounts = [
    { label: 'Super Admin', email: 'admin@school.com', role: 'admin' },
    { label: 'Principal', email: 'principal@nobleschool.edu.bd', role: 'admin' },
    { label: 'Teacher', email: 'teacher@school.com', role: 'teacher' },
    { label: 'Accountant', email: 'accountant@school.com', role: 'accountant' },
    { label: 'Student', email: 'student@school.com', role: 'student' },
    { label: 'Parent', email: 'parent@school.com', role: 'parent' },
  ];

  return (
    <Card className="border-border/60 shadow-xl max-w-md w-full mx-auto">
      <CardHeader className="space-y-1 text-center pb-4">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Shield className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold">Portal Authentication</CardTitle>
        <CardDescription>
          Sign in to access your role-based academic portal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-9 pr-9"
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full font-semibold" size="lg">
            {isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}
            {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </form>

        {/* Quick Demo Login Credentials Chips */}
        <div className="pt-3 border-t border-border/60 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <KeyRound className="h-3 w-3 text-primary" />
              Demo / Quick Sign-In:
            </p>
            <span className="text-[10px] text-muted-foreground font-mono">Password: Pass@123456</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {demoAccounts.map((acc) => (
              <button
                key={acc.label}
                type="button"
                onClick={() => handleDemoFill(acc.email)}
                className="px-2 py-1.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary text-[11px] font-medium text-left transition-all truncate"
                title={`${acc.label}: ${acc.email}`}
              >
                ⚡ {acc.label}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
