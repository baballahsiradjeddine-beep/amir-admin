'use client';

import { useState } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppData } from '@/app/context/app-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash2, Printer } from 'lucide-react';
import { PrintHeader } from '@/components/print-header';
import { formatDate, formatDateTime } from '@/lib/utils';
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

export default function CompanyDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('id');
  const { companies, transactions, fournisseurs, deleteTransaction } = useAppData();
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

  const company = companies.find(c => c.id === companyId);
  const companyTransactions = transactions.filter(t => t.companyId === companyId);

  const formatCurrency = (amount: number) => {
    const str = Math.abs(amount).toString();
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

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

  if (!company) {
    return (
      <div className="min-h-screen space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">تفاصيل الشركة</h1>
          <Button onClick={() => router.back()} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            رجوع
          </Button>
        </div>
        <Card className="p-12 text-center border border-border">
          <p className="text-muted-foreground">الشركة غير موجودة</p>
        </Card>
      </div>
    );
  }

  const totalIncome = companyTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutcome = companyTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);

  // الحساب الصحيح للرصيد النهائي = رأس المال الأساسي + مجموع المدخول + المخروج (المخروج سالب بالفعل)
  const correctWorkingCapital = company.initialCapital + totalIncome + totalOutcome;

  // Get the most common source/box for income (from fournisseur)
  const incomeTransactions = companyTransactions.filter(t => t.amount > 0);
  const incomeFournisseurId = incomeTransactions.length > 0
    ? incomeTransactions[0].fournisseurId
    : null;
  const incomeFournisseur = incomeFournisseurId
    ? fournisseurs.find(f => f.id === incomeFournisseurId)
    : null;
  const incomeSource = incomeFournisseur?.name || 'الصندوق';

  // Get the most common company name for outcome
  const outcomeTransactions = companyTransactions.filter(t => t.amount < 0);
  const outcomeCompanyId = outcomeTransactions.length > 0
    ? outcomeTransactions[0].companyId
    : null;
  const outcomeCompanyData = outcomeCompanyId && outcomeCompanyId !== companyId
    ? companies.find(c => c.id === outcomeCompanyId)
    : null;
  const outcomeCompany = outcomeCompanyData?.name || company.name;

  return (
    <div className="min-h-screen space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">{company.name}</h1>
          <p className="text-muted-foreground mt-1">المالك: {company.owner}</p>
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
        {/* Company Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
          <Card className="p-6 border-0 card-premium transition-all hover:bg-muted/10">
            <p className="text-xs text-muted-foreground mb-2 font-bold uppercase">رأس المال الأساسي</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black font-heading text-primary" dir="ltr">
                {formatCurrency(company.initialCapital)}
              </p>
              <span className="text-xs font-bold text-primary/60">د.ج</span>
            </div>
          </Card>

          <Card className="p-6 border-0 card-premium transition-all hover:bg-muted/10">
            <p className="text-xs text-muted-foreground mb-2 font-bold uppercase">المدخول ({incomeSource})</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black font-heading text-green-600" dir="ltr">
                {formatCurrency(totalIncome)}
              </p>
              <span className="text-xs font-bold text-green-600/60">د.ج</span>
            </div>
          </Card>

          <Card className="p-6 border-0 card-premium transition-all hover:bg-muted/10">
            <p className="text-xs text-muted-foreground mb-2 font-bold uppercase">المخرج ({outcomeCompany})</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black font-heading text-red-600" dir="ltr">
                {formatCurrency(Math.abs(totalOutcome))}
              </p>
              <span className="text-xs font-bold text-red-600/60">د.ج</span>
            </div>
          </Card>

          <Card className="p-6 border-0 card-premium transition-all hover:bg-muted/10">
            <p className="text-xs text-muted-foreground mb-2 font-bold uppercase">الرصيد النهائي</p>
            <div className="flex items-baseline gap-1">
              <p className={`text-2xl md:text-3xl font-bold font-heading ${correctWorkingCapital < 0 ? 'text-red-600' : 'text-foreground'}`} dir="ltr">
                {correctWorkingCapital < 0 ? '-' : ''}{formatCurrency(Math.abs(correctWorkingCapital))}
              </p>
              <span className="text-xs text-muted-foreground font-bold">د.ج</span>
            </div>
          </Card>
        </div>

        <div className="hidden print:grid grid-cols-4 gap-4 mb-8">
          <div className="border border-slate-200 p-3 rounded-xl bg-white">
            <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase">رأس المال</p>
            <p className="text-lg font-black text-primary" dir="ltr">{formatCurrency(company.initialCapital)} د.ج</p>
          </div>
          <div className="border border-slate-200 p-3 rounded-xl bg-white">
            <p className="text-[10px] font-bold text-green-600 mb-1 uppercase">إجمالي المدخول</p>
            <p className="text-lg font-black text-green-600" dir="ltr">{formatCurrency(totalIncome)} د.ج</p>
          </div>
          <div className="border border-slate-200 p-3 rounded-xl bg-white">
            <p className="text-[10px] font-bold text-red-600 mb-1 uppercase">إجمالي المخروج</p>
            <p className="text-lg font-black text-red-600" dir="ltr">{formatCurrency(Math.abs(totalOutcome))} د.ج</p>
          </div>
          <div className="border border-slate-200 p-3 rounded-xl bg-white">
            <p className="text-[10px] font-bold text-slate-900 mb-1 uppercase">الرصيد الحالي</p>
            <p className="text-lg font-black text-slate-900" dir="ltr">{correctWorkingCapital < 0 ? '-' : ''}{formatCurrency(Math.abs(correctWorkingCapital))} د.ج</p>
          </div>
        </div>

        {/* Transactions */}
        {/* Transactions */}
        <Card className="border-0 card-premium overflow-hidden print:border print:border-slate-200">
          <div className="p-6 pb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading text-foreground">
              المعاملات ({companyTransactions.length})
            </h2>
            {printFilter.type !== 'all' && (
              <Badge variant="outline" className="print:hidden">
                فلترة: {printFilter.type === 'income' ? 'مدخول' : 'مخروج'}
              </Badge>
            )}
          </div>
          {companyTransactions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد معاملات لهذه الشركة حتى الآن
            </div>
          ) : (
            <div className="overflow-x-auto print:overflow-visible -mx-6 px-6">
              <table className="w-full text-sm min-w-[700px] print:min-w-full print:text-xs">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20 print:bg-white print:text-slate-900">
                    <th className="text-start py-4 px-6 font-bold font-heading first:rounded-r-lg print:rounded-none">التاريخ</th>
                    <th className="text-start py-4 px-6 font-bold font-heading">النوع</th>
                    <th className="text-start py-4 px-6 font-bold font-heading text-green-600 print:text-green-700">المدخول</th>
                    <th className="text-start py-4 px-6 font-bold font-heading text-red-600 print:text-red-700">المخروج</th>
                    <th className="text-start py-4 px-6 font-bold font-heading">الوصف</th>
                    <th className="text-center py-4 px-6 font-bold font-heading no-print last:rounded-l-lg">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {companyTransactions
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
                    .map((transaction) => (
                      <tr key={transaction.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors group print:border-slate-200">
                        <td className="py-4 px-6 text-start text-muted-foreground font-medium print:text-slate-900 print:px-4 print:py-3">
                          {formatDateTime(transaction.createdAt)}
                        </td>
                        <td className="py-4 px-6 text-start print:px-4 print:py-3">
                          <Badge
                            className={cn(
                              "border-0 px-3 py-1 rounded-lg print:border print:px-2 print:text-[10px]",
                              transaction.amount > 0
                                ? "bg-green-500/10 text-green-700 hover:bg-green-500/20 print:bg-transparent print:text-black"
                                : transaction.amount < 0
                                  ? "bg-red-500/10 text-red-700 hover:bg-red-500/20 print-bg-black print-text-white print:rounded-sm"
                                  : "bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 print:bg-transparent print:text-black"
                            )}
                          >
                            {transaction.amount > 0 ? 'مدخول' : transaction.amount < 0 ? 'مخروج' : 'دين'}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-green-600 print:text-black print:px-4 print:py-3" dir="ltr">
                          {transaction.amount > 0 ? `+${formatCurrency(transaction.amount)}` : '/'}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-red-600 print:px-4 print:py-3" dir="ltr">
                          <span className={cn(
                            transaction.amount < 0 && "print-bg-black print-text-white print:px-1 print:rounded-sm"
                          )}>
                            {transaction.amount < 0 ? `${formatCurrency(transaction.amount)}` : '/'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-start text-muted-foreground whitespace-normal break-words max-w-[250px] print:max-w-none print:text-slate-900 print:px-4 print:py-3">
                          {transaction.description}
                        </td>
                        <td className="py-4 px-6 text-center no-print">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(transaction.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Hidden Print Template */}
      <div id="print-portal" className="hidden print:block fixed top-0 left-0 w-screen h-screen bg-white z-[99999] p-8">
        <GeneralReportTemplate
          entityName={company.name}
          entityType="تفاصيل شركة"
          currency="DZD"
          transactions={companyTransactions.filter(t => {
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
            totalIncome: totalIncome,
            totalOutcome: Math.abs(totalOutcome),
            totalBalance: correctWorkingCapital,
            count: companyTransactions.length,
            initialCapital: company.initialCapital
          }}
          extraInfo={{
            'المالك': company.owner
          }}
          filterDescription={
            printFilter.dateRange !== 'all'
              ? `الفترة: ${printFilter.dateRange === 'today' ? 'اليوم' : `${printFilter.startDate} إلى ${printFilter.endDate}`}`
              : undefined
          }
        />
      </div>

      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-md bg-card">
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
                  <SelectItem value="income">المدخول فقط</SelectItem>
                  <SelectItem value="outcome">المخروج فقط</SelectItem>
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
                  <SelectItem value="all">كل المعاملات</SelectItem>
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
                entityName={company.name}
                entityType="تفاصيل شركة"
                currency="DZD"
                transactions={companyTransactions.filter(t => {
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
                  totalIncome: totalIncome,
                  totalOutcome: totalOutcome,
                  totalBalance: correctWorkingCapital,
                  count: companyTransactions.length
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
