'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MobileSidebarContent } from './sidebar';

export const MobileHeader = () => {
    return (
        <header className="lg:hidden h-16 border-b border-border bg-card/80 backdrop-blur-md fixed top-0 left-0 right-0 z-40 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-foreground">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="p-0 w-72 border-l border-border">
                        <MobileSidebarContent />
                    </SheetContent>
                </Sheet>
                <div className="flex items-center gap-3">
                    <div className="shrink-0 h-12 w-12 overflow-hidden flex items-center justify-center">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-col text-start">
                        <span className="font-heading font-black text-xl bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent leading-none">Amir Nouadi</span>
                        <span className="text-[10px] text-orange-600 dark:text-orange-500/80 font-bold uppercase mt-1 leading-none">نظام الإدارة</span>
                    </div>
                </div>
            </div>
        </header>
    );
};
