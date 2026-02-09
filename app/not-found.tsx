'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Card className="w-full max-w-md p-8 border-0 shadow-2xl text-center space-y-6">
        <div>
          <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
          <p className="text-xl font-semibold text-muted-foreground">الصفحة غير موجودة</p>
        </div>

        <p className="text-sm text-muted-foreground">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>

        <Link href="/dashboard">
          <Button className="w-full gap-2">
            <Home className="h-4 w-4" />
            العودة للرئيسية
          </Button>
        </Link>
      </Card>
    </div>
  );
}
