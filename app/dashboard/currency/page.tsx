'use client';

import React from "react"

import { useState, useMemo } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { useRouter } from 'next/navigation';
import { useAppData } from '@/app/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  ArrowLeftRight,
  Banknote,
  Building2,
  CheckCircle,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Filter,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { CurrencyInput } from '@/components/currency-input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { formatDate, convertToDZD, formatCurrency } from '@/lib/utils';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'RMB', 'DZD', 'OTHER'];

export default function CurrencyPage() {
  const router = useRouter();
  const { currencyCompanies, addCurrencyCompany, updateCurrencyCompany, deleteCurrencyCompany, currencyTransactions } = useAppData();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');
  const [targetCurrency, setTargetCurrency] = useState<string>('DZD');
  const [exchangeRate, setExchangeRate] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState('0');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const [baseCurrencies, setBaseCurrencies] = useState<string[]>(['USD']);
  const [targetCurrencies, setTargetCurrencies] = useState<string[]>(['DZD']);



  const handleAddCurrencyCompany = async () => {
    if (!name || baseCurrencies.length === 0 || targetCurrencies.length === 0) {
      toast.error('يرجى ملء جميع الحقول المطلوبة واختيار عملات');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        await updateCurrencyCompany(editingId, {
          name,
          baseCurrency: baseCurrencies[0],
          baseCurrencies,
          targetCurrency: targetCurrencies[0],
          targetCurrencies,
          description,
          image,
        });
        toast.success('تم تحديث شركة العملة بنجاح');
        setEditingId(null);
      } else {
        await addCurrencyCompany({
          name,
          baseCurrency: baseCurrencies[0],
          baseCurrencies,
          targetCurrency: targetCurrencies[0],
          targetCurrencies,
          exchangeRate: 1,
          commissionPercentage: 0,
          description,
          image,
          isActive: true,
        });
        toast.success('تمت إضافة شركة العملة بنجاح');
      }
      setName('');
      setBaseCurrencies(['USD']);
      setTargetCurrencies(['DZD']);
      setDescription('');
      setImage(null);
      setIsOpen(false);
    } catch (error) {
      console.error('[v0] Error saving currency company:', error);
      toast.error('حدث خطأ أثناء حفظ الشركة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCurrencyCompany = (company: typeof currencyCompanies[0]) => {
    setEditingId(company.id);
    setName(company.name);
    // Use new array columns if available, fallback to parsing old format
    setBaseCurrencies(
      company.baseCurrencies && company.baseCurrencies.length > 0
        ? company.baseCurrencies
        : (company.baseCurrency?.includes(',')
          ? company.baseCurrency.split(',').map(c => c.trim())
          : [company.baseCurrency])
    );
    setTargetCurrencies(
      company.targetCurrencies && company.targetCurrencies.length > 0
        ? company.targetCurrencies
        : (company.targetCurrency?.includes(',')
          ? company.targetCurrency.split(',').map(c => c.trim())
          : [company.targetCurrency])
    );
    setExchangeRate(company.exchangeRate.toString());
    setCommissionPercentage(company.commissionPercentage.toString());
    setDescription(company.description || "");
    setImage(company.image || null);
    setIsOpen(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;

    try {
      setIsDeleting(true);
      await deleteCurrencyCompany(companyToDelete);
      toast.success('تم حذف شركة العملة بنجاح');
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error('[v0] Error deleting currency company:', error);
      toast.error('حدث خطأ أثناء حذف الشركة');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setCompanyToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingId(null);
    setName('');
    setBaseCurrencies(['USD']);
    setTargetCurrencies(['DZD']);
    setExchangeRate('');
    setCommissionPercentage('0');
    setDescription('');
    setImage(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          toast.error(error.error || 'فشل رفع الصورة');
          return;
        }

        const data = await response.json();
        setImage(data.url);
        toast.success('تم رفع الصورة بنجاح');
      } catch (error) {
        console.error('[v0] Image upload error:', error);
        toast.error('حدث خطأ أثناء رفع الصورة');
      }
    }
  };

  // Calculate statistics
  const totalCompanies = currencyCompanies.length;
  const activeCompanies = currencyCompanies.filter(c => c.isActive).length;
  const avgExchangeRate = currencyCompanies.length > 0
    ? (currencyCompanies.reduce((sum, c) => sum + c.exchangeRate, 0) / currencyCompanies.length).toFixed(4)
    : '0';

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header Section */}
        <div className="flex items-center justify-between pt-8 pb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent flex items-center gap-3 font-heading">
              <DollarSign className="h-10 w-10 text-primary" />
              شركات العملة
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">إدارة شركات تحويل العملات والأسعار الصرفية بكفاءة</p>
          </div>

          <Dialog open={isOpen} onOpenChange={(newOpen) => {
            if (!newOpen) {
              handleCloseDialog();
            } else {
              setIsOpen(true);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-orange-700 shadow-lg">
                <Plus className="h-4 w-4" />
                شركة عملة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? 'تعديل شركة العملة' : 'إضافة شركة عملة جديدة'}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cc-name">اسم الشركة</Label>
                  <Input
                    id="cc-name"
                    placeholder="مثال: صرافة القاهرة"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>سعر الصرف الافتراضي (DZD)</Label>
                  <CurrencyInput
                    placeholder="مثال: 220"
                    value={exchangeRate}
                    onValueChange={setExchangeRate}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 ps-1">القيمة التي يتم اقتراحها عند كل عملية تحويل</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Base Currencies */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>العملات الأساسية</Label>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {baseCurrencies.length} محددة
                      </span>
                    </div>
                    <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30 max-h-48 overflow-y-auto">
                      {CURRENCIES.filter(c => c !== 'DZD').map((curr) => (
                        <div key={curr} className="flex items-center gap-3">
                          <Checkbox
                            id={`base-${curr}`}
                            checked={baseCurrencies.includes(curr)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setBaseCurrencies([...baseCurrencies, curr]);
                              } else {
                                setBaseCurrencies(baseCurrencies.filter(c => c !== curr));
                              }
                            }}
                          />
                          <Label htmlFor={`base-${curr}`} className="font-normal cursor-pointer">
                            {curr}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">اختر عملة واحدة أو أكثر</p>
                  </div>

                  {/* Target Currencies */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>العملات المستهدفة</Label>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                        {targetCurrencies.length} محددة
                      </span>
                    </div>
                    <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30 max-h-48 overflow-y-auto">
                      {CURRENCIES.map((curr) => (
                        <div key={curr} className="flex items-center gap-3">
                          <Checkbox
                            id={`target-${curr}`}
                            checked={targetCurrencies.includes(curr)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTargetCurrencies([...targetCurrencies, curr]);
                              } else {
                                setTargetCurrencies(targetCurrencies.filter(c => c !== curr));
                              }
                            }}
                          />
                          <Label htmlFor={`target-${curr}`} className="font-normal cursor-pointer">
                            {curr}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">اختر عملة واحدة أو أكثر</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cc-image">صورة الشركة (الشعار)</Label>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <Input
                        id="cc-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG - أقصى حجم 5MB</p>
                    </div>
                    {image && (
                      <img
                        src={image || "/placeholder.svg"}
                        alt="معاينة الصورة"
                        className="h-16 w-16 object-cover rounded-lg border border-border"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cc-description">الوصف (اختياري)</Label>
                  <Textarea
                    id="cc-description"
                    placeholder="أضف وصف لشركة العملة"
                    value={description || ''}
                    onChange={(e) => setDescription(e.target.value)}
                    className="resize-none min-h-20"
                  />
                </div>

                <Button
                  onClick={handleAddCurrencyCompany}
                  className="w-full bg-primary text-primary-foreground hover:bg-orange-700"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (editingId ? 'جاري التحديث...' : 'جاري الإضافة...') : (editingId ? 'تحديث الشركة' : 'إضافة الشركة')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Section */}
        {currencyCompanies.length > 0 && (
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Total Companies */}
              <Card className="p-6 border-0 card-premium">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">إجمالي الشركات</p>
                    <p className="text-3xl font-bold font-heading text-primary mt-2">
                      {totalCompanies}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-bold">شركات صرافة</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </Card>

              {/* Active Companies */}
              <Card className="p-6 border-0 card-premium">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">الشركات النشطة</p>
                    <p className="text-3xl font-bold font-heading text-green-600 mt-2">
                      {activeCompanies}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-bold">من أصل {totalCompanies}</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-xl">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Total Balance in DZD */}
            {(() => {
              const activeCT = currencyTransactions.filter(ct =>
                currencyCompanies.some(cc => cc.id === ct.currencyCompanyId)
              );
              if (activeCT.length === 0) return null;

              const dzdTotal = activeCT.reduce((sum, t) => {
                const amount = t.toAmount || 0;
                return sum + (t.fromAmount > 0 ? amount : -amount);
              }, 0);

              const isOwedToCompanies = dzdTotal > 0;

              return (
                <Card className={`p-8 border-0 card-premium bg-gradient-to-br ${isOwedToCompanies ? 'from-red-500/5' : 'from-green-500/5'} to-transparent`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-bold">إجمالي الأرصدة (صافي)</p>
                      <p className={`text-4xl font-bold font-heading ${isOwedToCompanies ? 'text-red-600' : 'text-green-600'} mt-2`} dir="ltr">
                        {isOwedToCompanies ? '+' : ''}{formatCurrency(Math.abs(dzdTotal))}
                      </p>
                      <p className={`text-[10px] font-black mt-2 bg-muted/50 w-fit px-3 py-1 rounded-full ${isOwedToCompanies ? 'text-red-700' : 'text-green-700'}`}>
                        {isOwedToCompanies ? 'شركات العملة تسالك هذا المبلغ الإجمالي' : 'لديك هذا المبلغ الإجمالي عند الشركات'}
                      </p>
                      <p className={`text-xs ${isOwedToCompanies ? 'text-red-600' : 'text-green-600'} mt-2 font-black uppercase tracking-widest`}>DZD</p>
                    </div>
                    <div className={`p-4 ${isOwedToCompanies ? 'bg-red-500/10' : 'bg-green-500/10'} rounded-2xl`}>
                      <Banknote className={`h-10 w-10 ${isOwedToCompanies ? 'text-red-600' : 'text-green-600'}`} />
                    </div>
                  </div>
                </Card>
              );
            })()}
          </div>
        )}

        {/* Grid View - Currency Companies Cards */}
        {currencyCompanies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currencyCompanies.map((company) => (
              <Card
                key={company.id}
                onClick={() => router.push(`/dashboard/currency/${company.id}`)}
                className="overflow-hidden border-0 card-premium hover:shadow-2xl transition-all duration-300 group flex flex-col cursor-pointer"
              >
                {/* Card Front Top */}
                <div className="p-6 pb-4 flex items-start justify-between bg-gradient-to-b from-muted/20 to-transparent">
                  <div className="flex items-center gap-4">
                    {company.image ? (
                      <div className="h-14 w-14 rounded-xl overflow-hidden border border-black/5 shadow-sm group-hover:scale-105 transition-transform">
                        <img
                          src={company.image}
                          alt={company.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                        <Banknote className="h-6 w-6 opacity-40" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold font-heading text-foreground group-hover:text-primary transition-colors truncate">
                        {company.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md border border-border/40">
                          <span className="text-primary">{(company.baseCurrencies && company.baseCurrencies.length > 0 ? company.baseCurrencies.join(', ') : company.baseCurrency)}</span>
                          <ArrowLeftRight className="h-2.5 w-2.5 mx-0.5 opacity-50" />
                          <span className="text-amber-600">{(company.targetCurrencies && company.targetCurrencies.length > 0 ? company.targetCurrencies.join(', ') : company.targetCurrency)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {company.isActive && (
                    <div className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-[10px] font-bold text-green-700">
                      نشط
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-6 pt-2 space-y-4">

                  <div className="space-y-3">
                    {(() => {
                      const companyTransactions = currencyTransactions.filter(t => t.currencyCompanyId === company.id);
                      const totalInUSD = companyTransactions.reduce((sum, t) => sum + (t.fromAmount || 0), 0);

                      // DZD Income (Value of received hard currency)
                      const dzdIncome = companyTransactions
                        .filter(t => t.fromAmount > 0)
                        .reduce((sum, t) => sum + (t.toAmount || 0), 0);

                      // DZD Outcome (Actual DZD paid)
                      const dzdOutcome = companyTransactions
                        .filter(t => t.fromAmount === 0)
                        .reduce((sum, t) => sum + Math.abs(t.toAmount || 0), 0);

                      const dzdBalance = dzdIncome - dzdOutcome;

                      return (
                        <div className="space-y-3 pt-2">
                          <div className={`p-5 rounded-[1.5rem] border ${dzdBalance > 0 ? 'bg-red-600/10 border-red-600/20' : 'bg-green-600/10 border-green-600/20'} transition-all group-hover:shadow-md`}>
                            <div className="flex flex-col items-center justify-center text-center gap-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">الرصيد الحالي (DZD)</p>
                              <p className={`text-3xl font-black font-heading ${dzdBalance > 0 ? 'text-red-600' : 'text-green-600'}`} dir="ltr">
                                {dzdBalance > 0 ? '+' : ''}{dzdBalance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                              </p>
                              <div className={`mt-2 px-3 py-1 rounded-full text-[9px] font-bold uppercase ${dzdBalance > 0 ? 'bg-red-500/20 text-red-700' : 'bg-green-500/20 text-green-700'}`}>
                                {dzdBalance > 0 ? 'شركة العملة تسالك هذا المبلغ' : 'لديك مبلغ عند الشركة'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {company.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed italic opacity-70">
                      "{company.description}"
                    </p>
                  )}

                  {/* Card Footer */}
                  <div className="flex gap-2 pt-4 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/currency/${company.id}`);
                      }}
                      className="flex-1 text-primary hover:bg-primary/10 font-bold text-xs rounded-lg"
                    >
                      عرض الحساب
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCurrencyCompany(company);
                        }}
                        className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(company.id);
                        }}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-16 border border-border text-center">
            <div className="space-y-4">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">لا توجد شركات عملة</h3>
                <p className="text-muted-foreground mt-1">ابدأ بإضافة شركة عملة جديدة لإدارة عمليات تحويل العملات</p>
              </div>
              <Dialog open={isOpen} onOpenChange={(newOpen) => {
                if (!newOpen) {
                  handleCloseDialog();
                } else {
                  setIsOpen(true);
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-primary text-primary-foreground hover:bg-orange-700 mx-auto">
                    <Plus className="h-4 w-4" />
                    إضافة شركة عملة الآن
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </Card>
        )}
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="حذف شركة العملة"
          description="هل أنت متأكد من حذف هذه الشركة؟ سيتم حذف جميع المعاملات المرتبطة بها ونقلها إلى سلة المحذوفات."
          isDeleting={isDeleting}
        />
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="حذف الشركة"
        description="هل أنت متأكد من حذف شركة العملة هذه؟ سيتم نقل جميع البيانات المتعلقة بها إلى سلة المهملات."
        isDeleting={isDeleting}
      />
    </div>
  );
}
