'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="max-w-2xl w-full bg-card border border-destructive/50 rounded-xl shadow-lg p-8 space-y-6">
                        <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                            <h2 className="text-2xl font-bold text-destructive mb-2">حدث خطأ في النظام (Client-side Error)</h2>
                            <p className="text-muted-foreground font-medium">الرجاء التقاط صورة لهذه الشاشة وإرسالها للمطور.</p>
                        </div>

                        <div className="bg-slate-950 text-slate-50 p-6 rounded-xl overflow-auto max-h-[400px] dir-ltr text-left font-mono text-sm leading-relaxed border border-slate-800 shadow-inner">
                            <p className="font-bold text-red-400 mb-4 text-lg">{this.state.error?.toString()}</p>
                            <div className="pl-4 border-l-2 border-slate-700 opacity-80">
                                {this.state.errorInfo?.componentStack?.split('\n').map((line, i) => (
                                    <p key={i} className="whitespace-pre-wrap">{line}</p>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button
                                variant="outline"
                                onClick={() => window.location.reload()}
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                إعادة تحميل الصفحة
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
