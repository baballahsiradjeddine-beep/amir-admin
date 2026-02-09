'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAppData } from '@/app/context/app-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Trash2, Building2, History as HistoryIcon, Printer, Banknote, Pencil } from 'lucide-react';
import { PrintHeader } from '@/components/print-header';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import { CurrencyReportTemplate } from '@/components/reports/currency-report-template';

export default function CurrencyCompanyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { currencyCompanies, currencyTransactions, transactions, deleteCurrencyTransaction, updateCurrencyTransaction, updateTransaction } = useAppData();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editValue, setEditValue] = useState({
    exchangeRateUsed: '',
    fromAmount: '',
    toAmount: '',
    description: ''
  });
  const [printFilter, setPrintFilter] = useState({
    type: 'all',
    dateRange: 'all',
    startDate: '',
    endDate: ''
  });

  const companyId = params.id as string;
  const company = currencyCompanies.find(c => c.id === companyId);
  const companyTransactions = useMemo(() => {
    return currencyTransactions.filter(t => t.currencyCompanyId === companyId).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [currencyTransactions, companyId]);

  // Handle edit
  const handleEditClick = (transaction: any) => {
    setTransactionToEdit(transaction);
    setEditValue({
      exchangeRateUsed: transaction.exchangeRateUsed.toString(),
      fromAmount: transaction.fromAmount.toString(),
      toAmount: transaction.toAmount.toString(),
      description: transaction.description
    });
    setEditDialogOpen(true);
  };

  const confirmEdit = async () => {
    if (!transactionToEdit) return;
    try {
      setIsUpdating(true);
      const newRate = parseFloat(editValue.exchangeRateUsed);
      const updates = {
        exchangeRateUsed: newRate,
        fromAmount: parseFloat(editValue.fromAmount),
        toAmount: parseFloat(editValue.toAmount),
        description: editValue.description
      };

      // Helper to find related regular transaction (company debt)
      const findRelatedTransaction = (currencyTx: any) => {
        const txTime = new Date(currencyTx.createdAt).getTime();
        // Look for transaction with approx same amount (negative of currencyTx.toAmount)
        // Note: We use original values from currencyTx because we want to find the current ones before update
        const targetAmount = -currencyTx.toAmount;

        return transactions.find(t => {
          if (t.type !== 'company') return false;
          // Check amount with some tolerance (float precision)
          if (Math.abs(t.amount - targetAmount) > 1.0) return false;
          // Check time window (5 seconds) as they are created almost simultaneously
          const tTime = new Date(t.createdAt).getTime();
          return Math.abs(tTime - txTime) < 5000;
        });
      };

      // 1. Update the target transaction
      await updateCurrencyTransaction(transactionToEdit.id, updates);

      // 1.b Update linked regular transaction if exists
      const relatedTx = findRelatedTransaction(transactionToEdit);
      if (relatedTx) {
        const newDesc = `دين تحويل عملة: تحويل USD من العملة الصعبة (${updates.fromAmount.toLocaleString().replace(/,/g, ' ')} USD × ${updates.exchangeRateUsed} = ${updates.toAmount.toLocaleString().replace(/,/g, ' ')} DZD)`;
        await updateTransaction(relatedTx.id, {
          amount: -updates.toAmount,
          description: newDesc
        });
      }

      // 2. Check for bulk update (if rate changed)
      const oldRate = transactionToEdit.exchangeRateUsed;
      if (Math.abs(oldRate - newRate) > 0.0001) {
        const txDate = new Date(transactionToEdit.createdAt).getTime();
        // Find siblings within 10 minutes belonging to the same currency company
        const siblings = companyTransactions.filter(t => {
          if (t.id === transactionToEdit.id) return false;
          if (t.fromAmount === 0) return false;
          const tDate = new Date(t.createdAt).getTime();
          const diffMins = Math.abs(txDate - tDate) / (1000 * 60);
          return diffMins <= 10; // 10 minutes window
        });

        if (siblings.length > 0) {
          const confirmBulk = confirm(`تم اكتشاف ${siblings.length} معاملات أخرى في نفس التوقيت (10 دقائق). هل تريد تحديث سعر الصرف لها أيضاً؟`);
          if (confirmBulk) {
            await Promise.all(siblings.map(async (t) => {
              const newTo = t.fromAmount * newRate;
              let newDesc = t.description;
              if (newDesc.includes('تحويل') && newDesc.includes('USD')) {
                newDesc = `تحويل USD من العملة الصعبة (${t.fromAmount.toLocaleString().replace(/,/g, ' ')} USD × ${newRate} = ${newTo.toLocaleString().replace(/,/g, ' ')} DZD)`;
              }

              // Update currency transaction
              await updateCurrencyTransaction(t.id, {
                exchangeRateUsed: newRate,
                toAmount: newTo,
                description: newDesc
              });

              // Update sibling related regular transaction
              const siblingRelatedTx = findRelatedTransaction(t);
              if (siblingRelatedTx) {
                const siblingNewDesc = `دين تحويل عملة: تحويل USD من العملة الصعبة (${t.fromAmount.toLocaleString().replace(/,/g, ' ')} USD × ${newRate} = ${newTo.toLocaleString().replace(/,/g, ' ')} DZD)`;
                await updateTransaction(siblingRelatedTx.id, {
                  amount: -newTo,
                  description: siblingNewDesc
                });
              }
            }));
            toast.success(`تم تحديث ${siblings.length} معاملات إضافية وتحديث الديون المرتبطة بها تلقائياً`);
          }
        }
      }

      toast.success('تم تحديث المعاملة والديون المرتبطة بنجاح');
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('حدث خطأ أثناء التحديث');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete
  const confirmDelete = async () => {
    if (!transactionToDelete) return;

    try {
      setIsDeleting(true);
      await deleteCurrencyTransaction(transactionToDelete);
      toast.success('تم حذف المعاملة بنجاح');
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    } catch (error) {
      console.error('[v0] Error deleting transaction:', error);
      toast.error('حدث خطأ أثناء حذف المعاملة');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Calculate totals
  const totals = useMemo(() => {
    return companyTransactions.reduce((acc, t) => {
      const isIncome = t.fromAmount > 0;
      return {
        totalIncome: acc.totalIncome + (isIncome ? t.toAmount : 0),
        totalOutcome: acc.totalOutcome + (!isIncome ? Math.abs(t.toAmount) : 0),
        totalCommission: acc.totalCommission + (t.commissionAmount || 0),
        totalTransactions: acc.totalTransactions + 1,
      };
    }, { totalIncome: 0, totalOutcome: 0, totalCommission: 0, totalTransactions: 0 });
  }, [companyTransactions]);

  if (!company) {
    return (
      <div className="min-h-screen space-y-6 p-8 animate-in fade-in duration-500">
        <Card className="p-12 text-center border-0 card-premium">
          <p className="text-muted-foreground font-bold font-heading">لم يتم العثور على شركة العملة</p>
          <Button onClick={() => router.back()} variant="ghost" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            العودة للخلف
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <PrintHeader />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 no-print">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black font-heading tracking-tight text-foreground">
                {company.name}
              </h1>
              <p className="text-muted-foreground font-bold mt-1">تفاصيل شركة العملة والمعاملات</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 self-start sm:self-auto w-fit no-print">
          <Button
            onClick={() => setPrintDialogOpen(true)}
            variant="outline"
            className="h-12 px-6 rounded-xl border-border/50 shadow-sm hover:bg-muted font-bold gap-2 transition-all"
          >
            <Printer className="h-4 w-4" />
            طباعة تقرير
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="h-12 px-6 rounded-xl border-border/50 shadow-sm hover:bg-muted font-bold gap-2 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            رجوع للقائمة
          </Button>
        </div>
      </div>

      {/* Hidden Print Template - Always rendered but only visible during print */}
      <div id="print-portal" className="hidden print:block absolute top-0 left-0 w-full bg-white z-[9999]">
        <CurrencyReportTemplate
          company={company as any}
          transactions={companyTransactions.filter(t => {
            const tDate = new Date(t.createdAt);
            if (printFilter.type === 'income' && t.fromAmount <= 0) return false;
            if (printFilter.type === 'outcome' && t.toAmount <= 0) return false;
            if (printFilter.dateRange === 'custom') {
              if (printFilter.startDate && tDate < new Date(printFilter.startDate)) return false;
              if (printFilter.endDate) {
                const end = new Date(printFilter.endDate);
                end.setHours(23, 59, 59, 999);
                if (tDate > end) return false;
              }
            } else if (printFilter.dateRange === 'today') {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (tDate < today) return false;
            }
            return true;
          })}
          totals={totals}
          filterDescription={
            printFilter.dateRange !== 'all'
              ? `الفترة: ${printFilter.dateRange === 'today' ? 'اليوم' : `${printFilter.startDate} إلى ${printFilter.endDate}`}`
              : undefined
          }
        />
      </div>

      {/* Info & Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Company Identity Card */}
        <Card className="md:col-span-5 border-0 card-premium overflow-hidden group no-print">
          <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/5 p-8 border-b border-orange-500/10">
            <h3 className="text-lg font-bold font-heading flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              هوية الشركة
            </h3>
          </div>
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest bg-muted px-2 py-1 rounded-md inline-block">BASE CURRENCIES</p>
                <div className="flex flex-wrap gap-2">
                  {(company.baseCurrencies && company.baseCurrencies.length > 0
                    ? company.baseCurrencies
                    : [company.baseCurrency])
                    .map((curr) => (
                      <span key={`base-${curr}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg font-bold text-xs border border-orange-200 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                        {curr}
                      </span>
                    ))}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest bg-muted px-2 py-1 rounded-md inline-block">TARGET CURRENCIES</p>
                <div className="flex flex-wrap gap-2">
                  {(company.targetCurrencies && company.targetCurrencies.length > 0
                    ? company.targetCurrencies
                    : [company.targetCurrency])
                    .map((curr) => (
                      <span key={`target-${curr}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-bold text-xs border border-blue-200 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        {curr}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            {company.description && (
              <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                <p className="text-[10px] text-muted-foreground font-black uppercase mb-2">DESCRIPTION</p>
                <p className="text-sm font-medium leading-relaxed">{company.description}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Real-time Balance */}
        <div className="md:col-span-7 no-print">
          <Card className={`p-8 h-full border-0 card-premium flex flex-col justify-center group hover:translate-y-[-4px] transition-all duration-300 ${(totals.totalIncome - totals.totalOutcome) > 0 ? 'bg-red-600/5' : 'bg-green-600/5'}`}>
            <div className="flex items-center justify-between mb-8">
              <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${(totals.totalIncome - totals.totalOutcome) > 0 ? 'bg-red-500/20 text-red-600' : 'bg-green-500/20 text-green-600'}`}>
                <Banknote className="h-10 w-10" />
              </div>
              <Badge variant="secondary" className={`border-0 font-bold px-4 py-2 text-sm ${(totals.totalIncome - totals.totalOutcome) > 0 ? 'bg-red-500/10 text-red-700' : 'bg-green-500/10 text-green-700'}`}>الرصيد الحالي (DZD)</Badge>
            </div>
            <div>
              <p className={`text-6xl font-black font-heading ${(totals.totalIncome - totals.totalOutcome) > 0 ? 'text-red-600' : 'text-green-600'}`} dir="ltr">
                {(totals.totalIncome - totals.totalOutcome).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
              </p>
              <p className="text-sm text-muted-foreground mt-4 font-bold uppercase tracking-widest">CURRENT DZD BALANCE (NET)</p>
            </div>
            <div className={`mt-6 px-4 py-2 rounded-xl text-xs font-bold w-fit ${(totals.totalIncome - totals.totalOutcome) > 0 ? 'bg-red-500/10 text-red-700' : 'bg-green-500/10 text-green-700'}`}>
              {(totals.totalIncome - totals.totalOutcome) > 0 ? 'شركة العملة تسالك هذا المبلغ' : 'لديك مبلغ عند الشركة'}
            </div>
          </Card>
        </div>

        <div className="hidden print:grid grid-cols-2 gap-6 mb-8 col-span-12">
          <div className="border border-slate-200 p-4 rounded-xl bg-white">
            <p className="text-xs font-bold text-muted-foreground mb-1 uppercase">الرصيد الحالي (DZD)</p>
            <p className={`text-2xl font-black ${(totals.totalIncome - totals.totalOutcome) >= 0 ? 'text-green-600' : 'text-red-600'}`} dir="ltr">{(totals.totalIncome - totals.totalOutcome).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}</p>
          </div>
          <div className="border border-slate-200 p-4 rounded-xl bg-white text-center">
            <p className="text-xs font-bold text-muted-foreground mb-1 uppercase">عدد المعاملات</p>
            <p className="text-2xl font-black text-slate-900" dir="ltr">{companyTransactions.length}</p>
          </div>
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-bold font-heading">قائمة المعاملات المالية</h3>
        </div>

        {companyTransactions.length > 0 ? (
          <>
            <Card className="hidden md:block border-0 card-premium overflow-hidden print:border print:border-slate-200">
              <div className="overflow-x-auto print:overflow-visible">
                <Table className="print:text-[10px]">
                  <TableHeader className="print:bg-white text-end">
                    <TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
                      <TableHead className="text-start font-bold text-foreground h-14 print:px-2 print:py-2 print:text-slate-900">التاريخ</TableHead>
                      <TableHead className="text-right font-bold text-green-600 h-14 print:px-2 print:py-2">المدخول</TableHead>
                      <TableHead className="text-right font-bold text-red-600 h-14 print:px-2 print:py-2">المخرج</TableHead>
                      <TableHead className="text-right font-bold text-foreground h-14 print:px-2 print:py-2 print:text-slate-900">المبلغ (عملة صعبة)</TableHead>
                      <TableHead className="text-start font-bold text-foreground h-14 print:px-2 print:py-2 print:text-slate-900">سعر الصرف</TableHead>
                      <TableHead className="text-start font-bold text-foreground h-14 print:px-2 print:py-2 print:text-slate-900">الوصف</TableHead>
                      <TableHead className="text-center font-bold text-foreground h-14 no-print">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyTransactions
                      .filter(t => {
                        const tDate = new Date(t.createdAt);
                        if (printFilter.type === 'income' && t.fromAmount <= 0) return false;
                        if (printFilter.type === 'outcome' && t.toAmount <= 0) return false;
                        if (printFilter.dateRange === 'custom') {
                          if (printFilter.startDate && tDate < new Date(printFilter.startDate)) return false;
                          if (printFilter.endDate) {
                            const end = new Date(printFilter.endDate);
                            end.setHours(23, 59, 59, 999);
                            if (tDate > end) return false;
                          }
                        } else if (printFilter.dateRange === 'today') {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          if (tDate < today) return false;
                        }
                        return true;
                      })
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((transaction) => (
                        <TableRow
                          key={transaction.id}
                          className="border-b border-border/50 hover:bg-muted/20 transition-colors group print:border-slate-200"
                        >
                          <TableCell className="text-start font-bold py-4 print:px-2 print:py-2 print:text-slate-900">
                            <div className="flex flex-col">
                              <span className="text-sm print:text-[10px]">{formatDateTime(transaction.createdAt)}</span>
                            </div>
                          </TableCell>

                          <TableCell className="text-right py-4 print:px-2 print:py-2">
                            {transaction.fromAmount > 0 ? (
                              <span className="font-black font-heading text-green-600 print:text-black" dir="ltr">
                                {transaction.toAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground opacity-30">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-4 print:px-2 print:py-2">
                            {transaction.fromAmount === 0 ? (
                              <span className="font-black font-heading text-red-600 print:text-black" dir="ltr">
                                {Math.abs(transaction.toAmount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground opacity-30">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-4 print:px-2 print:py-2 print:text-black">
                            {transaction.fromAmount > 0 ? (
                              <div className="inline-flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 print:hidden" />
                                <span className="font-black font-heading text-blue-600 print-bg-black print:text-white print:px-1 print:rounded-sm" dir="ltr">
                                  {transaction.fromAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} {company.baseCurrency}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground font-bold print:text-black">—</span>
                            )}
                          </TableCell>

                          <TableCell className="text-start py-4 print:px-2 print:py-2 print:text-slate-900">
                            {transaction.fromAmount > 0 ? (
                              <div className="bg-muted px-2 py-1 rounded-md inline-block text-xs font-bold text-muted-foreground print:bg-transparent print:border print:px-1">
                                {transaction.exchangeRateUsed.toFixed(4)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground opacity-30 font-bold">—</span>
                            )}
                          </TableCell>

                          <TableCell className="text-start py-4 max-w-xs print:max-w-none print:px-2 print:py-2 print:text-slate-900">
                            <p className="text-xs font-bold text-foreground/80 leading-relaxed whitespace-normal break-words">
                              {transaction.description}
                            </p>
                          </TableCell>

                          <TableCell className="py-4 text-center no-print">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(transaction)}
                                disabled={isUpdating}
                                className="h-9 w-9 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(transaction.id)}
                                disabled={isDeleting}
                                className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {companyTransactions
                .filter(t => {
                  const tDate = new Date(t.createdAt);
                  if (printFilter.type === 'income' && t.fromAmount <= 0) return false;
                  if (printFilter.type === 'outcome' && t.toAmount <= 0) return false;
                  if (printFilter.dateRange === 'custom') {
                    if (printFilter.startDate && tDate < new Date(printFilter.startDate)) return false;
                    if (printFilter.endDate) {
                      const end = new Date(printFilter.endDate);
                      end.setHours(23, 59, 59, 999);
                      if (tDate > end) return false;
                    }
                  } else if (printFilter.dateRange === 'today') {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (tDate < today) return false;
                  }
                  return true;
                })
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((transaction) => {
                  const isIncome = transaction.fromAmount > 0;
                  return (
                    <Card key={transaction.id} className="p-4 border-0 shadow-sm relative overflow-hidden">
                      <div className={`absolute top-0 right-0 w-1 h-full ${isIncome ? 'bg-green-500' : 'bg-red-500'}`} />

                      <div className="flex justify-between items-start mb-3 pl-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                            <HistoryIcon className="w-3 h-3" />
                            {formatDateTime(transaction.createdAt)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-blue-500"
                            onClick={() => handleEditClick(transaction)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500"
                            onClick={() => handleDeleteClick(transaction.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-4 pl-2">
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase">{isIncome ? 'مدخول (إيداع)' : 'مخروج (سحب)'}</p>
                          <p className={`text-2xl font-black font-heading ${isIncome ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                            {Math.abs(transaction.toAmount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} <span className="text-sm text-muted-foreground">DZD</span>
                          </p>
                        </div>
                        {isIncome && (
                          <div className="text-end">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">عملة صعبة</p>
                            <p className="text-sm font-black text-blue-600" dir="ltr">
                              {transaction.fromAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} {company.baseCurrency}
                            </p>
                            <p className="text-[10px] text-muted-foreground">@ {transaction.exchangeRateUsed}</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                        <p className="text-xs font-medium text-foreground/80 line-clamp-2">
                          {transaction.description}
                        </p>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </>
        ) : (
          <Card className="p-20 border-0 card-premium text-center">
            <div className="bg-muted/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <HistoryIcon className="h-12 w-12 text-muted-foreground opacity-10" />
            </div>
            <h4 className="text-2xl font-black font-heading text-foreground">لا توجد عمليات</h4>
            <p className="text-muted-foreground font-bold mt-2">لم يتم إجراء أي معاملات لهذه الشركة بعد.</p>
          </Card>
        )}
      </div>

      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-md bg-card border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-heading">خيارات الطباعة</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold">نوع المعاملات</Label>
              <Select value={printFilter.type} onValueChange={(val) => setPrintFilter({ ...printFilter, type: val })}>
                <SelectTrigger className="rounded-xl border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="income">المدخول ({company.baseCurrency})</SelectItem>
                  <SelectItem value="outcome">المخروج ({company.targetCurrency})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">الفترة الزمنية</Label>
              <Select value={printFilter.dateRange} onValueChange={(val) => setPrintFilter({ ...printFilter, dateRange: val })}>
                <SelectTrigger className="rounded-xl border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">كل السجلات</SelectItem>
                  <SelectItem value="today">اليوم فقط</SelectItem>
                  <SelectItem value="custom">فترة مخصصة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {printFilter.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase">من تاريخ</Label>
                  <Input
                    type="date"
                    value={printFilter.startDate}
                    onChange={(e) => setPrintFilter({ ...printFilter, startDate: e.target.value })}
                    className="h-10 rounded-lg border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase">إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={printFilter.endDate}
                    onChange={(e) => setPrintFilter({ ...printFilter, endDate: e.target.value })}
                    className="h-10 rounded-lg border-border/50"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)} className="rounded-xl mt-2 sm:mt-0">إلغاء</Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="secondary"
                onClick={() => {
                  setPrintDialogOpen(false);
                  setShowPreview(true);
                }}
                className="rounded-xl flex-1 sm:flex-none gap-2"
              >
                <Printer className="h-4 w-4" />
                معاينة التقرير
              </Button>
              <Button
                onClick={() => {
                  setPrintDialogOpen(false);
                  setTimeout(() => window.print(), 300);
                }}
                className="rounded-xl bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
              >
                طباعة مباشرة
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="حذف المعاملة"
        description="هل أنت متأكد من حذف هذه المعاملة؟ لا يمكن التراجع عن هذا الإجراء."
        isDeleting={isDeleting}
      />

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md bg-card border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-heading">تعديل المعاملة</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {transactionToEdit?.fromAmount > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-bold">سعر الصرف</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={editValue.exchangeRateUsed}
                  onChange={(e) => {
                    const newRate = e.target.value;
                    const from = parseFloat(editValue.fromAmount) || 0;
                    const rateVal = parseFloat(newRate) || 0;
                    const newTo = from * rateVal;
                    setEditValue({
                      ...editValue,
                      exchangeRateUsed: newRate,
                      toAmount: newTo.toString(),
                      description: `تحويل USD من العملة الصعبة (${from.toLocaleString()} USD × ${rateVal} = ${newTo.toLocaleString()} DZD)`
                    });
                  }}
                  className="h-10 rounded-lg border-border/50 text-left"
                  dir="ltr"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-bold">
                {transactionToEdit?.fromAmount > 0 ? `المبلغ (${company?.baseCurrency})` : `المبلغ (${company?.targetCurrency})`}
              </Label>
              <Input
                type="number"
                value={transactionToEdit?.fromAmount > 0 ? editValue.fromAmount : editValue.toAmount}
                onChange={(e) => {
                  const newVal = e.target.value;
                  if (transactionToEdit?.fromAmount > 0) {
                    const fromVal = parseFloat(newVal) || 0;
                    const rateVal = parseFloat(editValue.exchangeRateUsed) || 0;
                    const newTo = fromVal * rateVal;
                    setEditValue({
                      ...editValue,
                      fromAmount: newVal,
                      toAmount: newTo.toString(),
                      description: `تحويل USD من العملة الصعبة (${fromVal.toLocaleString().replace(/,/g, ' ')} USD × ${rateVal} = ${newTo.toLocaleString().replace(/,/g, ' ')} DZD)`
                    });
                  } else {
                    setEditValue({ ...editValue, toAmount: newVal });
                  }
                }}
                className="h-10 rounded-lg border-border/50 text-left"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">الوصف</Label>
              <Input
                value={editValue.description}
                onChange={(e) => setEditValue({ ...editValue, description: e.target.value })}
                className="h-10 rounded-lg border-border/50"
              />
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                <Button
                  variant="link"
                  className="h-auto p-0 text-[10px] font-bold text-blue-600"
                  onClick={() => {
                    const rate = parseFloat(editValue.exchangeRateUsed) || 0;
                    const from = parseFloat(editValue.fromAmount) || 0;
                    const to = from * rate;
                    setEditValue({
                      ...editValue,
                      toAmount: to.toString(),
                      description: `تحويل USD من العملة الصعبة (${from.toLocaleString().replace(/,/g, ' ')} USD × ${rate} = ${to.toLocaleString().replace(/,/g, ' ')} DZD)`
                    });
                  }}
                >
                  تحديث الوصف تلقائياً بناءً على القيم الحالية
                </Button>
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditDialogOpen(false)} className="rounded-xl">إلغاء</Button>
            <Button onClick={confirmEdit} disabled={isUpdating} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              {isUpdating ? 'جاري التحديث...' : 'حفظ التعديلات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 bg-slate-100">
          <DialogHeader className="p-4 border-b bg-white">
            <DialogTitle className="flex items-center justify-between">
              <span>معاينة التقرير قبل الطباعة</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>إغلاق</Button>
                <Button size="sm" onClick={() => window.print()} className="gap-2">
                  <Printer className="h-4 w-4" />
                  طباعة
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-8 bg-slate-100/50 flex justify-center">
            <div className="shadow-2xl print:shadow-none">
              <CurrencyReportTemplate
                company={company as any}
                transactions={companyTransactions.filter(t => {
                  const tDate = new Date(t.createdAt);
                  if (printFilter.type === 'income' && t.fromAmount <= 0) return false;
                  if (printFilter.type === 'outcome' && t.toAmount <= 0) return false;
                  if (printFilter.dateRange === 'custom') {
                    if (printFilter.startDate && tDate < new Date(printFilter.startDate)) return false;
                    if (printFilter.endDate) {
                      const end = new Date(printFilter.endDate);
                      end.setHours(23, 59, 59, 999);
                      if (tDate > end) return false;
                    }
                  } else if (printFilter.dateRange === 'today') {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (tDate < today) return false;
                  }
                  return true;
                })}
                totals={totals}
                filterDescription={
                  printFilter.dateRange !== 'all'
                    ? `الفترة: ${printFilter.dateRange === 'today' ? 'اليوم' : `${printFilter.startDate} إلى ${printFilter.endDate}`}`
                    : undefined
                }
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}
