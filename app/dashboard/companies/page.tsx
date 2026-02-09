'use client';

import React from "react"

import { useState } from 'react';
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
import { Plus, Edit2, Trash2, TrendingUp, Eye } from 'lucide-react';
import { CurrencyInput } from '@/components/currency-input';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

export default function CompaniesPage() {
  const router = useRouter();
  const { companies, addCompany, updateCompany, loading, deleteCompany } = useAppData();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [description, setDescription] = useState('');
  const [initialCapital, setInitialCapital] = useState('');



  const handleAddCompany = async () => {
    if (!name || !owner || initialCapital === '') {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const capital = parseFloat(initialCapital);
    if (isNaN(capital) || capital < 0) {
      toast.error('رأس المال يجب أن يكون رقم صحيح');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        await updateCompany(editingId, {
          name,
          owner,
          description,
          initialCapital: capital,
          workingCapital: capital,
          image,
        });
        toast.success('تم تحديث الشركة بنجاح');
        setEditingId(null);
      } else {
        await addCompany({
          name,
          owner,
          description,
          initialCapital: capital,
          workingCapital: capital,
          sharePercentage: 100,
          isActive: true,
          image,
        });
        toast.success('تمت إضافة الشركة بنجاح');
      }
      setName('');
      setOwner('');
      setDescription('');
      setInitialCapital('');
      setImage(null);
      setIsOpen(false);
    } catch (error) {
      console.error('[v0] Error saving company:', error);
      toast.error('حدث خطأ أثناء حفظ الشركة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCompany = (company: typeof companies[0]) => {
    setEditingId(company.id);
    setName(company.name);
    setOwner(company.owner);
    setDescription(company.description);
    setInitialCapital(company.initialCapital.toString());
    setImage(company.image || null);
    setIsOpen(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;

    try {
      setIsDeleting(true);
      await deleteCompany(companyToDelete);
      toast.success('تم حذف الشركة بنجاح');
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error('[v0] Error deleting company:', error);
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
    setOwner('');
    setDescription('');
    setInitialCapital('');
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

  const formatCurrency = (amount: number) => {
    const str = Math.round(amount).toString();
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Get company status: profit or loss
  // workingCapital = مجموع المدخول + المخروج (المخروج سالب بالفعل)
  // إذا كان workingCapital موجب = ربح، إذا كان سالب = خسارة
  const getCompanyStatus = (company: typeof companies[0]) => {
    const isProfit = company.workingCapital >= 0;
    return {
      isProfit,
      difference: company.workingCapital, // This IS the profit/loss directly
      percentage: company.initialCapital > 0
        ? ((company.workingCapital / company.initialCapital) * 100).toFixed(1)
        : '0',
    };
  };

  // Calculate statistics
  const totalCapital = companies.reduce((sum, c) => sum + c.initialCapital, 0);
  const totalWorkingCapital = companies.reduce((sum, c) => sum + c.workingCapital, 0);
  const activeCompanies = companies.filter(c => c.isActive).length;

  return (
    <div className="min-h-screen">
      {/* Loading State */}
      {loading && (
        <div className="p-4 bg-orange-100 border border-orange-300 rounded-lg">
          <p className="text-sm text-orange-700">جاري تحميل الشركات...</p>
        </div>
      )}

      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pt-8 pb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent font-heading">الشركات</h1>
            <p className="text-muted-foreground mt-1 font-medium">إدارة الشركات ورؤوس الأموال بكفاءة</p>
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
                شركة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? 'تعديل الشركة' : 'إضافة شركة جديدة'}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الشركة</Label>
                  <Input
                    id="name"
                    placeholder="مثال: شركة سيارات"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner">مالك الشركة أو المسؤول</Label>
                  <Input
                    id="owner"
                    placeholder="مثال: أمير نوادي"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">رأس المال الأساسي (د.ج)</Label>
                  <CurrencyInput
                    placeholder="مثال: 1,000,000"
                    value={initialCapital}
                    onValueChange={setInitialCapital}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">صورة الشركة (الشعار)</Label>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <Input
                        id="image"
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
                  <Label htmlFor="description">الوصف (اختياري)</Label>
                  <Textarea
                    id="description"
                    placeholder="وصف الشركة..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={handleAddCompany}
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
        {companies.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Total Capital */}
            <Card className="p-6 border-0 card-premium">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">رأس المال الأساسي</p>
                  <p className="text-3xl font-bold font-heading text-primary mt-2" dir="ltr">
                    {formatCurrency(totalCapital)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-bold">د.ج</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </div>
            </Card>

            {/* Working Capital */}
            <Card className="p-6 border-0 card-premium">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">رأس المال العامل</p>
                  <p className="text-3xl font-bold font-heading text-amber-600 mt-2" dir="ltr">
                    {formatCurrency(totalWorkingCapital)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-bold">د.ج</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-amber-500" />
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
                  <p className="text-xs text-muted-foreground mt-1 font-bold">من أصل {companies.length}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Grid View - Companies Cards */}
        {companies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {companies.map((company) => {
              const status = getCompanyStatus(company);
              const bgGradient = status.isProfit
                ? 'from-green-500/5 to-transparent'
                : 'from-red-500/5 to-transparent';

              return (
                <Card
                  key={company.id}
                  className="overflow-hidden border-0 card-premium hover:shadow-2xl transition-all duration-300 cursor-pointer group flex flex-col relative"
                  onClick={() => router.push(`/dashboard/companies/details?id=${company.id}`)}
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
                        <div className="h-14 w-14 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 group-hover:scale-105 transition-transform">
                          <TrendingUp className="h-6 w-6 opacity-40" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold font-heading text-foreground group-hover:text-primary transition-colors truncate">
                          {company.name}
                        </h3>
                        <p className="text-[10px] mt-0.5 text-muted-foreground font-medium">
                          المالك: <span className="text-foreground">{company.owner}</span>
                        </p>
                      </div>
                    </div>
                    {/* Status Badge */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] shadow-sm border ${status.isProfit
                      ? 'bg-green-500/10 text-green-700 border-green-500/20'
                      : 'bg-red-500/10 text-red-700 border-red-500/20'
                      }`}>
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${status.isProfit ? 'bg-green-600' : 'bg-red-600'}`} />
                      {status.isProfit ? 'رابحة' : 'مسالة'}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className={`p-6 pt-2 flex-1 flex flex-col gap-4 bg-gradient-to-b ${bgGradient}`}>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        نظرة عامة على رأس المال
                      </div>
                      {company.isActive && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-bold text-blue-700">
                          <div className="w-1 h-1 bg-blue-500 rounded-full" />
                          نشط
                        </div>
                      )}
                    </div>

                    {/* Capital Info Box */}
                    <div className={`relative overflow-hidden rounded-2xl p-4 border transition-colors ${status.isProfit
                      ? 'bg-green-500/5 border-green-500/10'
                      : 'bg-red-500/5 border-red-500/10'
                      }`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${status.isProfit ? 'text-green-700' : 'text-red-700'}`}>
                        {status.isProfit ? 'الربح الإجمالي' : 'الدين يقدر بـ :'}
                      </p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <p className={`text-2xl font-bold font-heading ${status.isProfit ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                          {formatCurrency(company.workingCapital)}
                        </p>
                        <span className="text-[10px] font-bold text-muted-foreground">د.ج</span>
                      </div>

                    </div>

                    {/* Description */}
                    {company.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed h-10 italic">
                        "{company.description}"
                      </p>
                    )}

                    {/* Footer Info & Actions */}
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="text-[10px] text-muted-foreground font-bold">
                        تم الإنشاء: {formatDate(company.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCompany(company);
                          }}
                          className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                        >
                          <Edit2 className="h-4 w-4" />
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
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-16 border border-border text-center">
            <div className="space-y-4">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">لا توجد شركات</h3>
                <p className="text-muted-foreground mt-1">ابدأ بإضافة شركة جديدة لإدارة رأس المال والعمليات</p>
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
                    إضافة شركة الآن
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </Card>
        )}
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="حذف الشركة"
        description="هل أنت متأكد من حذف هذه الشركة؟ سيتم نقل جميع البيانات المتعلقة بها إلى سلة المهملات."
        isDeleting={isDeleting}
      />
    </div>
  );
}
