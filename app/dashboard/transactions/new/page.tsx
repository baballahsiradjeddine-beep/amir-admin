'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppData } from '@/app/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/currency-input';
import { Building2, Truck, ArrowLeftRight, Banknote, RefreshCw, Plus, ArrowDownRight, Coins, ChevronRight } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

export default function NewTransactionPage() {
    const router = useRouter();
    const {
        companies,
        fournisseurs,
        currencyCompanies,
        addTransaction,
        addCurrencyTransaction
    } = useAppData();

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Local State
    const [selectedType, setSelectedType] = useState<'company' | 'fournisseur' | 'currency'>('company');
    const [expression, setExpression] = useState('');
    const [rate, setRate] = useState('1');
    const [description, setDescription] = useState('');
    const [selectedEntity, setSelectedEntity] = useState('');
    const [transactionType, setTransactionType] = useState<'income' | 'outcome'>('outcome');

    // Currency specific
    const [currencyCompanyId, setCurrencyCompanyId] = useState('');
    const [usdAmount, setUsdAmount] = useState('');
    const [usdFournisseurId, setUsdFournisseurId] = useState('');
    const [dzdAmount, setDzdAmount] = useState('');
    const [calculatedDzdAmount, setCalculatedDzdAmount] = useState('');
    const [dzdCompanyId, setDzdCompanyId] = useState('');
    const [dzdDescription, setDzdDescription] = useState('');
    const [usdDescription, setUsdDescription] = useState('');
    const [currencyType, setCurrencyType] = useState<'USD' | 'CNY'>('USD');
    const [exchangeRate, setExchangeRate] = useState('');
    const [dzdCurrencyCompanyId, setDzdCurrencyCompanyId] = useState('');
    const [usdCurrencyCompanyId, setUsdCurrencyCompanyId] = useState('');
    const [usdToDzdRate, setUsdToDzdRate] = useState('1');
    const [exchangeOperation, setExchangeOperation] = useState<'multiply' | 'divide'>('multiply');
    const [convertToLocal, setConvertToLocal] = useState(false);

    const calculateResult = () => {
        try {
            if (!expression.trim()) return 0;
            // eslint-disable-next-line no-eval
            const result = eval(expression.replace(/[^0-9+\-*/().]/g, ''));
            return isNaN(result) ? 0 : result;
        } catch {
            return 0;
        }
    };

    const parseFormattedNumber = (value: string) => {
        return value.replace(/ /g, '');
    };

    const formatNumberInput = (value: string) => {
        const digits = value.replace(/\D/g, '');
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    const handleRegularTransaction = async () => {
        const amount = calculateResult();
        const rateValue = parseFloat(rate) || 1;
        const centimes = Math.round(amount * rateValue * 100) / 100;

        if (!selectedEntity || !expression) {
            toast.error('يرجى ملء جميع الحقول');
            return;
        }

        const transactionAmount = transactionType === 'income' ? centimes : -centimes;

        try {
            setIsSubmitting(true);
            await addTransaction({
                type: selectedType as 'company' | 'fournisseur',
                amount: transactionAmount,
                rate: rateValue,
                description: description || 'معاملة جديدة',
                companyId: selectedType === 'company' ? selectedEntity : undefined,
                fournisseurId: selectedType === 'fournisseur' ? selectedEntity : undefined,
            });

            toast.success('تمت إضافة المعاملة بنجاح');
            router.push('/dashboard');
        } catch (error) {
            console.error('Error adding transaction:', error);
            toast.error('حدث خطأ أثناء إضافة المعاملة');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCurrencyTransaction = async () => {
        const getCleanNumber = (val: string) => {
            if (!val) return 0;
            const cleaned = val.replace(/[^\d.]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        };

        const dzdValue = getCleanNumber(dzdAmount);
        const usdValue = getCleanNumber(usdAmount);

        if (!currencyCompanyId) {
            toast.error('يرجى اختيار نوع التحويل');
            return;
        }

        try {
            setIsSubmitting(true);

            if (currencyCompanyId === 'dzd') {
                if (dzdValue <= 0) {
                    toast.error('يرجى إدخال مبلغ صحيح');
                    setIsSubmitting(false);
                    return;
                }
                if (!dzdCurrencyCompanyId) {
                    toast.error('يرجى اختيار شركة العملة');
                    setIsSubmitting(false);
                    return;
                }

                await addCurrencyTransaction({
                    currencyCompanyId: dzdCurrencyCompanyId,
                    fromAmount: 0,
                    toAmount: dzdValue,
                    exchangeRateUsed: 1,
                    commissionAmount: 0,
                    description: dzdDescription || `تحويل دينار (مخروج) إلى ${currencyCompanies.find(cc => cc.id === dzdCurrencyCompanyId)?.name || 'شركة عملة'}`,
                    usdFournisseurId: undefined,
                    dzdCompanyId: undefined,
                    usdDescription: undefined,
                    dzdDescription: dzdDescription || undefined,
                });
            }
            else if (currencyCompanyId === 'both') {
                if (usdValue <= 0) {
                    toast.error('يرجى إدخال مبلغ الدولار');
                    setIsSubmitting(false);
                    return;
                }
                if (!usdFournisseurId) {
                    toast.error('يرجى اختيار المزود');
                    setIsSubmitting(false);
                    return;
                }
                if (!dzdCompanyId) {
                    toast.error('يرجى اختيار الشركة');
                    setIsSubmitting(false);
                    return;
                }

                if (dzdValue > 0 && dzdCurrencyCompanyId) {
                    await addCurrencyTransaction({
                        currencyCompanyId: dzdCurrencyCompanyId,
                        fromAmount: 0,
                        toAmount: dzdValue,
                        exchangeRateUsed: 1,
                        commissionAmount: 0,
                        description: dzdDescription || 'تحويل دينار (جزء من معاملة)',
                        usdFournisseurId: undefined,
                        dzdCompanyId: undefined,
                        usdDescription: undefined,
                        dzdDescription: dzdDescription || undefined,
                    });
                }

                const rateVal = parseFloat(usdToDzdRate) || 1;
                const calculatedDzd = usdValue * rateVal;

                await addCurrencyTransaction({
                    currencyCompanyId: dzdCurrencyCompanyId,
                    fromAmount: usdValue,
                    toAmount: calculatedDzd,
                    exchangeRateUsed: rateVal,
                    commissionAmount: 0,
                    description: `تحويل ${currencyType} من العملة الصعبة`,
                    usdFournisseurId: usdFournisseurId,
                    dzdCompanyId: dzdCompanyId,
                    usdDescription: usdDescription || undefined,
                    dzdDescription: undefined,
                });
            }

            toast.success('تم تسجيل العملية بنجاح');
            router.push('/dashboard');

        } catch (error) {
            console.error('Transaction Error:', error);
            toast.error('حدث خطأ أثناء تسجيل المعاملة');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = () => {
        if (selectedType === 'currency') {
            handleCurrencyTransaction();
        } else {
            handleRegularTransaction();
        }
    };

    // Helpers to reset state
    function resetFormForTypeChange(newType: any) {
        setSelectedEntity('');
        setExpression('');
        setDescription('');
        setTransactionType('income');
    }
    function resetFormForCurrency() {
        setCurrencyCompanyId('');
        setUsdAmount('');
        setDzdAmount('');
        setUsdFournisseurId('');
        setDzdCompanyId('');
    }
    function resetFormForCurrencySpecific(id: any) {
        setCurrencyCompanyId(id);
        setUsdAmount('');
        setDzdAmount('');
        setCalculatedDzdAmount('');
        setDzdCurrencyCompanyId('');
        setUsdCurrencyCompanyId('');
        setDzdDescription('');
        setUsdDescription('');
        setUsdFournisseurId('');
        setExchangeRate('');
        setUsdToDzdRate('1');
        setExchangeOperation('multiply');
        setDzdCompanyId('');
    }

    return (
        <div className="container max-w-5xl mx-auto py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl hover:bg-muted">
                    <ChevronRight className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black font-heading text-foreground">معاملة جديدة</h1>
                    <p className="text-muted-foreground font-medium">إضافة عملية مالية أو تحويل عملة بشكل مفصل</p>
                </div>
            </div>

            <Card className="border-0 card-premium overflow-hidden p-8 shadow-xl">
                <div className="space-y-8">
                    {/* Step 1: Select Type */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-1.5 bg-primary rounded-full" />
                            <p className="text-lg font-black text-foreground uppercase">1. نوع العملية</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: 'company', icon: Building2, title: 'شركة', sub: 'معاملات محلية', color: 'blue' },
                                { id: 'fournisseur', icon: Truck, title: 'مزود', sub: 'عملات أجنبية', color: 'orange' },
                                { id: 'currency', icon: ArrowLeftRight, title: 'تحويل', sub: 'بين العملات', color: 'purple' }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => {
                                        setSelectedType(type.id as any);
                                        if (type.id !== 'currency') {
                                            resetFormForTypeChange(type.id);
                                        } else {
                                            resetFormForCurrency();
                                        }
                                    }}
                                    className={cn(
                                        "relative group p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden text-start h-full",
                                        selectedType === type.id
                                            ? `border-${type.color}-500 bg-${type.color}-500/5 shadow-lg shadow-${type.color}-500/10 scale-[1.02]`
                                            : "border-border/40 bg-card hover:border-primary/20 hover:bg-accent/30"
                                    )}
                                >
                                    <div className="flex items-center gap-4 h-full">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center bg-background shadow-sm border border-border/40 transition-transform duration-300 group-hover:scale-110 shrink-0",
                                            selectedType === type.id && `ring-2 ring-${type.color}-500/20`
                                        )}>
                                            <type.icon className={cn("h-7 w-7", selectedType === type.id ? `text-${type.color}-600` : "text-muted-foreground/60")} />
                                        </div>
                                        <div>
                                            <p className="font-black text-foreground text-xl">{type.title}</p>
                                            <p className="text-sm text-muted-foreground font-medium mt-1">{type.sub}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-border/50 w-full" />

                    {/* Forms */}
                    {selectedType !== 'currency' ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-1.5 bg-primary rounded-full" />
                                <p className="text-lg font-black text-foreground uppercase">2. تفاصيل {selectedType === 'company' ? 'الشركة' : 'المزود'}</p>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-1 gap-8">
                                    {/* Row 1: Type & Entity */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label className="text-base font-bold text-foreground/80">نوع الحركة المالية</Label>
                                            <div className="grid grid-cols-2 gap-3 p-1 bg-muted/30 rounded-xl border border-border/50">
                                                <button
                                                    onClick={() => setTransactionType('income')}
                                                    className={cn(
                                                        "h-12 rounded-lg font-bold text-sm transition-all duration-300",
                                                        transactionType === 'income'
                                                            ? "bg-green-600 text-white shadow-lg shadow-green-500/20"
                                                            : "text-muted-foreground hover:bg-background/50"
                                                    )}
                                                >
                                                    <span className="flex items-center justify-center gap-2">
                                                        <Plus className="h-4 w-4" />
                                                        مدخول (+ إضافة)
                                                    </span>
                                                </button>
                                                {selectedType !== 'fournisseur' && (
                                                    <button
                                                        onClick={() => setTransactionType('outcome')}
                                                        className={cn(
                                                            "h-12 rounded-lg font-bold text-sm transition-all duration-300",
                                                            transactionType === 'outcome'
                                                                ? "bg-red-600 text-white shadow-lg shadow-red-500/20"
                                                                : "text-muted-foreground hover:bg-background/50"
                                                        )}
                                                    >
                                                        <span className="flex items-center justify-center gap-2">
                                                            <ArrowDownRight className="h-4 w-4" />
                                                            مخرج (- سحب)
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-base font-bold text-foreground/80">الجهة المستهدفة</Label>
                                            <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                                                <SelectTrigger className="h-14 bg-background border-border/60 rounded-xl shadow-sm hover:border-primary/30 transition-colors text-lg font-medium">
                                                    <SelectValue placeholder="اختر من القائمة..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl max-h-[300px]">
                                                    {(selectedType === 'company' ? companies : fournisseurs).map(e => (
                                                        <SelectItem key={e.id} value={e.id} className="text-base py-3">{e.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Row 2: Amount & Rate */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2 space-y-3">
                                            <Label className="text-base font-bold text-foreground/80">المبلغ أو العملية الحسابية</Label>
                                            <Input
                                                value={expression}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    // Only format if it looks like a pure number to avoid messing up cursor position during complex math
                                                    const clean = val.replace(/ /g, '');
                                                    if (/^\d*\.?\d*$/.test(clean)) {
                                                        const parts = clean.split('.');
                                                        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                                                        setExpression(parts.join('.'));
                                                    } else {
                                                        setExpression(val);
                                                    }
                                                }}
                                                placeholder="مثال: 1000 + 500"
                                                dir="ltr"
                                                className="h-16 bg-background border-border/60 rounded-xl shadow-sm font-mono text-3xl font-black text-right hover:border-primary/30 transition-colors placeholder:text-muted-foreground/30"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-base font-bold text-foreground/80">سعر الصرف</Label>
                                            <CurrencyInput
                                                value={rate}
                                                onValueChange={setRate}
                                                placeholder="1"
                                                dir="ltr"
                                                className="h-16 bg-background border-border/60 rounded-xl shadow-sm text-center font-black text-3xl hover:border-primary/30 transition-colors placeholder:text-muted-foreground/30"
                                            />
                                        </div>
                                    </div>

                                    {/* Row 3: Description */}
                                    <div className="space-y-3">
                                        <Label className="text-base font-bold text-foreground/80">ملاحظات إضافية</Label>
                                        <Textarea
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="اكتب تفاصيل المعاملة هنا..."
                                            className="min-h-[100px] bg-background border-border/60 rounded-xl shadow-sm resize-none text-base hover:border-primary/30 transition-colors"
                                        />
                                    </div>

                                    {/* Row 4: Total Amount Card (Smaller & Rectangular) */}
                                    <div className={cn(
                                        "w-full p-6 rounded-[2rem] border transition-all duration-500 overflow-hidden relative shadow-sm flex flex-col justify-center items-center text-center gap-2",
                                        transactionType === 'income'
                                            ? 'bg-green-500/5 border-green-500/20 shadow-green-500/5'
                                            : 'bg-red-500/5 border-red-500/20 shadow-red-500/5'
                                    )}>
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">TOTAL AMOUNT</p>
                                        <div className="flex items-baseline justify-center gap-2" dir="ltr">
                                            <span className={cn(
                                                "text-5xl font-black font-heading tracking-tighter transition-colors duration-500",
                                                transactionType === 'income' ? 'text-green-600' : 'text-red-600'
                                            )}>
                                                {selectedType === 'fournisseur'
                                                    ? (isNaN(calculateResult()) ? '0' : formatCurrency(calculateResult()))
                                                    : (isNaN(calculateResult() * (parseFloat(rate) || 1)) ? '0' : formatCurrency(Math.round(calculateResult() * (parseFloat(rate) || 1) * 100) / 100))
                                                }
                                            </span>
                                            <span className="text-xl font-bold text-muted-foreground/40 font-heading">
                                                {selectedType === 'fournisseur' ? 'USD/CNY' : 'DZD'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Select Sub-Type */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-1.5 bg-purple-500 rounded-full" />
                                    <p className="text-lg font-black text-foreground uppercase">2. تفاصيل التحويل</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { id: 'dzd', icon: Coins, title: 'دينار فقط', sub: 'سحب دينار من الصندوق لشركة عملة', color: 'green' },
                                        { id: 'both', icon: ArrowLeftRight, title: 'عملة مركبة', sub: 'شراء دولار/يوان وتحويله لمزود', color: 'purple' }
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => {
                                                setCurrencyCompanyId(type.id);
                                                resetFormForCurrencySpecific(type.id);
                                            }}
                                            className={cn(
                                                "relative group p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden text-start h-full",
                                                currencyCompanyId === type.id
                                                    ? `border-${type.color}-500 bg-${type.color}-500/5 shadow-lg shadow-${type.color}-500/10 scale-[1.02]`
                                                    : "border-border/40 bg-card hover:border-primary/20 hover:bg-accent/30"
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center bg-background shadow-sm border border-border/40 transition-transform duration-300 group-hover:scale-110",
                                                    currencyCompanyId === type.id && `ring-2 ring-${type.color}-500/20`
                                                )}>
                                                    <type.icon className={cn("h-6 w-6", currencyCompanyId === type.id ? `text-${type.color}-600` : "text-muted-foreground/60")} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-black text-foreground text-lg">{type.title}</p>
                                                    <p className="text-sm text-muted-foreground font-medium mt-0.5">{type.sub}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Conditional Forms */}
                            {currencyCompanyId && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {currencyCompanyId === 'dzd' ? (
                                        // DZD Only
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <div className="p-6 rounded-[2rem] bg-card border border-border/60 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
                                                    <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500" />
                                                    <div className="space-y-6 ps-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                                                <Coins className="h-5 w-5" />
                                                            </div>
                                                            <h3 className="text-lg font-black text-foreground">بيانات التحويل</h3>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                <Label className="font-bold text-muted-foreground">شركة العملة المستفيدة</Label>
                                                                <Select value={dzdCurrencyCompanyId} onValueChange={setDzdCurrencyCompanyId}>
                                                                    <SelectTrigger className="h-12 bg-muted/30 border-border/50"><SelectValue placeholder="اختر شركة العملة..." /></SelectTrigger>
                                                                    <SelectContent className="rounded-xl">
                                                                        {currencyCompanies.map(c => <SelectItem key={c.id} value={c.id} className="py-3 text-base">{c.name}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label className="font-bold text-muted-foreground">مبلغ التحويل (DZD)</Label>
                                                                <CurrencyInput
                                                                    value={dzdAmount}
                                                                    onValueChange={setDzdAmount}
                                                                    className="h-12 font-black text-2xl text-center bg-muted/30 border-border/50 rounded-xl shadow-sm"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label className="font-bold text-muted-foreground">ملاحظات</Label>
                                                                <Textarea
                                                                    value={dzdDescription}
                                                                    onChange={e => setDzdDescription(e.target.value)}
                                                                    placeholder="تفاصيل إضافية..."
                                                                    className="min-h-[100px] bg-muted/30 border-border/50 rounded-xl resize-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Summary/Visual Side */}
                                            <div className="hidden md:flex flex-col justify-center items-center p-8 rounded-[2.5rem] border-2 border-dashed border-border/50 bg-muted/20 text-center space-y-4">
                                                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                                                    <Banknote className="h-12 w-12 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="text-2xl font-black text-foreground">تحويل مباشر</h4>
                                                    <p className="text-muted-foreground max-w-xs mx-auto mt-2">سيتم خصم المبلغ من الصندوق وتسجيله كدين على شركة العملة المختارة.</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // Complex Transaction
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {/* Section 1: DZD Source */}
                                                <div className="p-6 rounded-[2rem] bg-card border border-border/60 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
                                                    <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500" />
                                                    <div className="space-y-6 ps-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                                                <Coins className="h-5 w-5" />
                                                            </div>
                                                            <h3 className="text-lg font-black text-foreground">المصدر (دينار)</h3>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                <Label className="font-bold text-muted-foreground">شركة العملة الوسيطة</Label>
                                                                <Select value={dzdCurrencyCompanyId} onValueChange={setDzdCurrencyCompanyId}>
                                                                    <SelectTrigger className="h-12 bg-muted/30 border-border/50"><SelectValue placeholder="اختر..." /></SelectTrigger>
                                                                    <SelectContent>{currencyCompanies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="font-bold text-muted-foreground">المبلغ المسحوب (DZD)</Label>
                                                                <CurrencyInput value={dzdAmount} onValueChange={setDzdAmount} className="h-12 text-center font-bold bg-muted/30 border-border/50" placeholder="0.00" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Section 2: Foreign Currency */}
                                                <div className="p-6 rounded-[2rem] bg-card border border-border/60 shadow-sm relative overflow-hidden group hover:border-orange-500/30 transition-all duration-300">
                                                    <div className="absolute top-0 right-0 w-1.5 h-full bg-orange-500" />
                                                    <div className="space-y-6 ps-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                                                                <RefreshCw className="h-5 w-5" />
                                                            </div>
                                                            <h3 className="text-lg font-black text-foreground">التحويل (عملة صعبة)</h3>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label className="font-bold text-muted-foreground">العملة</Label>
                                                                <Select value={currencyType} onValueChange={(val: any) => setCurrencyType(val)}>
                                                                    <SelectTrigger className="h-12 bg-muted/30 border-border/50"><SelectValue /></SelectTrigger>
                                                                    <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="CNY">CNY</SelectItem></SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="font-bold text-muted-foreground">المبلغ ({currencyType})</Label>
                                                                <CurrencyInput
                                                                    value={usdAmount}
                                                                    onValueChange={(val) => {
                                                                        setUsdAmount(val);
                                                                        const rate = parseFloat(usdToDzdRate) || 0;
                                                                        const usd = parseFloat(parseFormattedNumber(val)) || 0;
                                                                        setCalculatedDzdAmount(formatNumberInput((usd * rate).toString()));
                                                                    }}
                                                                    className="h-12 text-center font-bold bg-muted/30 border-border/50"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="font-bold text-muted-foreground">المزود المستفيد</Label>
                                                            <Select value={usdFournisseurId} onValueChange={setUsdFournisseurId}>
                                                                <SelectTrigger className="h-12 bg-muted/30 border-border/50"><SelectValue placeholder="اختر المزود..." /></SelectTrigger>
                                                                <SelectContent>{fournisseurs.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Section 3: Debt Allocation */}
                                            <div className="p-6 rounded-[2rem] bg-card border border-border/60 shadow-sm relative overflow-hidden group hover:border-red-500/30 transition-all duration-300">
                                                <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500" />
                                                <div className="space-y-6 ps-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
                                                            <ArrowDownRight className="h-5 w-5" />
                                                        </div>
                                                        <h3 className="text-lg font-black text-foreground">توزيع الدين (على شركة)</h3>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <Label className="font-bold text-muted-foreground">الشركة المدينة</Label>
                                                            <Select value={dzdCompanyId} onValueChange={setDzdCompanyId}>
                                                                <SelectTrigger className="h-12 bg-muted/30 border-border/50"><SelectValue placeholder="اختر الشركة..." /></SelectTrigger>
                                                                <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="font-bold text-muted-foreground">سعر التحويل للدينار</Label>
                                                            <Input
                                                                type="number"
                                                                value={usdToDzdRate}
                                                                onChange={e => {
                                                                    setUsdToDzdRate(e.target.value);
                                                                    if (usdAmount) {
                                                                        const rate = parseFloat(e.target.value) || 0;
                                                                        const usd = parseFloat(parseFormattedNumber(usdAmount)) || 0;
                                                                        setCalculatedDzdAmount(formatNumberInput((usd * rate).toString()));
                                                                    }
                                                                }}
                                                                dir="ltr"
                                                                className="h-12 bg-muted/30 border-border/50 text-center font-bold"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="bg-muted/10 p-4 rounded-xl border border-border/50 flex justify-between items-center shadow-sm">
                                                        <span className="font-bold text-muted-foreground">إجمالي الدين المحسوب:</span>
                                                        <span className="text-2xl font-black text-red-600 font-mono" dir="ltr">{calculatedDzdAmount || '0'} DZD</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>

            {/* Submit Button Area */}
            <div className="sticky bottom-4 z-50">
                <Button
                    onClick={handleSubmit}
                    className={cn(
                        "w-full h-16 rounded-2xl font-heading font-black text-xl transition-all duration-300 shadow-xl hover:scale-[1.01] active:scale-[0.99]",
                        selectedType === 'currency'
                            ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/25'
                            : transactionType === 'income'
                                ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/25'
                                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/25'
                    )}
                    disabled={isSubmitting || (!selectedEntity && selectedType !== 'currency') || (!expression && selectedType !== 'currency')}
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                            جاري التنفيذ...
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-3">
                            {selectedType === 'currency' ? <RefreshCw className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                            {selectedType === 'currency' ? 'تأكيد عملية التحويل' : 'حفظ المعاملة المالية'}
                        </div>
                    )}
                </Button>
            </div>
        </div>
    );
}
