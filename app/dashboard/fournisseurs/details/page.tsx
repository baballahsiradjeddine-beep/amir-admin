'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { useAppData } from '@/app/context/app-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash2, Building2, Wallet, Plus, TrendingUp, Eye, Printer } from 'lucide-react';
import { PrintHeader } from '@/components/print-header';
import { formatDate, convertToDZD, formatCurrency, formatDateTime } from '@/lib/utils';
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
import { GeneralReportTemplate } from '@/components/reports/general-report-template';

export default function FournisseurDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fournisseurId = searchParams.get('id');
  const { fournisseurs, transactions, deleteTransaction } = useAppData();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [printFilter, setPrintFilter] = useState({
    type: 'all',
    dateRange: 'all',
    startDate: '',
    endDate: ''
  });

  const fournisseur = fournisseurs.find(f => f.id === fournisseurId);
  const fournisseurTransactions = transactions.filter(t => t.fournisseurId === fournisseurId);

  const confirmDelete = async () => {
    if (!transactionToDelete) return;

    try {
      setIsDeleting(true);
      await deleteTransaction(transactionToDelete);
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

  if (!fournisseur) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">تفاصيل المزود</h1>
          <Button onClick={() => router.back()} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            رجوع
          </Button>
        </div>
        <Card className="p-12 text-center border border-border">
          <p className="text-muted-foreground">المزود غير موجود</p>
        </Card>
      </div>
    );
  }

  const balance = fournisseurTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent font-heading">بيانات المزود</h1>
          <p className="text-muted-foreground mt-1 font-medium italic">"{fournisseur.name}"</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto w-fit no-print">
          <Button onClick={() => setPrintDialogOpen(true)} variant="outline" className="gap-2 border-border/50 shadow-sm transition-all hover:bg-muted font-bold">
            <Printer className="h-4 w-4" />
            طباعة تقرير
          </Button>
          <Button onClick={() => router.back()} variant="outline" className="gap-2 border-border/50 shadow-sm transition-all">
            <ArrowLeft className="h-4 w-4" />
            رجوع
          </Button>
        </div>
      </div>



      <div className="print:hidden space-y-6">
        <PrintHeader />
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start no-print">
          <Card className="p-6 border-0 card-premium flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm overflow-hidden">
                {fournisseur.image ? (
                  <img src={fournisseur.image} alt={fournisseur.name} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-10 w-10 opacity-30" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold font-heading text-foreground">{fournisseur.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <div className="px-3 py-1 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-lg text-xs font-bold text-orange-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    {fournisseur.currency}
                  </div>
                  <div className="px-3 py-1 bg-muted rounded-lg text-[10px] font-bold text-muted-foreground">
                    ID: #S-{fournisseur.id.slice(0, 4)}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 md:p-8 border-0 card-premium">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">الرصيد الكلي الحالي</p>
                <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                  <p className={`text-3xl md:text-4xl font-black font-heading ${balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-foreground'}`} dir="ltr">
                    {balance > 0 ? '+' : ''}{formatCurrency(balance)}
                  </p>
                  <span className="text-lg font-bold text-muted-foreground">{fournisseur.currency}</span>
                </div>
              </div>
              <div className={`p-4 rounded-2xl ${balance > 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'} shrink-0`}>
                <Wallet className="h-8 w-8 md:h-10 md:w-10" />
              </div>
            </div>
          </Card>
        </div>

        <div className="hidden print:grid grid-cols-2 gap-6 mb-8">
          <div className="border border-slate-200 p-4 rounded-xl bg-white">
            <p className="text-xs font-bold text-muted-foreground mb-1 uppercase">المزود</p>
            <p className="text-xl font-black text-foreground">{fournisseur.name}</p>
          </div>
          <div className="border border-slate-200 p-4 rounded-xl bg-white">
            <p className="text-xs font-bold text-muted-foreground mb-1 uppercase">الرصيد الحالي ({fournisseur.currency})</p>
            <p className={`text-2xl font-black ${balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-slate-900'}`} dir="ltr">
              {balance > 0 ? '+' : ''}{formatCurrency(balance)}
            </p>
          </div>
        </div>

        {/* Transactions Table Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold font-heading text-foreground">سجل المعاملات المالي</h2>
            <div className="bg-muted px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground border border-border">
              {fournisseurTransactions.length} TRANSACTION
            </div>
          </div>

          <Card className="border-0 card-premium overflow-hidden print:border print:border-slate-200">
            <div className="overflow-x-auto print:overflow-visible -mx-6 px-6">
              <table className="w-full min-w-[800px] print:min-w-full print:text-xs">
                <thead>
                  <tr className="bg-muted/50 print:bg-white print:text-slate-900">
                    <th className="px-6 py-5 text-start font-bold text-xs text-muted-foreground border-b border-border/50 print:px-4 print:py-3 print:text-slate-950">التاريخ</th>
                    <th className="px-6 py-5 text-start font-bold text-xs text-muted-foreground border-b border-border/50 print:px-4 print:py-3 print:text-slate-950">النوع</th>
                    <th className="px-6 py-5 text-start font-bold text-xs text-green-600 border-b border-border/50 print:px-4 print:py-3 print:text-green-700">مدخول (In)</th>
                    <th className="px-6 py-5 text-start font-bold text-xs text-red-600 border-b border-border/50 print:px-4 print:py-3 print:text-red-700">مخروج (Out)</th>
                    <th className="px-6 py-5 text-start font-bold text-xs text-muted-foreground border-b border-border/50 print:px-4 print:py-3 print:text-slate-950">الوصف</th>
                    <th className="px-6 py-5 text-center font-bold text-xs text-muted-foreground border-b border-border/50 no-print">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {fournisseurTransactions.length > 0 ? (
                    fournisseurTransactions
                      .filter(t => {
                        const tDate = new Date(t.createdAt);
                        if (printFilter.type === 'income' && t.amount <= 0) return false;
                        if (printFilter.type === 'outcome' && t.amount >= 0) return false;
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
                      .map((t) => (
                        <tr key={t.id} className="hover:bg-muted/30 transition-colors group print:border-slate-200 text-start">
                          <td className="px-6 py-4 text-xs font-bold text-muted-foreground print:px-4 print:py-3 print:text-slate-900">
                            {formatDateTime(t.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-start print:px-4 print:py-3">
                            <span className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight",
                              t.amount > 0
                                ? "bg-green-500/10 text-green-600 print:bg-transparent print:border print:text-black"
                                : "bg-red-500/10 text-red-600 print-bg-black print-text-white print:rounded-sm"
                            )}>
                              {t.amount > 0 ? 'مدخول' : 'مخروج'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right print:px-4 print:py-3">
                            <span className={`text-base font-black font-heading ${t.amount > 0 ? 'text-green-600' : 'text-foreground/30'} print:text-black`} dir="ltr">
                              {t.amount > 0 ? `+${formatCurrency(t.amount)}` : '/'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right print:px-4 print:py-3">
                            <span className={cn(
                              "text-base font-black font-heading",
                              t.amount < 0 ? "text-red-600 print-bg-black print-text-white print:px-1 print:rounded-sm" : "text-foreground/30 print:text-black"
                            )} dir="ltr">
                              {t.amount < 0 ? formatCurrency(t.amount) : '/'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-start print:px-4 print:py-3">
                            <p className="text-xs text-muted-foreground whitespace-normal break-words max-w-[250px] print:max-w-none print:text-slate-900">{t.description || "لا يوجد وصف"}</p>
                          </td>
                          <td className="px-6 py-4 text-center no-print">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(t.id)}
                              className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <Plus className="h-12 w-12 text-muted-foreground" />
                          <p className="text-sm font-bold">لا توجد سجلات مالية لهذا المزود</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

      </div>

      {/* Hidden Print Template */}
      <div id="print-portal" className="hidden print:block fixed top-0 left-0 w-screen h-screen bg-white z-[99999] p-8">
        <GeneralReportTemplate
          entityName={fournisseur.name}
          entityType="تفاصيل مزود"
          currency={fournisseur.currency}
          transactions={fournisseurTransactions.filter(t => {
            const tDate = new Date(t.createdAt);
            if (printFilter.type === 'income' && t.amount <= 0) return false;
            if (printFilter.type === 'outcome' && t.amount >= 0) return false;
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
          totals={{
            totalIncome: fournisseurTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
            totalOutcome: Math.abs(fournisseurTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)),
            totalBalance: balance,
            count: fournisseurTransactions.length
          }}
          filterDescription={
            printFilter.dateRange !== 'all'
              ? `الفترة: ${printFilter.dateRange === 'today' ? 'اليوم' : `${printFilter.startDate} إلى ${printFilter.endDate}`}`
              : undefined
          }
        />
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
                  <SelectItem value="income">إيداع (In) فقط</SelectItem>
                  <SelectItem value="outcome">سحب (Out) فقط</SelectItem>
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



      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 bg-slate-100 print:hidden">
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
              <GeneralReportTemplate
                entityName={fournisseur.name}
                entityType="تفاصيل مزود"
                currency={fournisseur.currency}
                transactions={fournisseurTransactions.filter(t => {
                  const tDate = new Date(t.createdAt);
                  if (printFilter.type === 'income' && t.amount <= 0) return false;
                  if (printFilter.type === 'outcome' && t.amount >= 0) return false;
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
                totals={{
                  totalIncome: fournisseurTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
                  totalOutcome: Math.abs(fournisseurTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)),
                  totalBalance: balance,
                  count: fournisseurTransactions.length
                }}
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
    </div>
  );
}
