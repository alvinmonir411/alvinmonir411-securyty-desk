import { NextResponse, type NextRequest } from 'next/server';

const ROLE_DASHBOARDS: Record<string, string> = {
  SUPER_ADMIN: '/admin',
  ADMIN: '/admin',
  PRINCIPAL: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
  PARENT: '/parent',
  ACCOUNTANT: '/accountant',
  STAFF: '/admin',
};

const ROUTE_PERMITTED_ROLES: Record<string, string[]> = {
  '/admin': ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'STAFF'],
  '/teacher': ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
  '/student': ['SUPER_ADMIN', 'STUDENT'],
  '/parent': ['SUPER_ADMIN', 'PARENT'],
  '/accountant': ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  // Never block auth pages
  if (pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password') {
    return NextResponse.next();
  }

  // Check protected dashboard routes
  const matchedRoutePrefix = Object.keys(ROUTE_PERMITTED_ROLES).find((prefix) =>
    pathname.startsWith(prefix),
  );

  if (matchedRoutePrefix) {
    // Unauthenticated: redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based boundary enforcement
    if (userRole) {
      const allowedRoles = ROUTE_PERMITTED_ROLES[matchedRoutePrefix];
      if (allowedRoles && !allowedRoles.includes(userRole) && userRole !== 'SUPER_ADMIN') {
        const correctDashboard = ROLE_DASHBOARDS[userRole] || '/';
        return NextResponse.redirect(new URL(correctDashboard, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/parent/:path*',
    '/accountant/:path*',
    '/login',
    '/forgot-password',
    '/reset-password',
  ],
};
