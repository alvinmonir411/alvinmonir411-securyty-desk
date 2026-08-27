'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { UserRole, PermissionCode } from '@/types';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermissions?: (PermissionCode | string)[];
}

export function RouteGuard({
  children,
  allowedRoles,
  requiredPermissions,
}: RouteGuardProps) {
  const { user, isLoading, hasRole, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Verifying security credentials and access permissions...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isRoleAllowed = !allowedRoles || allowedRoles.length === 0 || hasRole(...allowedRoles);
  const isPermissionAllowed =
    !requiredPermissions || requiredPermissions.length === 0 || hasPermission(...requiredPermissions);

  if (!isRoleAllowed || !isPermissionAllowed) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <Card className="max-w-md border-destructive/20 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <CardTitle className="text-xl font-bold">Access Denied (403)</CardTitle>
            <CardDescription className="text-sm">
              You do not have the required role or authorization permissions to view this module.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <div className="rounded-lg bg-muted/60 p-3">
              <p><strong className="text-foreground">Your Role:</strong> {user.role}</p>
              {allowedRoles && (
                <p className="mt-1">
                  <strong className="text-foreground">Permitted Roles:</strong> {allowedRoles.join(', ')}
                </p>
              )}
              {requiredPermissions && (
                <p className="mt-1">
                  <strong className="text-foreground">Required Permissions:</strong> {requiredPermissions.join(', ')}
                </p>
              )}
            </div>
            <p className="text-center">
              If you believe this is in error, contact your school system administrator.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              variant="default"
              onClick={() => {
                switch (user.role) {
                  case 'SUPER_ADMIN':
                  case 'ADMIN':
                  case 'PRINCIPAL':
                    router.push('/admin');
                    break;
                  case 'TEACHER':
                    router.push('/teacher');
                    break;
                  case 'STUDENT':
                    router.push('/student');
                    break;
                  case 'PARENT':
                    router.push('/parent');
                    break;
                  case 'ACCOUNTANT':
                    router.push('/accountant');
                    break;
                  default:
                    router.push('/');
                }
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to My Portal
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
