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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, DollarSign, Edit2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, convertToDZD } from '@/lib/utils';
import { Ban as Yuan } from 'lucide-react'; // Added import for Yuan

const CURRENCIES = ['USD', 'RMB', 'EUR', 'GBP']; // Declare CURRENCIES variable

export default function FournisseursPage() {
  const router = useRouter();
  const { fournisseurs, addFournisseur, updateFournisseur, deleteFournisseur, transactions } = useAppData();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fournisseurToDelete, setFournisseurToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState(''); // Declare name variable
  const [selectedCurrency, setSelectedCurrency] = useState(''); // Declare selectedCurrency variable
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddFournisseur = async () => {
    if (!name || !selectedCurrency) {
      toast.error('يرجى إدخال اسم المزود واختيار عملة');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        await updateFournisseur(editingId, { name, currency: selectedCurrency, image });
        toast.success('تم تحديث المزود بنجاح');
        setEditingId(null);
      } else {
        await addFournisseur({ name, currency: selectedCurrency, image, balance: 0 });
        toast.success('تمت إضافة المزود بنجاح');
      }
      setName('');
      setSelectedCurrency('');
      setImage(null);
      setIsOpen(false);
    } catch (error) {
      console.error('[v0] Error saving fournisseur:', error);
      toast.error('حدث خطأ أثناء حفظ المزود');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFournisseur = (fournisseur: typeof fournisseurs[0]) => {
    setEditingId(fournisseur.id);
    setName(fournisseur.name);
    setSelectedCurrency(fournisseur.currency);
    setImage(fournisseur.image || null);
    setIsOpen(true);
  };

  const confirmDelete = async () => {
    if (!fournisseurToDelete) return;

    try {
      setIsDeleting(true);
      await deleteFournisseur(fournisseurToDelete);
      toast.success('تم حذف المزود بنجاح');
      setDeleteDialogOpen(false);
      setFournisseurToDelete(null);
    } catch (error) {
      console.error('[v0] Error deleting fournisseur:', error);
      toast.error('حدث خطأ أثناء حذف المزود');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setFournisseurToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingId(null);
    setName('');
    setSelectedCurrency('');
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

  const getCurrencyIcon = (curr: 'USD' | 'RMB' | 'EUR' | 'GBP') => {
    return curr === 'USD' ? (
      <DollarSign className="h-4 w-4" />
    ) : curr === 'RMB' ? (
      <span className="text-sm">¥</span>
    ) : curr === 'EUR' ? (
      <span className="text-sm">€</span>
    ) : (
      <span className="text-sm">£</span>
    );
  };

  const getCurrencyLabel = (curr: 'USD' | 'RMB' | 'EUR' | 'GBP') => {
    return curr === 'USD' ? 'دولار أمريكي' : curr === 'RMB' ? 'يوان صيني' : curr === 'EUR' ? 'يورو' : 'جنيه بريطاني';
  };

  const getFournisseurBalance = (fournisseurId: string) => {
    // Get balance directly from fournisseur record (this is updated in real-time in the context)
    const fournisseur = fournisseurs.find(f => f.id === fournisseurId);
    return fournisseur?.balance || 0;
  };

  // Calculate statistics
  const usdBalance = fournisseurs
    .filter(f => f.currency === 'USD')
    .reduce((sum, f) => sum + getFournisseurBalance(f.id), 0);

  const rmbBalance = fournisseurs
    .filter(f => f.currency === 'RMB')
    .reduce((sum, f) => sum + getFournisseurBalance(f.id), 0);

  const usdCount = fournisseurs.filter(f => f.currency === 'USD').length;
  const rmbCount = fournisseurs.filter(f => f.currency === 'RMB').length;

  const otherCurrencies = CURRENCIES.filter(c => c !== 'USD' && c !== 'RMB');
  const otherBalances = otherCurrencies.map(curr => ({
    currency: curr,
    balance: fournisseurs
      .filter(f => f.currency === curr)
      .reduce((sum, f) => sum + getFournisseurBalance(f.id), 0),
    count: fournisseurs.filter(f => f.currency === curr).length,
  }));

  const totalBalance = usdBalance + rmbBalance; // Declare totalBalance variable

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pt-8 pb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent font-heading">المزودين</h1>
            <p className="text-muted-foreground mt-1 font-medium">إدارة المزودين والعملات الأجنبية بكفاءة</p>
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
                مزود جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? 'تعديل المزود' : 'إضافة مزود جديد'}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المزود</Label>
                  <Input
                    id="name"
                    placeholder="مثال: المزود الرئيسي"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label>اختر العملة</Label>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر عملة..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr} value={curr}>
                          {getCurrencyLabel(curr as 'USD' | 'RMB' | 'EUR' | 'GBP')} ({curr})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">صورة المزود (الشعار)</Label>
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

                <Button onClick={handleAddFournisseur} className="w-full bg-primary text-primary-foreground hover:bg-orange-700" size="lg" disabled={isSubmitting}>
                  {editingId ? 'تحديث المزود' : 'إضافة المزود'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Section */}
        {fournisseurs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* USD Balance */}
            <Card className="p-6 border-0 card-premium">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">إجمالي رصيد الدولار</p>
                  <p className={`text-3xl font-bold font-heading mt-2 ${usdBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                    {usdBalance > 0 ? '+' : ''}{usdBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                  </p>
                  <p className="text-xs text-blue-600 mt-1 font-bold">USD</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </Card>

            {/* RMB Balance */}
            <Card className="p-6 border-0 card-premium">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">إجمالي رصيد اليوان</p>
                  <p className={`text-3xl font-bold font-heading mt-2 ${rmbBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                    {rmbBalance > 0 ? '+' : ''}{rmbBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                  </p>
                  <p className="text-xs text-red-600 mt-1 font-bold">¥ RMB</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-xl text-red-600 text-2xl font-bold flex items-center justify-center">
                  ¥
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Grid View - Suppliers Cards */}
        {fournisseurs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {fournisseurs.map((fournisseur) => {
              const balance = getFournisseurBalance(fournisseur.id);
              const transactionCount = transactions.filter(
                (t) => t.type === 'fournisseur' && t.fournisseurId === fournisseur.id
              ).length;

              return (
                <Card
                  key={fournisseur.id}
                  className="overflow-hidden border-0 card-premium hover:shadow-2xl transition-all duration-300 cursor-pointer group flex flex-col"
                  onClick={() => router.push(`/dashboard/fournisseurs/details?id=${fournisseur.id}`)}
                >
                  {/* Card Front Top */}
                  <div className="p-6 flex items-start justify-between bg-gradient-to-b from-muted/20 to-transparent">
                    <div className="flex items-center gap-4">
                      {fournisseur.image ? (
                        <div className="h-14 w-14 rounded-xl overflow-hidden border border-black/5 shadow-sm group-hover:scale-105 transition-transform">
                          <img
                            src={fournisseur.image}
                            alt={fournisseur.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                          <Eye className="h-6 w-6 opacity-40" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-bold font-heading text-foreground group-hover:text-primary transition-colors">
                          {fournisseur.name}
                        </h3>
                        <div className="flex items-center gap-1 px-2 py-0.5 mt-1 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-md w-fit">
                          {getCurrencyIcon(fournisseur.currency as 'USD' | 'RMB' | 'EUR' | 'GBP')}
                          <span className="text-[10px] font-bold text-orange-700">{fournisseur.currency}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 pt-0 space-y-4">
                    {/* Balance Info */}
                    <div className="bg-muted/30 p-4 rounded-2xl border border-black/5 relative overflow-hidden group-hover:bg-primary/5 transition-colors">
                      <p className="text-[10px] text-muted-foreground font-bold">الرصيد الحالي</p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <p className={`text-2xl font-bold font-heading ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                          {balance > 0 ? '+' : ''}{balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                        </p>
                        <span className="text-xs font-bold text-muted-foreground">{fournisseur.currency}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4">
                      <div className="flex-1 p-3 bg-muted/20 rounded-xl text-center">
                        <p className="text-[10px] text-muted-foreground font-bold">المعاملات</p>
                        <p className="text-lg font-bold font-heading text-foreground">{transactionCount}</p>
                      </div>
                      <div className="flex-1 p-3 bg-muted/20 rounded-xl text-center">
                        <p className="text-[10px] text-muted-foreground font-bold">تاريخ الإنشاء</p>
                        <p className="text-[10px] font-bold text-foreground mt-1 truncate">{formatDate(fournisseur.createdAt)}</p>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-2 pt-4 border-t border-border/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-primary hover:bg-primary/10 font-bold text-xs rounded-lg"
                      >
                        تفاصيل كاملة
                      </Button>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditFournisseur(fournisseur);
                          }}
                          className="h-9 w-9 text-primary hover:bg-primary/10 rounded-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(fournisseur.id);
                          }}
                          className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-lg"
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
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">لا يوجد مزودين</h3>
                <p className="text-muted-foreground mt-1">ابدأ بإضافة مزود جديد لإدارة العملات الأجنبية</p>
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
                    إضافة مزود الآن
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
          title="حذف المزود"
          description="هل أنت متأكد من حذف هذا المزود؟ سيتم حذف جميع المعاملات المرتبطة به ونقله إلى سلة المحذوفات."
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}
