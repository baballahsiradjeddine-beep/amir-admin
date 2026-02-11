'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAppData } from '@/app/context/app-context'; // Import Context
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/currency-input';
import { Building2, Truck, ArrowLeftRight, Banknote, RefreshCw, Plus, ArrowDownRight, Coins, AlertTriangle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface AddTransactionDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    companies: any[];
    fournisseurs: any[];
    currencyCompanies: any[];
    addTransaction: (data: any) => Promise<void>;
    addCurrencyTransaction: (data: any) => Promise<void>;
}

export function AddTransactionDialog({
    isOpen,
    setIsOpen,
    companies,
    fournisseurs,
    currencyCompanies,
    addTransaction,
    addCurrencyTransaction
}: AddTransactionDialogProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const { fundCapital } = useAppData();
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
    const [dzdAmount, setDzdAmount] = useState(''); // القسم الأول فقط
    const [calculatedDzdAmount, setCalculatedDzdAmount] = useState(''); // القسم الثالث (محسوب)
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

    // Validation State
    const [negativeCapitalAlertOpen, setNegativeCapitalAlertOpen] = useState(false);
    const [negativeCapitalValue, setNegativeCapitalValue] = useState(0);

    // Office Balance Warning State
    const [officeBalanceWarningOpen, setOfficeBalanceWarningOpen] = useState(false);
    const [officeBalanceWarningValue, setOfficeBalanceWarningValue] = useState(0);

    const currentCapital = useMemo(() => {
        const fundBase = (typeof fundCapital === 'object' && fundCapital !== null)
            ? (fundCapital.localCapital || 0)
            : (typeof fundCapital === 'number' ? fundCapital : 0);

        const companiesBalance = companies.reduce((sum, c) => sum + (c.workingCapital || 0), 0);

        // Sum of all currency company DZD balances (which we calculated in context)
        // Wait, the context calculation I added sums transactions.
        // Balance = sum(transactions).
        // Total Capital = FundBase + Sum(CompanyCapitals) + Sum(ExchangeOfficeBalances).
        const currencyCompaniesBalance = currencyCompanies.reduce((sum, cc) => sum + (cc.balance || 0), 0);

        return fundBase + companiesBalance + currencyCompaniesBalance;
    }, [fundCapital, companies, currencyCompanies]);

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (!isOpen) {
            // Optional: Reset logic here if needed, or keep state for persistence
        }
    }, [isOpen]);

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

    const executeDzdTransaction = async () => {
        const getCleanNumber = (val: string) => {
            if (!val) return 0;
            const cleaned = val.replace(/[^\d.]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        };
        const dzdValue = getCleanNumber(dzdAmount);

        try {
            setIsSubmitting(true);
            await addCurrencyTransaction({
                currencyCompanyId: dzdCurrencyCompanyId,
                fromAmount: 0,
                toAmount: dzdValue,
                exchangeRateUsed: 1,
                commissionAmount: 0,
                description: dzdDescription || `تحويل دينار (مخروج) إلى ${currencyCompanies.find(cc => cc.id === dzdCurrencyCompanyId)?.name || 'مكتب صرف'}`,
                usdFournisseurId: undefined,
                dzdCompanyId: undefined,
                usdDescription: undefined,
                dzdDescription: dzdDescription || undefined,
            });
            toast.success('تمت إضافة المعاملة بنجاح');
            setIsOpen(false);
            setDzdAmount('');
            setDzdDescription('');
            setDzdCurrencyCompanyId('');
            setOfficeBalanceWarningOpen(false);
        } catch (error) {
            console.error('Error adding transaction:', error);
            toast.error('حدث خطأ أثناء إضافة المعاملة');
        } finally {
            setIsSubmitting(false);
        }
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

        // Validation: Prevent outcome if it leads to negative GLOBAL capital
        if (selectedType === 'company' && transactionType === 'outcome') {
            // Check against Global Capital (Fund + Companies + Exchange Offices)
            // As per user request: Compare with Main Page Capital, NOT individual Company Capital.
            const newCapital = currentCapital - centimes;
            if (newCapital < 0) {
                setNegativeCapitalValue(newCapital);
                setNegativeCapitalAlertOpen(true);
                return;
            }
        }

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
            resetForm();
            setIsOpen(false);
        } catch (error) {
            console.error('Error adding transaction:', error);
            toast.error('حدث خطأ أثناء إضافة المعاملة');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCurrencyTransaction = async () => {
        // Helper to cleanly parse numbers (removes spaces, hidden chars, etc)
        const getCleanNumber = (val: string) => {
            if (!val) return 0;
            const cleaned = val.replace(/[^\d.]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        };

        const dzdValue = getCleanNumber(dzdAmount);
        const usdValue = getCleanNumber(usdAmount);

        console.log('[DEBUG] Transaction Values:', {
            currencyCompanyId,
            dzdAmountRaw: dzdAmount,
            dzdValue,
            usdAmountRaw: usdAmount,
            usdValue
        });

        if (!currencyCompanyId) {
            toast.error('يرجى اختيار نوع التحويل');
            return;
        }

        try {
            setIsSubmitting(true);

            // ============================================
            // SCENARIO 1: DZD Only (تحويل دينار فقط)
            // ============================================
            if (currencyCompanyId === 'dzd') {
                if (dzdValue <= 0) {
                    toast.error('يرجى إدخال مبلغ صحيح');
                    setIsSubmitting(false);
                    return;
                }
                if (!dzdCurrencyCompanyId) {
                    toast.error('يرجى اختيار مكتب الصرف');
                    setIsSubmitting(false);
                    return;
                }

                // 1. Global Capital Validation (Blocking)
                if (currencyCompanyId === 'dzd' && dzdCurrencyCompanyId) {
                    const newCapital = currentCapital - dzdValue;
                    if (newCapital < 0) {
                        setNegativeCapitalValue(newCapital);
                        setNegativeCapitalAlertOpen(true);
                        setIsSubmitting(false);
                        return;
                    }
                }

                // 2. Office Balance Validation (Warning)
                if (currencyCompanyId === 'dzd' && dzdCurrencyCompanyId) {
                    const currencyCompany = currencyCompanies.find(cc => cc.id === dzdCurrencyCompanyId);
                    if (currencyCompany) {
                        const currentBalance = currencyCompany.balance || 0;
                        // Check if we are withdrawing more than the office has
                        if (currentBalance - dzdValue < 0) {
                            // Show warning dialog
                            setOfficeBalanceWarningValue(currentBalance);
                            setOfficeBalanceWarningOpen(true);
                            setIsSubmitting(false);
                            return;
                        }
                    }
                }

                // Proceed if all good
                await executeDzdTransaction();
            }

            // ============================================
            // SCENARIO 2: Both (دينار + دولار)
            // ============================================
            else if (currencyCompanyId === 'both') {
                // Validation
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

                // Part 1: DZD Transaction (if amount exists)
                if (dzdValue > 0 && dzdCurrencyCompanyId) {
                    await addCurrencyTransaction({
                        currencyCompanyId: dzdCurrencyCompanyId,
                        fromAmount: 0,
                        toAmount: dzdValue, // Send POSITIVE, system deducts
                        exchangeRateUsed: 1,
                        commissionAmount: 0,
                        description: dzdDescription || 'تحويل دينار (جزء من معاملة)',
                        usdFournisseurId: undefined,
                        dzdCompanyId: undefined,
                        usdDescription: undefined,
                        dzdDescription: dzdDescription || undefined,
                    });
                }

                // Part 2: USD Transaction
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
            resetForm();
            setIsOpen(false);

        } catch (error) {
            console.error('Transaction Error:', error);
            toast.error('حدث خطأ أثناء تسجيل المعاملة');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setExpression('');
        setRate('1');
        setDescription('');
        setSelectedEntity('');
        setSelectedType('company');
        setTransactionType('income');
        setCurrencyCompanyId('');
        setUsdAmount('');
        setDzdAmount('');
        setCalculatedDzdAmount('');
        setDzdCurrencyCompanyId('');
        setUsdCurrencyCompanyId('');
        setUsdDescription('');
        setDzdDescription('');
        setUsdFournisseurId('');
        setCurrencyType('USD');
        setExchangeRate('');
        setUsdToDzdRate('1');
        setExchangeOperation('multiply');
        setConvertToLocal(false);
        setDzdCompanyId('');
    };

    const handleSubmit = () => {
        if (selectedType === 'currency') {
            handleCurrencyTransaction();
        } else {
            handleRegularTransaction();
        }
    };

    const FormContent = (
        <div className="space-y-6 md:space-y-8 p-4 md:p-8 pt-4 md:pt-4">
            {/* Step 1: Select Type */}
            <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-primary rounded-full" />
                    <p className="text-sm font-bold text-foreground/80 uppercase">1. اختر نوع الجهة</p>
                </div>
                <div className="grid grid-cols-3 gap-2 md:gap-4">
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
                                "relative group p-2 md:p-5 rounded-2xl border transition-all duration-300 overflow-hidden",
                                selectedType === type.id
                                    ? `border-${type.color}-500/30 bg-background shadow-lg shadow-${type.color}-500/5 scale-[1.02]`
                                    : "border-border/40 bg-background hover:border-accent/40 hover:bg-accent/50"
                            )}
                        >
                            <div className={cn(
                                "absolute top-0 left-0 w-full h-1 transition-all duration-300",
                                selectedType === type.id ? `bg-${type.color}-500 opacity-100` : "opacity-0"
                            )} />
                            <div className="flex flex-col md:flex-row items-center md:justify-between gap-2 md:gap-4 h-full justify-center">
                                <div className={cn(
                                    "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-background shadow-sm border border-border/40 transition-transform duration-300 group-hover:scale-110",
                                    selectedType === type.id && `ring-2 ring-${type.color}-500/20`
                                )}>
                                    <type.icon className={cn("h-5 w-5 md:h-6 md:w-6", selectedType === type.id ? `text-${type.color}-600` : "text-muted-foreground/60")} />
                                </div>
                                <div className="text-center md:text-end">
                                    <p className="font-black text-foreground text-xs md:text-lg whitespace-nowrap">{type.title}</p>
                                    <p className="hidden md:block text-[11px] text-muted-foreground font-medium">{type.sub}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Forms */}
            {selectedType !== 'currency' ? (
                <div className="space-y-4 md:space-y-6 pt-2 md:pt-4">
                    {/* Regular Transaction Form Steps */}
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-1 bg-primary rounded-full" />
                        <p className="text-sm font-bold text-foreground/80 uppercase">2. تفاصيل المعاملة</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-foreground/70 me-1">نوع الحركة</Label>
                            <Select value={transactionType} onValueChange={(val: any) => setTransactionType(val)}>
                                <SelectTrigger className="h-12 bg-background border-slate-200/80 rounded-xl shadow-sm"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="income">مدخول (+ إضافة)</SelectItem>
                                    {selectedType !== 'fournisseur' && <SelectItem value="outcome">مخرج (- سحب)</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-foreground/70 me-1">الجهة المستهدفة</Label>
                            <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                                <SelectTrigger className="h-12 bg-background border-slate-200/80 rounded-xl shadow-sm"><SelectValue placeholder="اختر..." /></SelectTrigger>
                                <SelectContent className="rounded-xl max-h-[200px]">
                                    {(selectedType === 'company' ? companies : fournisseurs).map(e => (
                                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-foreground/70 me-1">القيمة</Label>
                            <Input
                                value={expression} onChange={e => setExpression(e.target.value)}
                                placeholder="مثال: 100 * 2"
                                className="h-12 bg-background border-slate-200/80 rounded-xl shadow-sm font-bold"
                            />
                            {expression && (
                                <p className="text-xs font-black text-primary text-end mt-1" dir="ltr">= {formatCurrency(calculateResult())}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-foreground/70 me-1">سعر الصرف</Label>
                            <Input type="number" value={rate} onChange={e => setRate(e.target.value)} className="h-12 bg-background border-slate-200/80 rounded-xl shadow-sm" />
                        </div>
                    </div>

                    {/* Result Box */}
                    <div className={cn(
                        "p-4 md:p-8 rounded-[2rem] border transition-all duration-500 overflow-hidden relative shadow-sm",
                        transactionType === 'income'
                            ? '!bg-white dark:!bg-green-950/20 border-2 border-green-500 dark:border-green-500/20 shadow-xl shadow-green-500/10'
                            : '!bg-white dark:!bg-red-950/20 border-2 border-red-500 dark:border-red-500/20 shadow-xl shadow-red-500/10'
                    )}>
                        <div className="relative space-y-2 text-center">
                            <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">إجمالي المبلغ النهائي</p>
                            <div className="flex items-center justify-center gap-4">
                                <p className={cn(
                                    "text-3xl md:text-6xl font-black font-heading transition-colors duration-500",
                                    transactionType === 'income' ? 'text-green-600' : 'text-red-600'
                                )} dir="ltr">
                                    {isNaN(calculateResult() * (parseFloat(rate) || 1)) ? '0' : formatCurrency(Math.round(calculateResult() * (parseFloat(rate) || 1) * 100) / 100)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-foreground/70 me-1">ملاحظات</Label>
                        <Textarea value={description} onChange={e => setDescription(e.target.value)} className="min-h-24 bg-background border-slate-200/80 rounded-2xl shadow-sm" />
                    </div>

                </div>
            ) : (
                <div className="space-y-6 pt-4 border-t border-border/50">
                    {/* Step 2: Select Currency Transaction Type */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-1 bg-purple-500 rounded-full" />
                            <p className="text-sm font-bold text-foreground/80 uppercase">2. اختر نوع التحويل</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { id: 'dzd', icon: Coins, title: 'دينار فقط', sub: 'تحويل بالدينار الجزائري', color: 'green' },
                                { id: 'both', icon: ArrowLeftRight, title: 'دينار ودولار', sub: 'تحويل بين العملات', color: 'purple' }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => {
                                        setCurrencyCompanyId(type.id);
                                        resetFormForCurrencySpecific(type.id);
                                    }}
                                    className={cn(
                                        "relative group p-4 md:p-6 rounded-2xl border transition-all duration-300 overflow-hidden",
                                        currencyCompanyId === type.id
                                            ? `border-${type.color}-500/30 bg-background shadow-lg shadow-${type.color}-500/5 scale-[1.02]`
                                            : "border-border/40 bg-background hover:border-accent/40 hover:bg-accent/50"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-0 left-0 w-full h-1 transition-all duration-300",
                                        currencyCompanyId === type.id ? `bg-${type.color}-500 opacity-100` : "opacity-0"
                                    )} />
                                    <div className="flex items-center justify-between gap-4">
                                        <div className={cn(
                                            "w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center bg-background shadow-sm border border-border/40 transition-transform duration-300 group-hover:scale-110",
                                            currencyCompanyId === type.id && `ring-2 ring-${type.color}-500/20`
                                        )}>
                                            <type.icon className={cn("h-6 w-6 md:h-7 md:w-7", currencyCompanyId === type.id ? `text-${type.color}-600` : "text-muted-foreground/60")} />
                                        </div>
                                        <div className="text-end flex-1">
                                            <p className="font-black text-foreground text-base md:text-xl">{type.title}</p>
                                            <p className="text-xs md:text-sm text-muted-foreground font-medium mt-0.5">{type.sub}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 3: Transaction Details - Conditional Forms */}
                    {currencyCompanyId && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-4 w-1 bg-purple-500 rounded-full" />
                                <p className="text-sm font-bold text-foreground/80 uppercase">3. تفاصيل التحويل</p>
                            </div>

                            {currencyCompanyId === 'dzd' ? (
                                // القسم الأول: تحويل للدينار
                                <div className="space-y-6">
                                    <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-black text-foreground">القسم الأول: تحويل للدينار</h3>
                                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                                <Coins className="h-5 w-5 text-blue-600" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-muted-foreground">مكتب الصرف المستفيد</Label>
                                                <Select value={dzdCurrencyCompanyId} onValueChange={setDzdCurrencyCompanyId}>
                                                    <SelectTrigger className="h-12 bg-background border-slate-200/80 rounded-xl shadow-sm">
                                                        <SelectValue placeholder="...اختر" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        {currencyCompanies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-muted-foreground">مبلغ الدينار</Label>
                                                <CurrencyInput
                                                    value={dzdAmount}
                                                    onValueChange={setDzdAmount}
                                                    className="h-12 font-bold text-lg text-center"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-muted-foreground">ملاحظة خاصة بتحويل الدينار</Label>
                                            <Textarea
                                                value={dzdDescription}
                                                onChange={e => setDzdDescription(e.target.value)}
                                                placeholder="أضف ملاحظة خاصة بهذا التحويل (اختياري)"
                                                className="min-h-[80px] bg-background border-slate-200/80 rounded-xl shadow-sm resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // دينار ودولار - ثلاثة أقسام
                                <div className="space-y-6">
                                    {/* القسم الأول: تحويل للدينار */}
                                    <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-black text-foreground">القسم الأول: تحويل للدينار</h3>
                                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                                <Coins className="h-5 w-5 text-blue-600" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-muted-foreground">مكتب الصرف المستفيد</Label>
                                                <Select value={dzdCurrencyCompanyId} onValueChange={setDzdCurrencyCompanyId}>
                                                    <SelectTrigger className="h-12 bg-background border-slate-200/80 rounded-xl shadow-sm">
                                                        <SelectValue placeholder="...اختر" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        {currencyCompanies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-muted-foreground">مبلغ الدينار</Label>
                                                <CurrencyInput
                                                    value={dzdAmount}
                                                    onValueChange={setDzdAmount}
                                                    className="h-12 font-bold text-lg text-center"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-muted-foreground">ملاحظة خاصة بتحويل الدينار</Label>
                                            <Textarea
                                                value={dzdDescription}
                                                onChange={e => setDzdDescription(e.target.value)}
                                                placeholder="أضف ملاحظة خاصة بهذا التحويل (اختياري)"
                                                className="min-h-[80px] bg-background border-slate-200/80 rounded-xl shadow-sm resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* القسم الثاني: تحويل عملة صعبة */}
                                    <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20 space-y-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-black text-foreground">القسم الثاني: تحويل عملة صعبة</h3>
                                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                                <RefreshCw className="h-5 w-5 text-orange-600" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-muted-foreground">نوع العملة</Label>
                                                <Select value={currencyType} onValueChange={(val: any) => setCurrencyType(val)}>
                                                    <SelectTrigger className="h-12 bg-background border-slate-200/80 rounded-xl shadow-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="USD">USD</SelectItem>
                                                        <SelectItem value="CNY">CNY</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-muted-foreground">المبلغ ({currencyType})</Label>
                                                <CurrencyInput
                                                    value={usdAmount}
                                                    onValueChange={(val) => {
                                                        setUsdAmount(val);
                                                        // Auto-calc DZD using Rate
                                                        const rate = parseFloat(usdToDzdRate) || 0;
                                                        const usd = parseFloat(parseFormattedNumber(val)) || 0;
                                                        setCalculatedDzdAmount(formatNumberInput((usd * rate).toString()));
                                                    }}
                                                    className="h-12 font-bold text-lg text-center"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-muted-foreground">المزود الذي سيرسل إليه التحويل</Label>
                                            <Select value={usdFournisseurId} onValueChange={setUsdFournisseurId}>
                                                <SelectTrigger className="h-12 bg-background border-slate-200/80 rounded-xl shadow-sm">
                                                    <SelectValue placeholder="...اختر المزود" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    {fournisseurs.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* القسم الثالث: المبلغ دين على شركة */}
                                    <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-black text-foreground">المبلغ دين على شركة</h3>
                                            <div className="p-2 bg-red-500/10 rounded-lg">
                                                <ArrowDownRight className="h-5 w-5 text-red-600" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-muted-foreground">الشركة المدينة (مخروج)</Label>
                                                <Select value={dzdCompanyId} onValueChange={setDzdCompanyId}>
                                                    <SelectTrigger className="h-12 bg-background border-slate-200/80 rounded-xl shadow-sm">
                                                        <SelectValue placeholder="اختر الشركة" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        {companies.map((c) => (
                                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-muted-foreground">السعر إلى DZD</Label>
                                                <Input
                                                    type="number"
                                                    value={usdToDzdRate}
                                                    onChange={e => {
                                                        setUsdToDzdRate(e.target.value);
                                                        // Auto-calc DZD if USD exists
                                                        if (usdAmount) {
                                                            const rate = parseFloat(e.target.value) || 0;
                                                            const usd = parseFloat(parseFormattedNumber(usdAmount)) || 0;
                                                            setCalculatedDzdAmount(formatNumberInput((usd * rate).toString()));
                                                        }
                                                    }}
                                                    className="h-12 font-bold text-lg text-center bg-background border-slate-200/80 rounded-xl shadow-sm"
                                                    placeholder="1"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-background border border-border/50">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-muted-foreground">القيمة بالدينار:</span>
                                                <span className="text-2xl font-black text-red-600" dir="ltr">
                                                    {calculatedDzdAmount || '0'} DZD
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )
            }

            {/* Sticky Footer */}
            <div className="pt-2 md:pt-4 border-t border-border/50 sticky bottom-0 bg-background/95 backdrop-blur-sm p-2 -mx-2 md:static md:bg-transparent md:p-0 z-20">
                <Button
                    onClick={handleSubmit}
                    className={cn(
                        "w-full h-14 rounded-xl font-heading font-black text-xl transition-all duration-300 shadow-lg hover:scale-105 active:scale-95",
                        selectedType === 'currency'
                            ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/25'
                            : transactionType === 'income'
                                ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/25'
                                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/25'
                    )}
                    disabled={isSubmitting || (!selectedEntity && selectedType !== 'currency') || (!expression && selectedType !== 'currency')}
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            جاري الحفظ...
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            {selectedType === 'currency' ? <RefreshCw className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                            {selectedType === 'currency' ? 'تأكيد التحويل' : 'تأكيد وحفظ المعاملة'}
                        </div>
                    )}
                </Button>
            </div>

        </div >
    );

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

    if (isDesktop) {
        return (
            <>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="max-w-3xl w-[min(95vw,48rem)] max-h-[90vh] overflow-hidden p-0 border-0 bg-transparent flex flex-col">
                        <div className="absolute inset-0 bg-card/95 backdrop-blur-2xl rounded-[2.5rem] border border-border/40 shadow-2xl -z-10" />
                        <DialogHeader className="p-4 md:p-8 md:pb-4 relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -me-16 -mt-16 pointer-events-none" />
                            <DialogTitle className="text-2xl md:text-3xl font-black font-heading bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                                إضافة معاملة جديدة
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground font-medium mt-1 text-xs md:text-sm">
                                قم بتعبئة التفاصيل أدناه لتوثيق معاملة مالية جديدة
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {FormContent}
                        </div>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={negativeCapitalAlertOpen} onOpenChange={setNegativeCapitalAlertOpen}>
                    <AlertDialogContent className="max-w-xl border-2 border-destructive bg-background p-8 z-[100] shadow-2xl">
                        <AlertDialogHeader className="items-center text-center space-y-4">
                            <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-2">
                                <AlertTriangle className="h-12 w-12" />
                            </div>
                            <AlertDialogTitle className="text-2xl font-bold text-destructive">تنبيه: رصيد غير كافي</AlertDialogTitle>
                            <AlertDialogDescription className="text-lg text-foreground/90 font-medium">
                                لا يمكن إخراج هذا المبلغ لأن رأس المال سيصبح بالسالب.
                                <br />
                                <div className="flex items-center justify-center gap-2 mt-4 dir-ltr" dir="ltr">
                                    <span className="text-xl font-bold font-mono text-destructive">
                                        {formatCurrency(negativeCapitalValue)}
                                    </span>
                                    <span className="text-sm font-bold text-muted-foreground">DZD</span>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-8 justify-center sm:justify-center">
                            <AlertDialogCancel className="w-full sm:w-auto px-32 py-4 text-xl bg-destructive hover:bg-destructive/90 text-white font-bold border-0 shadow-lg shadow-destructive/20 transition-all hover:scale-105 active:scale-95">
                                أعد المحاولة
                            </AlertDialogCancel>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={officeBalanceWarningOpen} onOpenChange={setOfficeBalanceWarningOpen}>
                    <AlertDialogContent className="max-w-xl border-2 border-orange-500 bg-background p-8 z-[100] shadow-2xl">
                        <AlertDialogHeader className="items-center text-center space-y-4">
                            <div className="p-4 rounded-full bg-orange-500/10 text-orange-600 mb-2">
                                <AlertTriangle className="h-12 w-12" />
                            </div>
                            <AlertDialogTitle className="text-2xl font-bold text-orange-600">تنبيه: رصيد المكتب غير كافي</AlertDialogTitle>
                            <AlertDialogDescription className="text-lg text-foreground/90 font-medium text-center">
                                المبلغ الذي تحاول إرساله أكبر من الرصيد الحالي لمكتب الصرف.
                                <div className="py-4 flex flex-col items-center justify-center gap-2">
                                    <span className="text-sm text-muted-foreground">الرصيد المتوفر حالياً لهذا المكتب:</span>
                                    <span className="text-xl font-black font-mono text-foreground dir-ltr" dir="ltr">
                                        {formatCurrency(officeBalanceWarningValue)} DZD
                                    </span>
                                </div>
                                هل أنت متأكد من إتمام العملية؟
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-8 gap-4 justify-center sm:justify-center">
                            <AlertDialogCancel className="w-full sm:w-auto px-8 py-2 text-lg font-bold">
                                إلغاء
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault(); // Prevent auto-closing if async needs time, but action usually closes.
                                    executeDzdTransaction();
                                }}
                                className="w-full sm:w-auto px-12 py-2 text-lg bg-orange-600 hover:bg-orange-700 text-white font-bold border-0 shadow-lg transition-all"
                            >
                                نعم، متأكد
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        );
    }

    return (
        <>
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
                <DrawerContent className="h-[95vh] rounded-t-[2rem]">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4 mt-6" />
                    <DrawerHeader>
                        <DrawerTitle className="text-2xl font-black font-heading text-center">إضافة معاملة</DrawerTitle>
                        <DrawerDescription className="text-center">توثيق معاملة مالية جديدة</DrawerDescription>
                    </DrawerHeader>
                    <div className="flex-1 overflow-y-auto px-4 pb-20 custom-scrollbar">
                        {FormContent}
                    </div>
                </DrawerContent>
            </Drawer>

            <AlertDialog open={negativeCapitalAlertOpen} onOpenChange={setNegativeCapitalAlertOpen}>
                <AlertDialogContent className="max-w-xl border-2 border-destructive bg-background p-8 z-[100] shadow-2xl">
                    <AlertDialogHeader className="items-center text-center space-y-4">
                        <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-2">
                            <AlertTriangle className="h-12 w-12" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-bold text-destructive">تنبيه: رصيد غير كافي</AlertDialogTitle>
                        <AlertDialogDescription className="text-lg text-foreground/90 font-medium">
                            لا يمكن إخراج هذا المبلغ لأن رأس المال سيصبح بالسالب.
                            <br />
                            <span className="flex items-center justify-center gap-2 mt-4 dir-ltr" dir="ltr">
                                <span className="text-xl font-bold font-mono text-destructive">
                                    {formatCurrency(negativeCapitalValue)}
                                </span>
                                <span className="text-sm font-bold text-muted-foreground">DZD</span>
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 justify-center sm:justify-center">
                        <AlertDialogCancel className="w-full sm:w-auto px-32 py-4 text-xl bg-destructive hover:bg-destructive/90 text-white font-bold border-0 shadow-lg shadow-destructive/20 transition-all hover:scale-105 active:scale-95">
                            أعد المحاولة
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
