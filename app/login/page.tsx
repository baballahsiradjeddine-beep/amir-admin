'use client';
import React, { useEffect, useState } from "react"
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ShieldCheck, LogIn, Sun, Moon } from 'lucide-react';
import { useTheme } from "next-themes";

export default function LoginPage() {
  const router = useRouter();
  const { login, resetPassword, isLoading, isInitialized, user, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isInitialized && user) {
      console.log('[Auth] User logged in, redirecting...');
      router.push('/dashboard');
    }
  }, [isInitialized, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Router push is handled by auth-context redirect or useEffect
    } catch {
      // Error is handled by context state
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
      setTimeout(() => {
        // Automatically switch back after 5 seconds or keep showing success
        // setShowForgotPassword(false);
      }, 5000);
    } catch {
      // Error handled by context
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Theme Toggle Button Component
  const ThemeToggle = () => {
    const { setTheme, theme } = useTheme();
    return (
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-50 rounded-full w-10 h-10 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        title="تغيير المظهر"
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-blue-600" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-white" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  };

  if (showForgotPassword) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background relative transition-colors duration-500">
        <ThemeToggle />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md p-8 border-0 relative z-10 card-premium shadow-2xl">
          <div className="mb-8 text-center space-y-2">
            <h1 className="text-2xl font-bold font-heading text-foreground">استعادة كلمة المرور</h1>
            <p className="text-muted-foreground text-sm font-medium">
              أدخل بريدك الإلكتروني لاستلام رابط تغيير كلمة المرور
            </p>
          </div>

          {error && !resetSuccess && (
            <Alert variant="destructive" className="mb-6 rounded-xl animate-in fade-in zoom-in duration-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-bold">{error}</AlertDescription>
            </Alert>
          )}

          {resetSuccess ? (
            <div className="text-center space-y-4 py-8 animate-in fade-in zoom-in">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">تم إرسال الرابط!</h3>
              <p className="text-muted-foreground">راجع بريدك الإلكتروني واتبع التعليمات لتعيين كلمة مرور جديدة.</p>
              <Button
                onClick={() => setShowForgotPassword(false)}
                className="mt-4 w-full bg-primary text-primary-foreground font-bold h-12 rounded-xl"
              >
                العودة لتسجيل الدخول
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-foreground font-bold ms-1">البريد الإلكتروني</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="!bg-white dark:!bg-slate-900 border-slate-200 dark:border-slate-800 h-12 rounded-xl focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white transition-all shadow-sm hover:!bg-white dark:hover:!bg-slate-900"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 h-12 rounded-xl"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-primary text-primary-foreground font-bold h-12 rounded-xl"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : 'إرسال الرابط'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative transition-colors duration-500">
      <ThemeToggle />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md p-8 border-0 relative z-10 card-premium shadow-2xl">
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex items-center justify-center mb-6 transform hover:scale-105 transition-transform duration-500">
            <img
              src="/logo.png"
              alt="Amir Nouadi Logo"
              className="w-32 h-auto object-contain drop-shadow-xl"
            />
          </div>
          <h1 className="text-3xl font-bold font-heading text-foreground">
            Amir Nouadi
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            منصة إدارة الشركات والمزودين
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 rounded-xl animate-in fade-in zoom-in duration-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-bold">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-bold ms-1">
              البريد الإلكتروني
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="!bg-white dark:!bg-slate-900 border-slate-200 dark:border-slate-800 h-12 rounded-xl focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white transition-all shadow-sm hover:!bg-white dark:hover:!bg-slate-900"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-bold ms-1">
              كلمة المرور
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="!bg-white dark:!bg-slate-900 border-slate-200 dark:border-slate-800 h-12 rounded-xl focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white transition-all shadow-sm hover:!bg-white dark:hover:!bg-slate-900"
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold font-heading py-2 h-14 rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-300 hover:scale-[1.02] mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="me-2 h-5 w-5 animate-spin" />
                جاري المعالجة...
              </>
            ) : (
              <>
                <LogIn className="me-2 h-5 w-5" />
                تسجيل الدخول
              </>
            )}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline"
            >
              نسيت كلمة المرور؟
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-border/50 text-center space-y-2">
          <p className="text-xs text-muted-foreground/60 font-medium">
            جميع الحقوق محفوظة © {new Date().getFullYear()}
          </p>
          <p className="text-sm text-muted-foreground/80 hover:text-primary transition-colors cursor-help font-medium pt-2" title="Contact Support">
            إذا لم تستطع الدخول، تواصل مع المبرمج <span className="font-bold text-foreground">Siradj Eddine Baballah</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
