import { formatDate, formatDateTime, formatCurrency, cn } from '@/lib/utils';

interface Transaction {
    id: string;
    createdAt: string | Date;
    fromAmount: number;
    toAmount: number;
    exchangeRateUsed: number;
    description?: string;
}

interface Company {
    name: string;
    baseCurrency: string;
    targetCurrency: string;
    baseCurrencies?: string[];
    targetCurrencies?: string[];
    description?: string;
}

interface CurrencyReportTemplateProps {
    company: Company;
    transactions: Transaction[];
    totals: {
        totalIncome: number;
        totalOutcome: number;
        totalTransactions: number;
    };
    filterDescription?: string;
}

export function CurrencyReportTemplate({ company, transactions, totals, filterDescription }: CurrencyReportTemplateProps) {
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

            {/* Header */}
            <div className="flex items-center justify-between mb-2 pb-6 border-b border-slate-100">
                <div className="relative">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="w-24 h-24 object-contain"
                    />
                </div>

                <div className="flex flex-col items-end gap-2 text-left">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase font-heading">NOUADI AMIR</h1>
                    <p className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">Business Management Platform</p>
                    <div className="mt-2 text-right dir-ltr">
                        <p className="text-sm font-black text-slate-900">
                            {new Date().toLocaleDateString('en-GB').split('/').reverse().join('/')} :التاريخ
                        </p>
                    </div>
                </div>
            </div>

            {/* Report Title & Info */}
            <div className="mb-8 text-right pt-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-4 text-right">
                    تقرير معاملات شركة: <span className="text-black">{company.name}</span>
                </h1>

                <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-600 justify-start">
                    <div className="flex items-center gap-1">
                        <span>العملة الأساسية:</span>
                        <span className="text-black">{company.baseCurrency}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span>عملة الصرف:</span>
                        <span className="text-black">{company.targetCurrency}</span>
                    </div>
                </div>

                {filterDescription && (
                    <div className="mt-4 text-[10px] text-right bg-slate-50 p-1 rounded text-slate-500 inline-block px-4 font-bold border border-slate-100">
                        {filterDescription}
                    </div>
                )}
            </div>

            {/* Stats Grid - Simplified to Net Balance */}
            <div className="grid grid-cols-2 gap-4 mb-10">
                <div className={`border p-4 rounded-xl text-center shadow-sm ${(totals.totalIncome - totals.totalOutcome) > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                    <p className="text-[9px] font-bold text-slate-500 mb-1 uppercase">الرصيد الحالي (Net DZD Balance)</p>
                    <p className={`text-2xl font-black ${(totals.totalIncome - totals.totalOutcome) > 0 ? 'text-red-700' : 'text-green-700'}`} dir="ltr">
                        {(totals.totalIncome - totals.totalOutcome).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DZD
                    </p>
                </div>
                <div className="border border-slate-200 p-4 rounded-xl bg-white text-center shadow-sm">
                    <p className="text-[9px] font-bold text-slate-500 mb-1 uppercase">إجمالي المعاملات</p>
                    <p className="text-2xl font-black text-slate-800" dir="ltr">{totals.totalTransactions}</p>
                </div>
            </div>

            {/* Table */}
            <div className="w-full">
                <table className="w-full text-[11px] border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-slate-700">
                            <th className="py-3 px-4 text-start font-bold border-b-2 border-slate-200 w-32">التاريخ</th>
                            <th className="py-3 px-4 text-end font-bold border-b-2 border-slate-200">المبلغ بالدينار (DZD)</th>
                            <th className="py-3 px-4 text-end font-bold border-b-2 border-slate-200">المبلغ (عملة صعبة)</th>
                            <th className="py-3 px-4 text-center font-bold border-b-2 border-slate-200 w-24">سعر الصرف</th>
                            <th className="py-3 px-4 text-start font-bold border-b-2 border-slate-200">الوصف</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {transactions.map((t, idx) => {
                            const isIncome = t.fromAmount > 0;
                            const dzdAmount = isIncome ? (t.toAmount || 0) : -(t.toAmount || 0);

                            return (
                                <tr key={t.id || idx} className="hover:bg-slate-50/50">
                                    <td className="py-3 px-4 font-medium text-slate-600">
                                        {formatDateTime(t.createdAt)}
                                    </td>
                                    <td className={`py-3 px-4 text-end font-bold ${dzdAmount > 0 ? 'text-red-700' : 'text-green-700'}`} dir="ltr">
                                        {dzdAmount > 0 ? '+' : ''}{formatCurrency(dzdAmount)}
                                    </td>
                                    <td className="py-3 px-4 text-end font-bold" dir="ltr">
                                        {t.fromAmount > 0 ? (
                                            <span className="inline-block bg-slate-900 text-white px-2 py-0.5 rounded border border-transparent print-bg-black print-text-white">
                                                {formatCurrency(t.fromAmount)}
                                            </span>
                                        ) : '/'}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600 border border-slate-200">
                                            {t.exchangeRateUsed.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-600 whitespace-pre-wrap max-w-xs">
                                        {t.description || '-'}
                                    </td>
                                </tr>
                            );
                        })}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                                    لا توجد بيانات للعرض في هذه الفترة
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
