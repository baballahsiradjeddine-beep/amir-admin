'use client';

import { useMemo, useState } from 'react';
import { useAppData } from '@/app/context/app-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

type PendingDelete = { kind: 'regular'; id: string } | { kind: 'currency'; id: string };

export default function TransactionsPage() {
  const {
    transactions,
    currencyTransactions,
    companies,
    fournisseurs,
    currencyCompanies,
    deleteTransaction,
    deleteCurrencyTransaction,
  } = useAppData();

  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  const formatCurrency = (amount: number) => {
    const isNegative = amount < 0;
    const str = Math.abs(amount).toString();
    const formatted = str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return isNegative ? `-${formatted}` : formatted;
  };

  /** نفس ترتيب الصفحة الرئيسية: معاملات عادية + عملة، من الأحدث إلى الأقدم مع الفلترة */
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
    const combined = [...regular, ...currency].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (!filterQuery.trim()) return combined;

    const query = filterQuery.toLowerCase().trim();
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
    });
  }, [transactions, currencyTransactions, filterQuery, companies, fournisseurs, currencyCompanies]);

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === 'regular') {
      deleteTransaction(pendingDelete.id);
      toast.success('تم حذف المعاملة بنجاح');
    } else {
      deleteCurrencyTransaction(pendingDelete.id);
      toast.success('تم حذف تحويل العملة بنجاح');
    }
    setPendingDelete(null);
  };

  const hasAnyTransactions = transactions.length > 0 || currencyTransactions.length > 0;

  return (
    <div className="space-y-6">
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.kind === 'regular'
                ? 'سيتم حذف هذه المعاملة ولا يمكن التراجع عنها.'
                : 'سيتم حذف تحويل العملة ولا يمكن التراجع عنه.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              نعم، احذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">آخر المعاملات</h1>
          <p className="text-muted-foreground mt-1">سجل جميع المعاملات المالية (شركات، مزودين، تحويل عملة)</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في جميع المعاملات..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="h-11 pr-10 rounded-xl bg-background shadow-sm border-border/50 focus:ring-primary/20"
          />
        </div>
      </div>

      {!hasAnyTransactions ? (
        <Card className="p-12 text-center border border-border">
          <p className="text-muted-foreground">لا توجد معاملات حتى الآن</p>
        </Card>
      ) : (
        <Card className="border-0 card-premium overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="text-start py-4 px-6 font-bold font-heading text-foreground first:rounded-r-lg">التاريخ</th>
                  <th className="text-start py-4 px-6 font-bold font-heading text-foreground">نوع الكيان</th>
                  <th className="text-start py-4 px-6 font-bold font-heading text-foreground">الكيان</th>
                  <th className="text-start py-4 px-6 font-bold font-heading text-foreground">النوع</th>
                  <th className="text-start py-4 px-6 font-bold font-heading text-green-600">المدخول</th>
                  <th className="text-start py-4 px-6 font-bold font-heading text-red-600">المخرج</th>
                  <th className="text-start py-4 px-6 font-bold font-heading text-foreground">الوصف</th>
                  <th className="text-center py-4 px-6 font-bold font-heading text-foreground last:rounded-l-lg">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {lastTransactionsSorted.map((item) =>
                  item.kind === 'regular' ? (
                    <tr key={item.data.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-6 text-start text-muted-foreground font-medium">
                        {formatDateTime(item.data.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-start">
                        <Badge
                          className={
                            item.data.type === 'company'
                              ? 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 shadow-none border-0'
                              : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 shadow-none border-0'
                          }
                        >
                          {item.data.type === 'company' ? 'شركة' : 'مزود'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-start font-medium text-foreground">
                        {item.data.type === 'company' && item.data.companyId
                          ? companies.find((c) => c.id === item.data.companyId)?.name || 'غير محدد'
                          : item.data.type === 'fournisseur' && item.data.fournisseurId
                            ? fournisseurs.find((f) => f.id === item.data.fournisseurId)?.name || 'غير محدد'
                            : 'غير محدد'}
                      </td>
                      <td className="py-4 px-6 text-start">
                        <Badge
                          className={
                            item.data.amount > 0
                              ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20 shadow-none border-0 px-3 py-1 rounded-lg'
                              : item.data.amount < 0
                                ? 'bg-red-500/10 text-red-700 hover:bg-red-500/20 shadow-none border-0 px-3 py-1 rounded-lg'
                                : 'bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 shadow-none border-0 px-3 py-1 rounded-lg'
                          }
                        >
                          {item.data.amount > 0 ? 'مدخول' : item.data.amount < 0 ? 'مخروج' : 'دين'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-green-600" dir="ltr">
                        {item.data.amount > 0
                          ? `+${formatCurrency(item.data.amount)} ${item.data.type === 'company' ? 'د.ج' : (fournisseurs.find(f => f.id === item.data.fournisseurId)?.currency || 'USD')}`
                          : '/'}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-red-600" dir="ltr">
                        {item.data.amount < 0
                          ? `-${formatCurrency(Math.abs(item.data.amount))} ${item.data.type === 'company' ? 'د.ج' : (fournisseurs.find(f => f.id === item.data.fournisseurId)?.currency || 'USD')}`
                          : '/'}
                      </td>
                      <td className="py-4 px-6 text-start text-muted-foreground text-sm max-w-[200px] truncate">{item.data.description}</td>
                      <td className="py-4 px-6 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingDelete({ kind: 'regular', id: item.data.id })}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          aria-label="حذف المعاملة"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ) : (() => {
                    const currTransaction = item.data;
                    const currencyCompany = currencyCompanies.find(
                      (cc) => cc.id === currTransaction.currencyCompanyId
                    );
                    const supplier = currTransaction.usdFournisseurId
                      ? fournisseurs.find((f) => f.id === currTransaction.usdFournisseurId)
                      : null;
                    return (
                      <tr
                        key={`curr-${currTransaction.id}`}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-4 px-6 text-start text-muted-foreground font-medium">
                          {formatDateTime(currTransaction.createdAt)}
                        </td>
                        <td className="py-4 px-6 text-start">
                          <Badge className="bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 border-0 px-3 py-1 rounded-lg shadow-none">
                            تحويل عملة
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-start font-medium text-foreground">
                          {currencyCompany?.name || supplier?.name || 'غير محدد'}
                        </td>
                        <td className="py-4 px-6 text-start">
                          <Badge className="bg-red-500/10 text-red-700 border-0 px-3 py-1 rounded-lg shadow-none">
                            مخروج
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-green-600" dir="ltr">
                          {currTransaction.fromAmount > 0
                            ? `+${formatCurrency(currTransaction.toAmount)} د.ج`
                            : '/'}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-red-600" dir="ltr">
                          {currTransaction.fromAmount === 0
                            ? `-${formatCurrency(currTransaction.toAmount)} د.ج`
                            : '/'}
                        </td>
                        <td className="py-4 px-6 text-start text-muted-foreground text-sm max-w-[200px] truncate">
                          {currTransaction.description}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPendingDelete({ kind: 'currency', id: currTransaction.id })}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            aria-label="حذف تحويل العملة"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })()
                )}
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
              let deleteId = '';
              let deleteKind: 'regular' | 'currency' = 'regular';

              if (isRegular) {
                const t = transaction as any;
                deleteId = t.id;
                deleteKind = 'regular';
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
                deleteId = t.id;
                deleteKind = 'currency';
                const currencyCompany = currencyCompanies.find(cc => cc.id === t.currencyCompanyId);
                const supplier = t.usdFournisseurId ? fournisseurs.find(f => f.id === t.usdFournisseurId) : null;
                entityName = currencyCompany?.name || supplier?.name || 'غير محدد';

                typeLabel = 'تحويل عملة';
                typeColorClass = 'bg-purple-500/10 text-purple-700 border-purple-500/20';

                if (t.fromAmount > 0) {
                  amountColorClass = 'text-green-600';
                  amountDisplay = `+${formatCurrency(t.toAmount)} د.ج`;
                } else {
                  amountColorClass = 'text-red-600';
                  amountDisplay = `-${formatCurrency(t.toAmount)} د.ج`;
                }
              }

              return (
                <div key={`${transaction.id}-${index}-mobile`} className="bg-card/50 border border-border/50 rounded-xl p-4 shadow-sm active:scale-[0.98] transition-all relative">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-foreground text-base">{entityName}</p>
                      <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                        <span className="opacity-70">{formatDateTime(transaction.createdAt)}</span>
                      </p>
                    </div>
                    <Badge className={`${typeColorClass} border px-2 py-0.5 text-[10px] font-bold rounded-lg`}>
                      {typeLabel}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-end mt-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground line-clamp-1 italic">
                        {transaction.description || 'لا يوجد وصف'}
                      </p>
                    </div>
                    <p className={`text-lg font-black font-heading ${amountColorClass}`} dir="ltr">
                      {amountDisplay}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDelete({ kind: deleteKind, id: deleteId });
                    }}
                    className="absolute top-2 left-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}


    </div>
  );
}
