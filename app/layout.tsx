import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/app/context/auth-context'
import { PWAProvider } from '@/app/components/pwa-provider'
import { Vazirmatn } from 'next/font/google'
import { ErrorBoundary } from '@/app/components/error-boundary'
import './globals.css'

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: '--font-vazirmatn',
});

export const metadata: Metadata = {
  title: 'Amir Nouadi - لوحة التحكم',
  description: 'منصة إدارة الشركات والمزودين الاحترافية',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Amir Nouadi',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Amir Nouadi" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Amir Nouadi" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#1a1a2e" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className={`${vazirmatn.className} ${vazirmatn.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ErrorBoundary>
            <AuthProvider>
              <PWAProvider>
                {children}
              </PWAProvider>
              <Analytics />
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
