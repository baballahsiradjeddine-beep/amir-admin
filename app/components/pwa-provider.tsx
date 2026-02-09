'use client';

import React from "react"

import { useEffect, useState } from 'react';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if user dismissed it recently (within last 7 days)
      const lastDismissed = localStorage.getItem('pwa-prompt-dismissed');
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      if (lastDismissed && parseInt(lastDismissed) > sevenDaysAgo) {
        return;
      }

      // Delay prompt showing to not annoy user immediately
      const timer = setTimeout(() => {
        // Only show if not already installed/standalone
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
        if (!isStandalone) {
          setShowInstallPrompt(true);
        }
      }, 5000);

      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Online/offline detection
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineNotice(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineNotice(true);
    };

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install choice: ${outcome}`);

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  return (
    <>
      {children}

      {/* PWA Install Prompt - Modern Design */}
      {showInstallPrompt && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-sm z-[100] animate-in slide-in-from-bottom-5 duration-500">
          <div className="bg-card border border-border/50 shadow-2xl rounded-2xl p-5 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />

            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <img src="/logo.png" alt="App Logo" className="h-8 w-8 object-contain rounded-md shadow-sm" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black font-heading text-foreground">تثبيت تطبيق Dashboard</h4>
                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                  {isIOS
                    ? "اضغط على زر 'مشاركة' ثم 'إضافة إلى الصفحة الرئيسية' لتثبيت التطبيق."
                    : "قم بتثبيت التطبيق على هاتفك للوصول السريع والعمل دون إنترنت."
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              {!isIOS && (
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black py-2.5 rounded-xl transition-all shadow-md active:scale-95"
                >
                  تثبيت الآن
                </button>
              )}
              <button
                onClick={() => {
                  setShowInstallPrompt(false);
                  localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
                }}
                className="flex-1 bg-muted hover:bg-muted/80 text-foreground text-[11px] font-black py-2.5 rounded-xl transition-all active:scale-95"
              >
                ربما لاحقاً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline indicator */}
      {showOfflineNotice && (
        <div className="fixed bottom-4 right-4 z-50 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 rtl:right-auto rtl:left-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs font-bold">وضع عدم الاتصال - البيانات محفوظة محليًا</span>
          <button
            onClick={() => setShowOfflineNotice(false)}
            className="mr-2 text-white/80 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}

// Hook to check online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
