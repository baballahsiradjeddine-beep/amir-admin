'use client';

import Link from 'next/link';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppData } from '@/app/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, TrendingDown, AlertCircle, Clock, ArrowUpRight, ArrowDownLeft, Search, X, Building2, Truck, Banknote, ArrowLeftRight, FileText, ArrowDownRight, Coins, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn, convertToDZD, formatDateTime } from '@/lib/utils';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const { companies, fournisseurs, transactions, currencyTransactions, currencyCompanies, addTransaction, addCurrencyTransaction, updateCurrencyCompany, loading, fundCapital } = useAppData();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Currency transaction specific fields
  const [transactionsFilter, setTransactionsFilter] = useState('');
  // const [convertToLocal, setConvertToLocal] = useState(false); // Moved to component


  const formatCurrency = (num: number) => {
    const isNegative = num < 0;
    const str = Math.abs(num).toString();
    const formatted = str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return isNegative ? `-${formatted}` : formatted;
  };





  /** آخر المعاملات (عادية + عملة) مرتبة من الأحدث إلى الأقدم مع إمكانية الفلترة */
  const lastTransactionsSorted = useMemo(() => {
    // Filter to only show transactions for active entities
    const activeTransactions = transactions.filter(t => {
      if (t.type === 'company') return companies.some(c => c.id === t.companyId);
      if (t.type === 'fournisseur') return fournisseurs.some(f => f.id === t.fournisseurId);
      return true;
    });

    const activeCurrencyTransactions = currencyTransactions.filter(ct =>
      currencyCompanies.some(cc => cc.id === ct.currencyCompanyId)
    );

    const regular = activeTransactions.map((t) => ({ kind: 'regular' as const, createdAt: t.createdAt, data: t }));
    const currency = activeCurrencyTransactions.map((t) => ({ kind: 'currency' as const, createdAt: t.createdAt, data: t }));
    const combined = [...regular, ...currency]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (!transactionsFilter.trim()) {
      return combined.slice(0, 10);
    }

    const query = transactionsFilter.toLowerCase().trim();
    return combined.filter(item => {
      const dateStr = formatDateTime(item.createdAt).toLowerCase();
      if (item.kind === 'regular') {
        const t = item.data;
        const entityName = t.type === 'company'
          ? companies.find(c => c.id === t.companyId)?.name?.toLowerCase() || ''
          : fournisseurs.find(f => f.id === t.fournisseurId)?.name?.toLowerCase() || '';
        const amountStr = Math.abs(t.amount).toString();
        return t.description?.toLowerCase().includes(query) ||
          entityName.includes(query) ||
          dateStr.includes(query) ||
          amountStr.includes(query);
      } else {
        const t = item.data;
        const currencyCompany = currencyCompanies.find(cc => cc.id === t.currencyCompanyId)?.name?.toLowerCase() || '';
        const supplier = t.usdFournisseurId ? fournisseurs.find(f => f.id === t.usdFournisseurId)?.name?.toLowerCase() || '' : '';
        const amountStr = Math.abs(t.toAmount).toString();
        return t.description?.toLowerCase().includes(query) ||
          currencyCompany.includes(query) ||
          supplier.includes(query) ||
          dateStr.includes(query) ||
          amountStr.includes(query);
      }
    }).slice(0, 20);
  }, [transactions, currencyTransactions, transactionsFilter, companies, fournisseurs, currencyCompanies]);

  // Search functionality — بحث في كامل الموقع
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const query = searchQuery.toLowerCase().trim();
    const results = {
      companies: companies.filter(c =>
        c.name.toLowerCase().includes(query) ||
        (c.owner && c.owner.toLowerCase().includes(query)) ||
        (c.description && c.description.toLowerCase().includes(query))
      ),
      fournisseurs: fournisseurs.filter(f =>
        (f.name && f.name.toLowerCase().includes(query))
      ),
      currencyCompanies: currencyCompanies.filter(cc =>
        cc.name.toLowerCase().includes(query) ||
        (cc.description && cc.description.toLowerCase().includes(query))
      ),
      transactions: transactions.filter(t => {
        const entityName = t.type === 'company'
          ? companies.find(c => c.id === t.companyId)?.name?.toLowerCase() || ''
          : fournisseurs.find(f => f.id === t.fournisseurId)?.name?.toLowerCase() || '';
        const dateStr = formatDateTime(t.createdAt).toLowerCase();
        const amountStr = Math.abs(t.amount).toString();
        return (t.description && t.description.toLowerCase().includes(query)) ||
          entityName.includes(query) ||
          dateStr.includes(query) ||
          amountStr.includes(query);
      }),
      currencyTransactions: currencyTransactions.filter(ct => {
        const currencyCompany = currencyCompanies.find(cc => cc.id === ct.currencyCompanyId)?.name?.toLowerCase() || '';
        const supplier = ct.usdFournisseurId ? fournisseurs.find(f => f.id === ct.usdFournisseurId)?.name?.toLowerCase() || '' : '';
        const dateStr = formatDateTime(ct.createdAt).toLowerCase();
        const amountStr = Math.abs(ct.toAmount).toString();
        return (ct.description && ct.description.toLowerCase().includes(query)) ||
          currencyCompany.includes(query) ||
          supplier.includes(query) ||
          dateStr.includes(query) ||
          amountStr.includes(query);
      })
    };

    const hasAny = results.companies.length > 0 || results.fournisseurs.length > 0 ||
      results.currencyCompanies.length > 0 || results.transactions.length > 0 || results.currencyTransactions.length > 0;
    return hasAny ? results : null;
  }, [searchQuery, companies, fournisseurs, currencyCompanies, transactions, currencyTransactions]);

  // Calculate all metrics
  const currentCapital = useMemo(() => {
    // 0. Base Fund (Static from settings)
    const fundBase = (typeof fundCapital === 'object' && fundCapital !== null)
      ? (fundCapital.localCapital || 0)
      : (typeof fundCapital === 'number' ? fundCapital : 0);

    // 1. Regular Companies Movements (Withdrawals/Deposits)
    const companiesBalance = companies.reduce((sum, c) => {
      // workingCapital is the sum of all outcomes (-) and incomes (+)
      return sum + (c.workingCapital || 0);
    }, 0);

    // 2. Currency Companies Movements
    const currencyMovements = currencyTransactions
      .filter(t => currencyCompanies.some(cc => cc.id === t.currencyCompanyId))
      .reduce((sum, t) => {
        // Logic:
        // - fromAmount > 0 (Received USD): Add to capital (+ toAmount) to balance company debt.
        // - fromAmount === 0 (Paid Cash): Subtract from capital (- toAmount) because cash left the stash.
        return sum + (t.fromAmount > 0 ? (t.toAmount || 0) : -(t.toAmount || 0));
      }, 0);

    // FINAL: Fund Base + All Movements
    return fundBase + companiesBalance + currencyMovements;
  }, [companies, fundCapital, currencyCompanies, currencyTransactions]);

  // Foreign currency capital (USD from suppliers)
  const foreignCapitalUSD = useMemo(() => {
    const suppliersUsdTotal = fournisseurs
      .filter(f => f.currency === 'USD')
      .reduce((sum, f) => sum + (f.balance || 0), 0);
    return suppliersUsdTotal;
  }, [fournisseurs]);

  const foreignCapitalCNY = useMemo(() => {
    const suppliersCnyTotal = fournisseurs
      .filter(f => f.currency === 'RMB')
      .reduce((sum, f) => sum + (f.balance || 0), 0);
    return suppliersCnyTotal;
  }, [fournisseurs]);




  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-10 px-4 max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold font-heading text-gradient">لوحة التحكم</h1>
            <p className="text-muted-foreground font-medium">إدارة المعاملات والعملات بسهولة</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/transactions/new')}
            className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-orange-500/25 rounded-xl h-12 px-6 text-lg font-heading transition-all hover:scale-105"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            معاملة جديدة
          </Button>
        </div>

        {/* Search Bar — Modernized Glassmorphism */}
        < div className="relative max-w-2xl mx-auto w-full mb-8 z-50" dir="rtl" ref={searchRef} >
          <div className={cn(
            "flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 border border-border/50 shadow-lg group",
            searchFocused
              ? "bg-card ring-2 ring-primary/20 shadow-primary/10"
              : "bg-card/60 hover:bg-card shadow-black/5"
          )}>
            <div className={cn(
              "p-2 rounded-xl transition-colors duration-300",
              searchFocused ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"
            )}>
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="ابحث عن شركة، مزود، معاملة، تحويل عملة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              className="flex-1 outline-none text-lg font-medium text-foreground placeholder-muted-foreground bg-transparent min-w-0"
              aria-label="بحث في الموقع"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSearchFocused(true); }}
                className="p-2 hover:bg-muted rounded-xl transition-all duration-200"
                aria-label="مسح البحث"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* نتائج البحث — Modernized Results Dropdown */}
          {
            searchQuery.trim() && (
              <Card className="absolute top-full left-0 right-0 z-50 mt-4 max-h-[70vh] overflow-y-auto border border-border/40 shadow-2xl bg-card/98 backdrop-blur-xl rounded-2xl animate-in slide-in-from-top-2 duration-200">
                {searchResults ? (
                  <div className="p-4 space-y-6">
                    {searchResults.companies.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-orange-500" /> الشركات ({searchResults.companies.length})
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                          {searchResults.companies.map((c) => (
                            <Link
                              key={c.id}
                              href={`/dashboard/companies/details/${c.id}`}
                              className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-orange-500/5 group/item transition-all duration-200"
                              onClick={() => { setSearchQuery(''); setSearchFocused(false); }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 group-hover/item:bg-orange-500 group-hover/item:text-white transition-colors">
                                  <Building2 className="h-5 w-5" />
                                </div>
                                <div className="text-end">
                                  <p className="font-bold text-foreground group-hover/item:text-orange-600 transition-colors uppercase">{c.name}</p>
                                  {c.owner && <p className="text-xs text-muted-foreground">المالك: {c.owner}</p>}
                                </div>
                              </div>
                              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-all" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.fournisseurs.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Truck className="h-3.5 w-3.5 text-blue-500" /> المزودون ({searchResults.fournisseurs.length})
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                          {searchResults.fournisseurs.map((f) => (
                            <Link
                              key={f.id}
                              href={`/dashboard/fournisseurs/details/${f.id}`}
                              className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-blue-500/5 group/item transition-all duration-200"
                              onClick={() => { setSearchQuery(''); setSearchFocused(false); }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover/item:bg-blue-500 group-hover/item:text-white transition-colors">
                                  <Truck className="h-5 w-5" />
                                </div>
                                <div className="text-end">
                                  <p className="font-bold text-foreground group-hover/item:text-blue-600 transition-colors uppercase">{f.name}</p>
                                  <p className="text-xs text-muted-foreground">{f.currency}</p>
                                </div>
                              </div>
                              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-all" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.currencyCompanies.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Banknote className="h-3.5 w-3.5 text-green-500" /> مكاتب الصرف ({searchResults.currencyCompanies.length})
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                          {searchResults.currencyCompanies.map((cc) => (
                            <Link
                              key={cc.id}
                              href="/dashboard/currency"
                              className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-green-500/5 group/item transition-all duration-200"
                              onClick={() => { setSearchQuery(''); setSearchFocused(false); }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600 group-hover/item:bg-green-500 group-hover/item:text-white transition-colors">
                                  <Banknote className="h-5 w-5" />
                                </div>
                                <div className="text-end">
                                  <p className="font-bold text-foreground group-hover/item:text-green-600 transition-colors uppercase">{cc.name}</p>
                                  {cc.baseCurrency && <p className="text-xs text-muted-foreground">({cc.baseCurrency})</p>}
                                </div>
                              </div>
                              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-all" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.transactions.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-purple-500" /> معاملات ({searchResults.transactions.length})
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                          {searchResults.transactions.slice(0, 5).map((t) => (
                            <Link
                              key={t.id}
                              href="/dashboard/transactions"
                              className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-purple-500/5 group/item transition-all duration-200"
                              onClick={() => { setSearchQuery(''); setSearchFocused(false); }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 group-hover/item:bg-purple-500 group-hover/item:text-white transition-colors">
                                  <Clock className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1 text-end">
                                  <p className="font-bold text-foreground group-hover/item:text-purple-600 transition-colors line-clamp-1">{t.description || 'معاملة مالية'}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">{formatDateTime(t.createdAt)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className={cn("text-xs font-black font-heading", t.amount > 0 ? "text-green-600" : "text-red-600")}>
                                  {t.amount > 0 ? '+' : ''}{formatCurrency(t.amount)}
                                </span>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-all" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center space-y-4">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                      <Search className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-foreground">لا توجد نتائج</p>
                      <p className="text-sm text-muted-foreground italic">لم نجد أي شيء يطابق &quot;{searchQuery.trim()}&quot;</p>
                    </div>
                  </div>
                )}
              </Card>
            )
          }
        </div >

        <div className="grid grid-cols-1 gap-6">
          {/* Unified Global Balance Card */}
          <Card className="p-8 card-premium border-0 bg-card relative overflow-hidden group">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 via-amber-500/5 to-transparent rounded-bl-full -me-20 -mt-20 transition-transform group-hover:scale-110 duration-700" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-tr-full -ms-20 -mb-20 transition-transform group-hover:scale-110 duration-700" />

            <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-stretch">
              {/* Local Capital (Main) */}
              <div className="flex-1 space-y-4 flex flex-col justify-center">
                <div className="flex items-center gap-3">
                  <div className={`p-4 rounded-2xl ${currentCapital < 0 ? 'bg-red-500/10 text-red-600' : 'bg-primary/10 text-primary'} shadow-sm`}>
                    <TrendingUp className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black font-heading text-foreground">رأس المال المحلي</h3>
                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest leading-none">Local DZD Balance</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className={`text-4xl md:text-7xl font-black font-heading tracking-tight ${currentCapital < 0 ? 'text-red-600' : 'text-foreground'}`} dir="ltr">
                    {formatCurrency(currentCapital)}
                  </p>
                  <p className="text-sm font-black text-muted-foreground/80 mt-2 flex items-center gap-2 ps-1">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    المجموع الكلي بالدينار الجزائري
                  </p>
                </div>
              </div>

              {/* Vertical Divider (Desktop) / Horizontal (Mobile) */}
              <div className="hidden lg:block w-px bg-gradient-to-b from-border/10 via-border to-border/10 self-stretch opacity-50" />
              <div className="lg:hidden h-px bg-gradient-to-r from-border/10 via-border to-border/10 opacity-50" />

              {/* Foreign Currencies */}
              <div className="flex-[1.2] space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black font-heading text-foreground">الرصيد الأجنبي</h3>
                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest leading-none">Foreign Assets Balance</p>
                  </div>
                  <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-600 shadow-sm">
                    <Banknote className="h-7 w-7" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* USD Box */}
                  <div className="p-5 rounded-[2.5rem] bg-orange-500/5 border border-orange-500/10 hover:bg-orange-500/10 transition-all group/box shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest ps-1">US Dollar</p>
                      <Badge variant="outline" className="text-[10px] border-amber-500/20 bg-amber-500/5 text-amber-700">USD</Badge>
                    </div>
                    <p className="text-3xl md:text-4xl font-black font-heading text-foreground transition-transform group-hover/box:translate-x-1" dir="ltr">
                      {formatCurrency(foreignCapitalUSD)}
                    </p>
                  </div>

                  {/* CNY Box */}
                  <div className="p-5 rounded-[2.5rem] bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-all group/box shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-black text-blue-700 dark:text-blue-500 uppercase tracking-widest ps-1">Chinese Yuan</p>
                      <Badge variant="outline" className="text-[10px] border-blue-500/20 bg-blue-500/5 text-blue-700">CNY</Badge>
                    </div>
                    <p className="text-3xl md:text-4xl font-black font-heading text-foreground transition-transform group-hover/box:translate-x-1" dir="ltr">
                      {formatCurrency(foreignCapitalCNY)}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground font-black flex items-center gap-2 ps-1">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  صافي أرصدة المزودين بالعملات الأجنبية (الديون والمستحقات)
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Total Capital Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Summary Card */}
          <Card className="p-8 border-0 card-premium overflow-hidden group">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-br-full -ml-10 -mt-10 transition-transform group-hover:scale-110" />
            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold font-heading text-foreground">ملخص الأصول</h3>
                <div className="p-3 bg-green-500/10 rounded-2xl text-green-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                  <span className="text-sm font-bold text-muted-foreground">رأس مال محلي</span>
                  <span className={`text-lg font-black font-heading ${currentCapital < 0 ? 'text-red-600' : 'text-green-600'}`} dir="ltr">
                    {formatCurrency(currentCapital)} د.ج
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                  <span className="text-sm font-bold text-muted-foreground">دولار أمريكي</span>
                  <span className="text-lg font-black font-heading text-orange-600" dir="ltr">{formatCurrency(foreignCapitalUSD)} USD</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <span className="text-sm font-bold text-muted-foreground">يوان صيني</span>
                  <span className="text-lg font-black font-heading text-blue-600" dir="ltr">{formatCurrency(foreignCapitalCNY)} CNY</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                ملخص شامل للأصول المحلية والأجنبية
              </p>
            </div>
          </Card>

          {/* Status Card */}
          <Card className="p-8 border-0 card-premium overflow-hidden group">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-br-full -ml-10 -mt-10 transition-transform group-hover:scale-110" />
            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold font-heading text-foreground">حالة المحفظة</h3>
                <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between items-center p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                  <span className="text-sm font-bold text-muted-foreground">عدد الشركات</span>
                  <span className="text-xl font-black font-heading text-purple-600">{companies.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                  <span className="text-sm font-bold text-muted-foreground">عدد المزودين</span>
                  <span className="text-xl font-black font-heading text-indigo-600">{fournisseurs.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-fuchsia-500/5 border border-fuchsia-500/10">
                  <span className="text-sm font-bold text-muted-foreground">عدد مكاتب الصرف</span>
                  <span className="text-xl font-black font-heading text-fuchsia-600">
                    {currencyCompanies.length}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                معلومات إحصائية عن المحفظة والأداء العام
              </p>
            </div>
          </Card>
        </div>

        {/* Recent Transactions Section — مرتبة من الأحدث إلى الأقدم (الأخير أولاً) */}
        {
          (transactions.length > 0 || currencyTransactions.length > 0) && (
            <div className="space-y-4">
              {/* Recent Transactions Card - Modernized */}
              <Card className="border-0 card-premium overflow-hidden">
                <div className="p-6 pb-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 w-full">
                    <Clock className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold font-heading text-foreground">آخر المعاملات</h2>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث في المعاملات..."
                        value={transactionsFilter}
                        onChange={(e) => setTransactionsFilter(e.target.value)}
                        className="h-9 pr-9 text-xs rounded-xl bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
                      />
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary whitespace-nowrap" onClick={() => router.push('/dashboard/transactions')}>
                      عرض الكل
                    </Button>
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto -mx-6 px-6">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/20">
                        <th className="text-start py-4 px-6 font-bold font-heading text-foreground first:rounded-r-lg">التاريخ</th>
                        <th className="text-start py-4 px-6 font-bold font-heading text-foreground">نوع الكيان</th>
                        <th className="text-start py-4 px-6 font-bold font-heading text-foreground">الكيان</th>
                        <th className="text-start py-4 px-6 font-bold font-heading text-foreground">النوع</th>
                        <th className="text-start py-4 px-6 font-bold font-heading text-green-600">المدخول</th>
                        <th className="text-start py-4 px-6 font-bold font-heading text-red-600">المخرج</th>
                        <th className="text-start py-4 px-6 font-bold font-heading text-foreground">الوصف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastTransactionsSorted.map((item, index) => {
                        if (item.kind === 'regular') {
                          const transaction = item.data;
                          const fournisseur = transaction.type === 'fournisseur' ? fournisseurs.find(f => f.id === transaction.fournisseurId) : null;
                          const currencySuffix = transaction.type === 'company' ? 'د.ج' : (fournisseur?.currency || 'USD');

                          return (
                            <tr key={`${transaction.id}-${index}`} className="border-b border-border/50 hover:bg-muted/50 transition-colors group">
                              <td className="py-4 px-6 text-start text-muted-foreground font-medium">
                                {formatDateTime(transaction.createdAt)}
                              </td>
                              <td className="py-4 px-6 text-start">
                                <Badge
                                  className={`
                                  ${transaction.type === 'company' ? 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20' : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20'}
                                  border-0 px-3 py-1 rounded-lg
                                `}
                                >
                                  {transaction.type === 'company' ? 'شركة' : 'مزود'}
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-start font-bold text-foreground">
                                {transaction.type === 'company' && transaction.companyId
                                  ? companies.find(c => c.id === transaction.companyId)?.name || 'غير محدد'
                                  : transaction.type === 'fournisseur' && transaction.fournisseurId
                                    ? fournisseurs.find(f => f.id === transaction.fournisseurId)?.name || 'غير محدد'
                                    : 'غير محدد'}
                              </td>
                              <td className="py-4 px-6 text-start">
                                <Badge
                                  className={`
                                  ${transaction.amount > 0 ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20' :
                                      transaction.amount < 0 ? 'bg-red-500/10 text-red-700 hover:bg-red-500/20' :
                                        'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20'}
                                  border-0 px-3 py-1 rounded-lg
                                `}
                                >
                                  {transaction.amount > 0 ? 'مدخول' : transaction.amount < 0 ? 'مخروج' : 'دين'}
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-right font-bold text-green-600" dir="ltr">
                                {transaction.amount > 0 ? `+${formatCurrency(transaction.amount)} ${currencySuffix}` : '/'}
                              </td>
                              <td className="py-4 px-6 text-right font-bold text-red-600" dir="ltr">
                                {transaction.amount < 0 ? `-${formatCurrency(Math.abs(transaction.amount))} ${currencySuffix}` : '/'}
                              </td>
                              <td className="py-4 px-6 text-start text-muted-foreground text-sm max-w-[200px] truncate">
                                {transaction.description}
                              </td>
                            </tr>
                          );
                        } else {
                          const transaction = item.data;
                          const currencyCompany = currencyCompanies.find(cc => cc.id === transaction.currencyCompanyId);
                          const supplier = transaction.usdFournisseurId ? fournisseurs.find(f => f.id === transaction.usdFournisseurId) : null;

                          return (
                            <tr key={`${transaction.id}-${index}`} className="border-b border-border/50 hover:bg-muted/50 transition-colors group">
                              <td className="py-4 px-6 text-start text-muted-foreground font-medium">
                                {formatDateTime(transaction.createdAt)}
                              </td>
                              <td className="py-4 px-6 text-start">
                                <Badge className="bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 border-0 px-3 py-1 rounded-lg">
                                  تحويل عملة
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-start font-bold text-foreground">
                                {currencyCompany?.name || supplier?.name || 'غير محدد'}
                              </td>
                              <td className="py-4 px-6 text-start">
                                <Badge className={`bg-red-500/10 text-red-700 border-0 px-3 py-1 rounded-lg`}>
                                  مخروج
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-right font-bold text-green-600" dir="ltr">
                                {transaction.fromAmount > 0 ? `+${formatCurrency(transaction.toAmount)} د.ج` : '/'}
                              </td>
                              <td className="py-4 px-6 text-right font-bold text-red-600" dir="ltr">
                                {transaction.fromAmount === 0 ? `-${formatCurrency(transaction.toAmount)} د.ج` : '/'}
                              </td>
                              <td className="py-4 px-6 text-start text-muted-foreground text-sm max-w-[200px] truncate">
                                {transaction.description}
                              </td>
                            </tr>
                          );
                        }
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3 px-4 pb-4">
                  {lastTransactionsSorted.map((item, index) => {
                    const isRegular = item.kind === 'regular';
                    const transaction = item.data;
                    let entityName = '';
                    let typeLabel = '';
                    let amountDisplay = '';
                    let typeColorClass = '';
                    let amountColorClass = '';

                    if (isRegular) {
                      const t = transaction as any;
                      const isCompany = t.type === 'company';
                      entityName = isCompany
                        ? companies.find(c => c.id === t.companyId)?.name || 'غير محدد'
                        : fournisseurs.find(f => f.id === t.fournisseurId)?.name || 'غير محدد';

                      const fournisseur = !isCompany ? fournisseurs.find(f => f.id === t.fournisseurId) : null;
                      const currencySuffix = isCompany ? 'د.ج' : (fournisseur?.currency || 'USD');

                      if (t.amount > 0) {
                        typeLabel = 'مدخول';
                        typeColorClass = 'bg-green-500/10 text-green-700 border-green-500/20';
                        amountColorClass = 'text-green-600';
                        amountDisplay = `+${formatCurrency(t.amount)} ${currencySuffix}`;
                      } else {
                        typeLabel = 'مخروج';
                        typeColorClass = 'bg-red-500/10 text-red-700 border-red-500/20';
                        amountColorClass = 'text-red-600';
                        amountDisplay = `${formatCurrency(t.amount)} ${currencySuffix}`;
                      }
                    } else {
                      const t = transaction as any;
                      const currencyCompany = currencyCompanies.find(cc => cc.id === t.currencyCompanyId);
                      const supplier = t.usdFournisseurId ? fournisseurs.find(f => f.id === t.usdFournisseurId) : null;
                      entityName = currencyCompany?.name || supplier?.name || 'غير محدد';

                      typeLabel = 'تحويل عملة';
                      typeColorClass = 'bg-purple-500/10 text-purple-700 border-purple-500/20';

                      if (t.fromAmount > 0) {
                        // USD to DZD (Recieved DZD = Income)
                        amountColorClass = 'text-green-600';
                        amountDisplay = `+${formatCurrency(t.toAmount)} د.ج`;
                      } else {
                        // Paid DZD to buy USD or just paid DZD
                        amountColorClass = 'text-red-600';
                        amountDisplay = `-${formatCurrency(t.toAmount)} د.ج`;
                      }
                    }

                    return (
                      <div key={`${transaction.id}-${index}-mobile`} className="bg-card/50 border border-border/50 rounded-xl p-4 shadow-sm active:scale-[0.98] transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-foreground text-base">{entityName}</p>
                            <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(transaction.createdAt)}
                            </p>
                          </div>
                          <Badge className={`${typeColorClass} border px-2 py-0.5 text-[10px] font-bold rounded-lg`}>
                            {typeLabel}
                          </Badge>
                        </div>

                        <div className="flex justify-between items-end mt-3">
                          <div className="flex-1 min-w-0 md:max-w-[70%]">
                            <p className="text-xs text-muted-foreground line-clamp-1 italic">
                              {transaction.description || 'لا يوجد وصف'}
                            </p>
                          </div>
                          <p className={`text-lg font-black font-heading ${amountColorClass}`} dir="ltr">
                            {amountDisplay}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )
        }

        {
          !transactions.length && !currencyTransactions.length && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">لا توجد معاملات حتى الآن</p>
            </div>
          )
        }
      </div >
    </div >
  );
}
