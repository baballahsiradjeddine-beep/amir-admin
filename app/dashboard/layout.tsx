'use client';

import { Toaster } from "@/components/ui/sonner"

import React from "react"
import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/app/components/sidebar';
import { MobileHeader } from '@/app/components/mobile-header';
import { AppProvider } from '@/app/context/app-context';
import { ToasterProvider } from '@/app/components/toaster-provider';
import { ErrorBoundary } from '@/app/components/error-boundary';
import { AutoBackupTrigger } from '@/components/auto-backup-trigger';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after auth has been initialized
    if (isInitialized && !user) {
      console.log('[v0] No user after init, redirecting to login');
      router.push('/login');
    }
  }, [user, isInitialized, router]);

  // Show loading state while auth is initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppProvider>
      <AutoBackupTrigger />
      <ErrorBoundary>
        <div className="flex min-h-screen bg-background" dir="rtl">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <MobileHeader />
            <main className="flex-1 lg:ms-64 p-4 md:p-8 pt-20 lg:pt-8 transition-all duration-300">
              {children}
            </main>
          </div>
          <ToasterProvider />
        </div>
      </ErrorBoundary>
    </AppProvider>
  );
}
