import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { ToastProvider } from '@/components/ui/toast';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nobleschool.edu.bd'),
  title: {
    default: 'Noble Residential High School (নোবেল রেসিডেন্সিয়াল হাই স্কুল)',
    template: '%s | Noble Residential High School',
  },
  description:
    'Noble Residential High School offers quality academic learning, disciplined residential care, and modern science education. Admissions open for session 2026-2027.',
  keywords: [
    'Noble Residential High School',
    'নোবেল রেসিডেন্সিয়াল হাই স্কুল',
    'nrschoolpr',
    'High School Bangladesh',
    'Residential School',
    'Admissions 2026',
    'Student Portal',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.facebook.com/nrschoolpr',
    title: 'Noble Residential High School (নোবেল রেসিডেন্সিয়াল হাই স্কুল)',
    description:
      'Committed to building a future generation enriched with moral integrity, creative excellence, and modern scientific competence.',
    siteName: 'Noble Residential High School',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Noble Residential High School',
    description: 'Premier Residential High School of Academic & Moral Distinction.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <AuthProvider>
              <ToastProvider>{children}</ToastProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
