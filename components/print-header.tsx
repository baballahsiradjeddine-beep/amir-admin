import React from 'react';

export function PrintHeader() {
    return (
        <div className="hidden print:flex items-center justify-between mb-8 pb-6 border-b-2 border-orange-500/20" dir="rtl">
            <div className="relative">
                <img
                    src="/logo.png"
                    alt="Logo"
                    className="w-24 h-24 object-contain"
                />
            </div>

            <div className="flex flex-col items-end gap-2 text-left">
                <h1 className="text-4xl font-black font-heading tracking-tight text-foreground">NOUADI AMIR</h1>
                <p className="text-sm font-bold text-muted-foreground/80 tracking-wide uppercase">Business Management Platform</p>
                <div className="mt-2">
                    <p className="text-sm font-black text-foreground">
                        التاريخ: {new Date().toLocaleDateString('en-GB').split('/').reverse().join('/')}
                    </p>
                </div>
            </div>
        </div>
    );
}
