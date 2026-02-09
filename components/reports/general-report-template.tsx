
import React from 'react';
import { formatDate, formatDateTime, formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge'; // Ensure we can use Badge or simulate it

interface GeneralTransaction {
    id: string;
    createdAt: string | Date;
    amount: number; // positive = income, negative = outcome
    description?: string;
    type?: string;
}

interface GeneralReportTemplateProps {
    entityName: string;
    entityType?: string;
    currency?: string;
    transactions: GeneralTransaction[];
    totals: {
        totalIncome: number;
        totalOutcome: number;
        totalBalance: number;
        count: number;
        initialCapital?: number; // Optional: incase we want to show it
    };
    filterDescription?: string;
    extraInfo?: Record<string, string | number | undefined>; // For things like "Owner", etc.
}

export function GeneralReportTemplate({
    entityName,
    entityType,
    currency = 'DZD',
    transactions,
    totals,
    filterDescription,
    extraInfo
}: GeneralReportTemplateProps) {
    return (
        <div className="bg-white text-black w-full px-8 py-4" dir="rtl">
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 10mm;
                        size: auto;
                    }
                    body {
                        visibility: hidden;
                        overflow: visible !important;
                        height: auto !important;
                        margin: 0;
                        padding: 0;
                    }

                    /* Aggressively hide potential artifacts */
                    embed, object, iframe, button, input, select, textarea, .sonner-toast, [role="dialog"], [data-state="open"], .fixed.inset-0 {
                        display: none !important;
                    }

                    /* Hide all SVGs not in the print portal */
                    body > :not(#print-portal) svg {
                        display: none !important;
                    }

                    #print-portal {
                        visibility: visible;
                        display: block !important;
                        position: absolute;
                        left: 0;
                        right: 0;
                        top: 0;
                        width: auto !important;
                        height: auto !important;
                        margin: 0;
                        padding: 0;
                        z-index: 2147483647;
                        background-color: white !important;
                        overflow: visible !important;
                    }
                    #print-portal * {
                        visibility: visible;
                    }
                }
            `}</style>

            {/* Header - Replicating PrintHeader but visible */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-orange-500/20">
                <div className="relative">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="w-24 h-24 object-contain"
                    />
                </div>

                <div className="flex flex-col items-end gap-2 text-left">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase font-heading">NOUADI AMIR</h1>
                    <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">Business Management Platform</p>
                    <div className="mt-2 text-right dir-ltr">
                        <p className="text-sm font-black text-slate-900">
                            {new Date().toLocaleDateString('en-GB').split('/').reverse().join('/')} :التاريخ
                        </p>
                    </div>
                </div>
            </div>

            {/* Report Title & Info */}
            <div className="mb-8 text-right">
                <h1 className="text-2xl font-bold text-slate-900 mb-4 text-right">
                    تقرير معاملات {entityType?.replace('تفاصيل ', '') || 'الجهة'}: <span className="text-black">{entityName}</span>
                </h1>

                <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-600 justify-start">
                    {extraInfo && Object.entries(extraInfo).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-1">
                            <span>{key}:</span>
                            <span className="text-black">{value}</span>
                        </div>
                    ))}
                </div>

                {filterDescription && (
                    <div className="mt-2 text-sm text-right bg-slate-50 p-1 rounded text-slate-500 inline-block px-4">
                        {filterDescription}
                    </div>
                )}
            </div>

            {/* Stats Cards - Matching Screenshot (Simple Rounded Cards) */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {/* Card 1: Capital/Operations (Rightmost in RTL) */}
                <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm bg-white min-h-[6rem]">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{totals.initialCapital !== undefined ? 'رأس المال' : 'العمليات'}</span>
                    </div>
                    <div className="self-end mt-auto text-left w-full">
                        <p className="text-sm font-extrabold text-orange-500 tracking-tighter break-all" dir="ltr">
                            {totals.initialCapital !== undefined ? formatCurrency(totals.initialCapital) : totals.count}
                        </p>
                        {totals.initialCapital !== undefined && <p className="text-[10px] text-slate-400 font-bold text-right">{currency}</p>}
                    </div>
                </div>

                {/* Card 2: Total Income */}
                <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm bg-white min-h-[6rem]">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">إجمالي المدخول</span>
                    </div>
                    <div className="self-end mt-auto text-left w-full">
                        <p className="text-sm font-extrabold text-slate-900 tracking-tighter break-all" dir="ltr">{formatCurrency(totals.totalIncome)}</p>
                        <p className="text-[10px] text-slate-400 font-bold text-right">{currency}</p>
                    </div>
                </div>

                {/* Card 3: Total Outcome */}
                <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm bg-white min-h-[6rem]">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">إجمالي المخروج</span>
                    </div>
                    <div className="self-end mt-auto text-left w-full">
                        <p className="text-sm font-extrabold text-slate-900 tracking-tighter break-all" dir="ltr">{formatCurrency(Math.abs(totals.totalOutcome))}</p>
                        <p className="text-[10px] text-slate-400 font-bold text-right">{currency}</p>
                    </div>
                </div>

                {/* Card 4: Balance (Leftmost in RTL) */}
                <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm bg-white min-h-[6rem]">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">الرصيد</span>
                    </div>
                    <div className="self-end mt-auto text-left w-full">
                        <p className={`text-sm font-extrabold ${totals.totalBalance < 0 ? 'text-red-600' : 'text-slate-900'} tracking-tighter break-all`} dir="ltr">
                            {totals.totalBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(totals.totalBalance))}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold text-right">{currency}</p>
                    </div>
                </div>
            </div>

            {/* Transactions Table Title */}
            <h3 className="text-lg font-bold text-slate-900 mb-4 text-left font-heading" dir="ltr">
                ({totals.count}) المعاملات
            </h3>

            {/* Table - Matching Screenshot style */}
            <div className="rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-700">
                        <tr>
                            <th className="py-3 px-4 text-start font-bold border-b border-slate-200 w-24">التاريخ</th>
                            <th className="py-3 px-4 text-start font-bold border-b border-slate-200 w-24">النوع</th>
                            <th className="py-3 px-4 text-end font-bold border-b border-slate-200">المدخول</th>
                            <th className="py-3 px-4 text-end font-bold border-b border-slate-200">المخروج</th>
                            <th className="py-3 px-4 text-start font-bold border-b border-slate-200">الوصف</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {transactions.map((t, idx) => (
                            <tr key={t.id || idx} className="hover:bg-slate-50/50">
                                <td className="py-3 px-4 font-medium text-slate-600">
                                    {formatDateTime(t.createdAt)}
                                </td>
                                <td className="py-3 px-4 text-start">
                                    <span className={cn(
                                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border",
                                        t.amount > 0
                                            ? "bg-white text-slate-700 border-slate-200"
                                            : "bg-slate-900 text-white border-transparent print-bg-black print-text-white"
                                    )}>
                                        {t.amount > 0 ? 'مدخول' : 'مخروج'}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-end font-bold text-slate-900" dir="ltr">
                                    {t.amount > 0 ? `+${formatCurrency(t.amount)}` : '/'}
                                </td>
                                <td className="py-3 px-4 text-end font-bold text-slate-900" dir="ltr">
                                    {t.amount < 0 ? (
                                        <span className="inline-block bg-slate-900 text-white px-2 py-0.5 rounded border border-transparent print-bg-black print-text-white">
                                            {formatCurrency(Math.abs(t.amount))}
                                        </span>
                                    ) : '/'}
                                </td>
                                <td className="py-3 px-4 text-slate-600">
                                    {t.description || '-'}
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                                    لا توجد بيانات للعرض
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer / Summary Info */}
            <div className="mt-12 pt-6 border-t border-slate-100 flex justify-start items-end">
                <div className="text-[9px] text-slate-400 font-medium text-right">
                    <p>تم استخراج هذا التقرير آلياً من منصة AMIR NOUADI لإدارة الأعمال</p>
                    <p>© {new Date().getFullYear()} جميع الحقوق محفوظة</p>
                </div>
            </div>
        </div>
    );
}
