'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { useAppData } from '@/app/context/app-context';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
} from "@/components/ui/table";
import { CurrencyInput } from '@/components/currency-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { AlertCircle, CheckCircle, Lock, Palette, Calendar, Trash2, RotateCcw, Building2, Truck, FileText, Banknote, ArrowLeftRight, Wallet, Plus, ShieldCheck, PlusCircle, MinusCircle, History as HistoryIcon, Clock, ShieldAlert, ChevronLeft, Loader2, KeyRound, FolderOpen, Cloud } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

export default function SettingsPage() {
  const { user, logout, updateProfile, login } = useAuth();
  const { theme, setTheme } = useTheme();
  const {
    companies,
    transactions,
    updateCompany,
    fundCapital,
    fundTransactions,
    saveFundCapital,
    addFundTransaction,
    deleteAllOldTransactions,
    trash,
    loadTrash,
    restoreFromTrash,
    permanentlyDeleteFromTrash,
    emptyTrash,
    resetAppData,
    loading: appLoading
  } = useAppData();

  // Settings State
  const [newEmail, setNewEmail] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Lock Screen State
  const [isLocked, setIsLocked] = useState(true);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Fund Management State
  const [showFundDialog, setShowFundDialog] = useState(false);
  const [fundOpType, setFundOpType] = useState<'add' | 'withdraw' | 'set'>('add');
  const [opAmount, setOpAmount] = useState('');
  const [opDescription, setOpDescription] = useState('');
  const [opPassword, setOpPassword] = useState('');
  const [isSubmittingFund, setIsSubmittingFund] = useState(false);

  const [viewOldTransactions, setViewOldTransactions] = useState(false);
  // Re-purposing password prompt state for general sensitive actions if needed
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isDeletingTransactions, setIsDeletingTransactions] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null);
  const [autoBackupPath, setAutoBackupPath] = useState('');
  const [isSavingBackupPath, setIsSavingBackupPath] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [isResettingApp, setIsResettingApp] = useState(false);
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);
  const [emptyTrashDialogOpen, setEmptyTrashDialogOpen] = useState(false);
  const [autoCloudBackup, setAutoCloudBackup] = useState(false);
  const [lastAutoBackup, setLastAutoBackup] = useState<string | null>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Manual Export/Import Logic
  const handleManualExport = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('يرجى تسجيل الدخول أولاً');
        return;
      }

      toast.promise(
        async () => {
          const res = await fetch('/api/backup', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'فشل التصدير');
          }

          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          const contentDisposition = res.headers.get('Content-Disposition');
          let fileName = `amir-backup-${new Date().toISOString().split('T')[0]}.zip`;
          if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^"]+)"?/);
            if (match && match[1]) fileName = match[1];
          }

          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        },
        {
          loading: 'جاري تحضير النسخة الاحتياطية...',
          success: 'تم تحميل النسخة الاحتياطية بنجاح',
          error: (err) => `فشل التصدير: ${err.message}`
        }
      );
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleManualImport = async (file: File) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('يرجى تسجيل الدخول أولاً');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading('جاري استيراد البيانات...');

    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل الاستيراد');
      }

      toast.success('تم استعادة البيانات بنجاح! جاري التحديث...', { id: toastId });
      setTimeout(() => { window.location.reload(); }, 2000);
    } catch (e: any) {
      console.error(e);
      toast.error(`خطأ: ${e.message}`, { id: toastId });
    }
  };

  useEffect(() => {
    if (user) {
      if (user.backupPath) setAutoBackupPath(user.backupPath);
      if (user.email) setNewEmail(user.email);
    }
    // Load cloud settings from localStorage
    const savedAutoCloud = localStorage.getItem('auto_cloud_backup') === 'true';
    const savedLastBackup = localStorage.getItem('last_auto_backup');
    setAutoCloudBackup(savedAutoCloud);
    setLastAutoBackup(savedLastBackup);
  }, [user]);

  const handleToggleAutoCloud = async (checked: boolean) => {
    setAutoCloudBackup(checked);
    localStorage.setItem('auto_cloud_backup', String(checked));

    if (checked) {
      toast.info('جاري بدء أول نسخة احتياطية سحابية للتأكد من الربط...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch('/api/backup/auto-cloud', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (res.ok) {
          const now = new Date().toISOString();
          setLastAutoBackup(now);
          localStorage.setItem('last_auto_backup', now);
          toast.success('تم رفع النسخة السحابية بنجاح! ستجدها في Drive الآن.');
        } else {
          toast.error('لم نتمكن من رفع النسخة الأولى، يرجى التحقق من إعدادات Vercel');
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      toast.info('تم إيقاف النسخ الاحتياطي التلقائي');
    }
  };

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'فشل توليد رابط الاتصال');
      }
    } catch (error: any) {
      toast.error(`فشل بدء عملية الربط: ${error.message}`);
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          google_refresh_token: null,
          google_email: null
        }
      });

      if (error) throw error;

      toast.success('تم فصل الحساب بنجاح');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast.error(`فشل فصل الحساب: ${error.message}`);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_auth_success') === 'true') {
      const refreshToken = params.get('refresh_token');
      const googleEmail = params.get('google_email');

      const finalize = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && refreshToken) {
          const { error } = await supabase.auth.updateUser({
            data: {
              ...user.user_metadata,
              google_refresh_token: refreshToken,
              google_email: googleEmail
            }
          });

          if (error) {
            toast.error('فشل حفظ بيانات الاتصال');
          } else {
            toast.success('تم ربط حساب Google Drive بنجاح');
            // Clear params from URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      };
      finalize();
    } else if (params.get('error')) {
      toast.error(`فشل عملية الربط: ${params.get('error')}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSaveBackupPath = async () => {
    if (!autoBackupPath) {
      toast.error('يرجى إدخال مسار المجلد');
      return;
    }

    if (!user?.email) return;

    setIsSavingBackupPath(true);
    try {
      // 1. Validate and Save on Server
      const res = await fetch('/api/settings/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, path: autoBackupPath })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل حفظ المسار');
      }

      // 2. Sync Context
      await updateProfile({ backupPath: autoBackupPath });

      toast.success('تم حفظ مسار النسخ الاحتياطي التلقائي بنجاح');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSavingBackupPath(false);
    }
  };

  const handleResetApp = async () => {
    if (!resetConfirmPassword) {
      toast.error('يرجى إدخال كلمة المرور للتأكيد');
      return;
    }

    if (!user?.email) return;

    setIsResettingApp(true);
    try {
      // 1. Verify password
      await login(user.email, resetConfirmPassword);

      // 2. Clear all data
      await resetAppData();

      toast.success('تمت إعادة تعيين التطبيق بنجاح! تم مسح كافة البيانات.');
      setResetDialogOpen(false);
      setResetConfirmPassword('');

      // 3. Optional: redirect or reload
      window.location.reload();
    } catch (e: any) {
      toast.error('فشل إعادة التعيين: كلمة المرور غير صحيحة');
    } finally {
      setIsResettingApp(false);
    }
  };

  // ... (rest of component) ...

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    setIsUnlocking(true);
    try {
      // attempt login to verify password
      await login(user.email, unlockPassword);
      setIsLocked(false);
      toast.success('تم تأكيد الهوية بنجاح');
    } catch (err) {
      toast.error('كلمة المرور غير صحيحة');
    } finally {
      setIsUnlocking(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const str = Math.round(amount).toString();
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const formatCurrencyInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Calculate company stats
  const companyStats = useMemo(() => {
    return companies.map((company) => {
      const companyTransactions = transactions.filter(t => t.companyId === company.id);
      const income = companyTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const outcome = Math.abs(companyTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
      const profit = income - outcome;

      return {
        ...company,
        income,
        outcome,
        profit,
      };
    });
  }, [companies, transactions]);

  // Calculate current profits (only active companies with positive profit)
  const currentProfits = useMemo(() => {
    return companyStats
      .filter(c => c.isActive && c.profit > 0)
      .reduce((sum, c) => sum + c.profit, 0);
  }, [companyStats]);

  // Calculate new capital
  const newCapital = useMemo(() => {
    return fundCapital.localCapital + currentProfits;
  }, [fundCapital.localCapital, currentProfits]);

  const handleFundOperation = async (overrideType?: 'add' | 'withdraw' | 'set') => {
    const activeType = overrideType || fundOpType;

    const amount = Number(opAmount);
    if (!opAmount || isNaN(amount)) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    setIsSubmittingFund(true);
    try {
      if (activeType === 'set') {
        if (!opPassword) {
          toast.error('يرجى إدخال كلمة السر للتأكيد');
          setIsSubmittingFund(false);
          return;
        }
        await saveFundCapital(amount, opPassword);

        // Update the main company's working capital with the new fund capital
        if (companies.length > 0) {
          await updateCompany(companies[0].id, {
            workingCapital: amount
          });
        }

        toast.success('تم إعداد رأس المال بنجاح');
      } else {
        const finalAmount = activeType === 'add' ? amount : -amount;
        await addFundTransaction({
          type: activeType,
          amount: finalAmount,
          description: opDescription || (activeType === 'add' ? 'إضافة رصيد للصندوق' : 'سحب رصيد من الصندوق')
        });
        toast.success(activeType === 'add' ? 'تم إضافة المبلغ بنجاح' : 'تم سحب المبلغ بنجاح');
      }
      setShowFundDialog(false);
      setOpAmount('');
      setOpDescription('');
      setOpPassword('');
    } catch (error) {
      console.error('[v0] Error saving fund capital:', error);
      toast.error('فشل في تنفيذ العملية. تأكد من كلمة السر.');
    } finally {
      setIsSubmittingFund(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'set': return <ShieldCheck className="h-4 w-4 text-blue-600" />;
      case 'add': return <PlusCircle className="h-4 w-4 text-green-600" />;
      case 'withdraw': return <MinusCircle className="h-4 w-4 text-red-600" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'set': return 'تعيين أساسي';
      case 'add': return 'إيداع';
      case 'withdraw': return 'سحب';
      default: return 'عملية';
    }
  };

  const isFundInitialized = fundCapital.localCapital > 0 || fundTransactions.length > 0;

  if (appLoading) return <div className="p-8 text-center">جاري التحميل...</div>;

  // Lock Screen UI
  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="p-6 bg-muted/30 rounded-full mb-2">
          <Lock className="h-16 w-16 text-muted-foreground/50" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold font-heading">منطقة محمية</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">يرجى إدخال كلمة المرور للوصول إلى الإعدادات</p>
        </div>
        <form onSubmit={handleUnlock} className="flex gap-2 w-full max-w-sm">
          <Input
            type="password"
            placeholder="كلمة المرور"
            value={unlockPassword}
            onChange={(e) => setUnlockPassword(e.target.value)}
            className="h-12 rounded-xl"
            autoFocus
          />
          <Button type="submit" size="lg" className="h-12 rounded-xl px-6" disabled={isUnlocking}>
            {isUnlocking ? <Loader2 className="h-5 w-5 animate-spin" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </form>
      </div>
    );
  }

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    try {
      // Verify old password by trying to log in (re-auth)
      if (!user) return;
      await login(user.email, oldPassword); // This throws if invalid

      // Update
      await updateProfile({ password: newPassword });
      toast.success('تمت تغيير كلمة المرور بنجاح');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordDialogOpen(false);
    } catch (e) {
      toast.error('كلمة المرور القديمة غير صحيحة');
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail) {
      toast.error('يرجى إدخال بريد إلكتروني');
      return;
    }

    if (!newEmail.includes('@')) {
      toast.error('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    try {
      await updateProfile({ email: newEmail });
      toast.success('تمت تغيير البريد الإلكتروني بنجاح');
    } catch (e) {
      toast.error('حدث خطأ أثناء تحديث البريد الإلكتروني');
    }
  };

  const handleToggleOldTransactions = () => {
    if (!viewOldTransactions) {
      setShowPasswordPrompt(true);
    } else {
      setViewOldTransactions(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!user) return;
    try {
      await login(user.email, passwordInput);
      setViewOldTransactions(true);
      setShowPasswordPrompt(false);
      setPasswordInput('');
      toast.success('تم تفعيل عرض المعاملات القديمة');
    } catch {
      toast.error('كلمة المرور غير صحيحة');
    }
  };

  const confirmDeleteAllTransactions = async () => {
    try {
      setIsDeletingTransactions(true);
      await deleteAllOldTransactions();
      toast.success('تم حذف جميع المعاملات بنجاح');
      setViewOldTransactions(false);
      setDeleteAllDialogOpen(false);
    } catch (error) {
      console.error('[v0] Error deleting transactions:', error);
      toast.error('حدث خطأ أثناء حذف المعاملات');
    } finally {
      setIsDeletingTransactions(false);
    }
  };

  const getTrashCountLabel = (count: number) => {
    if (count === 1) return 'عنصر واحد متاح';
    if (count === 2) return 'عنصران متاحان';
    if (count >= 3 && count <= 10) return `${count} عناصر متاحة`;
    return `${count} عنصر متاح`;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold text-foreground">الإعدادات</h1>
        <p className="text-muted-foreground mt-1">إدارة حسابك والتفضيلات العامة</p>
      </div>

      <Tabs dir="rtl" defaultValue="capital" className="w-full" onValueChange={(v) => v === 'trash' && loadTrash()}>
        <TabsList className="flex items-center justify-start gap-2 sm:gap-6 bg-transparent p-0 rounded-none border-b border-border w-full h-auto mb-8 shadow-none overflow-x-auto no-scrollbar">
          <TabsTrigger
            value="capital"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-1 sm:px-4 pb-4 pt-2 font-bold font-heading text-muted-foreground transition-all shadow-none h-auto bg-transparent hover:text-primary/70 whitespace-nowrap"
          >
            صندوق رأس المال
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-1 sm:px-4 pb-4 pt-2 font-bold font-heading text-muted-foreground transition-all shadow-none h-auto bg-transparent hover:text-primary/70 whitespace-nowrap"
          >
            إعدادات الحساب
          </TabsTrigger>
          <TabsTrigger
            value="data"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-1 sm:px-4 pb-4 pt-2 font-bold font-heading text-muted-foreground transition-all shadow-none h-auto bg-transparent hover:text-primary/70 whitespace-nowrap"
          >
            إدارة البيانات
          </TabsTrigger>
          <TabsTrigger
            value="trash"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-1 sm:px-4 pb-4 pt-2 font-bold font-heading text-muted-foreground transition-all shadow-none h-auto bg-transparent hover:text-primary/70 whitespace-nowrap"
          >
            سلة المهملات
          </TabsTrigger>
          <TabsTrigger
            value="reset"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:bg-transparent data-[state=active]:text-red-600 px-1 sm:px-4 pb-4 pt-2 font-bold font-heading text-muted-foreground transition-all shadow-none h-auto bg-transparent hover:text-red-600/70 whitespace-nowrap"
          >
            إعادة تعيين التطبيق
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Google Drive Backup Section */}
              <Card className="border-0 card-premium overflow-hidden flex flex-col">
                <div className="bg-orange-600/10 p-6 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                      <Cloud className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-heading">النسخ الاحتياطي السحابي (Google Drive)</h3>
                      <p className="text-muted-foreground text-[10px]">حفظ نسخة احتياطية في حسابك على Google Drive</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6 flex-1">
                  <div className="bg-muted/30 border border-border/50 rounded-2xl p-5">
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      اربط حسابك لتفعيل النسخ الاحتياطي التلقائي اليومي على السحابة. يتم تشفير البيانات قبل الرفع.
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white border border-border/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="h-6 w-6" alt="GDrive" />
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">Google Drive</span>
                            {user?.googleEmail && (
                              <span className="text-[10px] text-muted-foreground">{user.googleEmail}</span>
                            )}
                          </div>
                        </div>
                        {user?.googleRefreshToken ? (
                          <Badge variant="outline" className="text-[10px] bg-green-50 text-green-600 border-green-100 italic">متصل</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-100">غير متصل</Badge>
                        )}
                      </div>

                      {user?.googleRefreshToken ? (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 h-11 gap-2 font-bold hover:bg-red-50 border-red-200 text-red-700"
                            onClick={handleDisconnectGoogle}
                          >
                            <Trash2 className="h-4 w-4" />
                            فصل الحساب
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 h-11 gap-2 font-bold hover:bg-orange-50 border-orange-200 text-orange-700"
                            onClick={handleConnectGoogle}
                            disabled={isConnectingGoogle}
                          >
                            {isConnectingGoogle ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                            تبديل
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full h-11 gap-2 font-bold hover:bg-orange-50 border-orange-200 text-orange-700"
                          onClick={handleConnectGoogle}
                          disabled={isConnectingGoogle}
                        >
                          {isConnectingGoogle ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <KeyRound className="h-4 w-4" />
                          )}
                          ربط الحساب
                        </Button>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <div className="space-y-0.5">
                          <Label htmlFor="auto-cloud" className="text-xs font-bold">نسخ احتياطي يومي تلقائي</Label>
                          {lastAutoBackup && (
                            <p className="text-[10px] text-muted-foreground italic">
                              آخر نسخة: {new Date(lastAutoBackup).toLocaleString('ar-DZ')}
                            </p>
                          )}
                        </div>
                        <Switch
                          id="auto-cloud"
                          checked={autoCloudBackup}
                          onCheckedChange={handleToggleAutoCloud}
                          disabled={!user?.googleRefreshToken}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Export & Import Section */}
              <div className="space-y-6">
                <Card className="border-0 card-premium overflow-hidden">
                  <div className="bg-green-600/10 p-6 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg text-green-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold font-heading">تصدير يدوي</h3>
                        <p className="text-muted-foreground text-[10px]">تحميل قاعدة البيانات (Supabase) بصيغة ملف مضغوط</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <Button
                      onClick={handleManualExport}
                      className="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-lg shadow-lg shadow-green-500/10"
                    >
                      تحميل نسخة شاملة (ZIP)
                    </Button>
                  </div>
                </Card>

                <Card className="border-0 card-premium overflow-hidden">
                  <div className="bg-red-600/10 p-6 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg text-red-600">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold font-heading">استيراد بيانات</h3>
                        <p className="text-muted-foreground text-[10px]">استرجاع قاعدة بيانات من ملف ZIP</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-[10px] text-red-700 font-bold leading-relaxed">
                        تنبيه: استيراد ملف سيؤدي لحذف البيانات الحالية تماماً واستبدالها بالنسخة الاحتياطية.
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept=".zip"
                      className="h-11 cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!confirm('هل أنت متأكد؟ سيتم استبدال كافة البيانات الحالية!')) { e.target.value = ''; return; }
                        await handleManualImport(file);
                        e.target.value = ''; // Reset input
                      }}
                    />
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Capital Fund Tab */}
        <TabsContent value="capital" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {!isFundInitialized ? (
            <Card className="max-w-xl mx-auto border-0 card-premium overflow-hidden">
              <div className="bg-gradient-to-l from-orange-500/20 to-primary/10 p-12 text-center relative">
                <div className="absolute top-0 start-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent opacity-50" />
                <div className="relative">
                  <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-primary mx-auto mb-6 rotate-3 border border-orange-100">
                    <ShieldCheck className="h-12 w-12" />
                  </div>
                  <h2 className="text-3xl font-bold font-heading text-foreground mb-3">إعداد الصندوق السيادي</h2>
                  <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    مرحباً بك! يرجى تحديد رأس المال الأولي الذي ستبدأ به إدارة عملياتك المالية، وتعيين كلمة سر للحماية.
                  </p>
                </div>
              </div>
              <div className="p-10 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 ps-1">STARTING CAPITAL (DZD)</Label>
                    <div className="relative">
                      <CurrencyInput
                        placeholder="0.00"
                        value={opAmount}
                        onValueChange={setOpAmount}
                        className="h-16 text-2xl font-bold text-primary rounded-2xl border-muted bg-muted/30 focus:bg-white pr-16"
                      />
                      <Wallet className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground/30" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 ps-1">SECURITY PASSWORD</Label>
                    <div className="relative">
                      <Input
                        type="password"
                        placeholder="أدخل كلمة سر للإدارة"
                        value={opPassword}
                        onChange={(e) => setOpPassword(e.target.value)}
                        className="h-16 text-lg font-bold rounded-2xl border-muted bg-muted/30 focus:bg-white pr-16"
                      />
                      <Lock className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground/30" />
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    handleFundOperation('set');
                  }}
                  disabled={isSubmittingFund || !opAmount || !opPassword}
                  className="w-full h-16 rounded-2xl bg-primary hover:bg-orange-600 text-white text-lg font-bold shadow-xl shadow-orange-500/20 gap-3"
                >
                  {isSubmittingFund ? <Loader2 className="h-5 w-5 animate-spin" /> : <ChevronLeft className="h-6 w-6" />}
                  بدء العمل بالصندوق
                </Button>
                <p className="text-center text-[10px] text-muted-foreground/60 font-medium">سيتم استخدام هذه البيانات كأساس لكافة تقاريرك المالية القادمة.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-6">
                {/* Main Dashboard Card */}
                <Card className="border-0 card-premium overflow-hidden">
                  <div className="bg-gradient-to-l from-orange-500/10 to-amber-500/5 p-8 border-b border-orange-500/10 shadow-sm relative overflow-hidden group/card">
                    <div className="absolute top-0 start-0 w-32 h-32 bg-primary/10 rounded-be-full -ms-16 -mt-16 blur-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
                    <div className="flex items-center justify-between relative">
                      <div className="text-start">
                        <h3 className="text-3xl font-black font-heading text-foreground">الرصيد المالي المركزي</h3>
                        <p className="text-muted-foreground mt-1 font-medium">إدارة الصندوق السيادي للمنصة</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="w-12 h-12 rounded-xl border-dashed border-primary/30 text-primary hover:bg-primary/5 shadow-sm"
                          onClick={() => {
                            setFundOpType('set');
                            setShowFundDialog(true);
                          }}
                        >
                          <RotateCcw className="h-5 w-5" />
                        </Button>
                        <div className="p-4 bg-card shadow-xl shadow-orange-500/10 rounded-[1.5rem] border border-orange-100 dark:border-orange-900/30 relative group-hover/card:scale-110 transition-transform duration-500">
                          <Wallet className="h-10 w-10 text-primary" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                      <div className="text-start">
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest bg-muted/50 px-3 py-1.5 rounded-lg mb-4 inline-block">BALANCE TOTAL</span>
                        <div className="flex items-baseline gap-3 mt-2">
                          <span className="text-4xl md:text-6xl font-black font-heading text-primary drop-shadow-sm" dir="ltr">
                            {formatCurrency(fundCapital.localCapital)}
                          </span>
                          <span className="text-2xl font-bold text-muted-foreground/60">د.ج</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <Button
                          onClick={() => {
                            setFundOpType('add');
                            setShowFundDialog(true);
                          }}
                          className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white font-bold px-10 h-14 rounded-2xl shadow-lg shadow-green-500/20 flex items-center gap-3 transition-all hover:-translate-y-1"
                        >
                          <PlusCircle className="h-6 w-6" />
                          إضافة
                        </Button>
                        <Button
                          onClick={() => {
                            setFundOpType('withdraw');
                            setShowFundDialog(true);
                          }}
                          className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white font-bold px-10 h-14 rounded-2xl shadow-lg shadow-red-500/20 flex items-center gap-3 transition-all hover:-translate-y-1"
                        >
                          <MinusCircle className="h-6 w-6" />
                          إخراج
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="p-8 bg-gradient-to-bl from-green-500/5 via-green-500/[0.02] to-transparent border border-green-500/10 rounded-[2.5rem] relative overflow-hidden group/mini">
                        <div className="absolute top-0 end-0 w-24 h-24 bg-green-500/5 rounded-bl-full -me-12 -mt-12 group-hover/mini:scale-110 transition-transform duration-700" />
                        <p className="text-[10px] text-green-700 font-bold uppercase mb-2 relative flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          CURRENT PROFIT
                        </p>
                        <p className="text-3xl font-bold font-heading text-green-600 relative" dir="ltr">
                          +{formatCurrency(currentProfits)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2 relative font-medium">الأرباح التراكمية من الشركات</p>
                      </div>
                      <div className="p-8 bg-gradient-to-bl from-orange-500/5 via-orange-500/[0.02] to-transparent border border-orange-500/10 rounded-[2.5rem] relative overflow-hidden group/mini">
                        <div className="absolute top-0 end-0 w-24 h-24 bg-orange-500/5 rounded-bl-full -me-12 -mt-12 group-hover/mini:scale-110 transition-transform duration-700" />
                        <p className="text-[10px] text-orange-700 font-bold uppercase mb-2 relative flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          ESTIMATED CAPITAL
                        </p>
                        <p className="text-3xl font-bold font-heading text-primary relative" dir="ltr">
                          {formatCurrency(newCapital)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2 relative font-medium">رأس المال النظري المستقبلي</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* History Table */}
                <Card className="border-0 card-premium overflow-hidden">
                  <div className="p-8 border-b border-border/50 flex items-center justify-between bg-muted/10">
                    <div className="text-start">
                      <h3 className="text-xl font-bold font-heading">سجل تحركات الصندوق</h3>
                      <p className="text-xs text-muted-foreground mt-1">تتبع كافة الإيداعات والسحوبات التاريخية</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-muted-foreground bg-white px-3 py-1.5 rounded-full border shadow-sm">
                      <Clock className="h-3 w-3" />
                      تحديث تلقائي
                    </div>
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-start">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="py-5 px-8 text-start text-[10px] font-black text-muted-foreground uppercase tracking-wider">العملية</th>
                          <th className="py-5 px-8 text-start text-[10px] font-black text-muted-foreground uppercase tracking-wider">المبلغ</th>
                          <th className="py-5 px-8 text-start text-[10px] font-black text-muted-foreground uppercase tracking-wider">التاريخ</th>
                          <th className="py-5 px-8 text-start text-[10px] font-black text-muted-foreground uppercase tracking-wider">الوصف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {fundTransactions.filter(tx => !tx.description.startsWith('__CURRENCY_SILENT_PAYMENT__')).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-20 text-center opacity-20">
                              <HistoryIcon className="h-12 w-12 mx-auto mb-2" />
                              <p className="font-bold">لا يوجد سجل عمليات بعد</p>
                            </td>
                          </tr>
                        ) : (
                          fundTransactions
                            .filter(tx => !tx.description.startsWith('__CURRENCY_SILENT_PAYMENT__'))
                            .map((tx) => (
                              <tr key={tx.id} className="hover:bg-muted/10 transition-colors group/row">
                                <td className="py-5 px-8">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm group-hover/row:scale-110 transition-transform">
                                      {getTransactionIcon(tx.type)}
                                    </div>
                                    <span className="font-bold text-sm text-foreground">{getTransactionLabel(tx.type)}</span>
                                  </div>
                                </td>
                                <td className="py-5 px-8 font-black font-heading text-sm" dir="ltr">
                                  <span className={tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                  </span>
                                </td>
                                <td className="py-5 px-8">
                                  <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-foreground">{new Date(tx.createdAt).toLocaleDateString('ar-DZ')}</p>
                                    <p className="text-[8px] text-muted-foreground">{new Date(tx.createdAt).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                </td>
                                <td className="py-5 px-8">
                                  <p className="text-xs text-muted-foreground font-medium max-w-xs truncate">{tx.description}</p>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden p-4 space-y-4">
                    {fundTransactions.filter(tx => !tx.description.startsWith('__CURRENCY_SILENT_PAYMENT__')).length === 0 ? (
                      <div className="py-12 text-center opacity-50">
                        <HistoryIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-bold">لا يوجد سجل عمليات بعد</p>
                      </div>
                    ) : (
                      fundTransactions
                        .filter(tx => !tx.description.startsWith('__CURRENCY_SILENT_PAYMENT__'))
                        .map((tx) => (
                          <div key={`${tx.id}-mobile`} className="bg-card/50 border border-border/50 rounded-xl p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-white to-muted rounded-lg shadow-sm border border-border/50">
                                  {getTransactionIcon(tx.type)}
                                </div>
                                <div>
                                  <p className="font-bold text-foreground text-sm">{getTransactionLabel(tx.type)}</p>
                                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(tx.createdAt).toLocaleDateString('ar-DZ')}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/20 p-2 rounded-lg italic">
                                {tx.description}
                              </p>

                              <div className="flex justify-between items-end border-t border-border/30 pt-2">
                                <p className="text-[10px] font-bold text-muted-foreground">المبلغ الصافي</p>
                                <p className={`text-lg font-black font-heading ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                                  {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)} <span className="text-[10px] text-muted-foreground">د.ج</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="p-8 border-0 card-premium">
                  <h4 className="font-bold font-heading mb-6 text-primary flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    تحليل الصندوق
                  </h4>
                  <div className="space-y-6">
                    <div className="p-5 rounded-2xl border border-primary/5 shadow-sm bg-card">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">HEALTH STATUS</p>
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-bold">رصيد آمن</span>
                      </div>
                    </div>
                    <div className="pt-6 border-t border-border/50">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase mb-4">COMPANIES DISTRIBUTION</p>
                      <div className="space-y-4">
                        {companyStats.slice(0, 5).map(c => (
                          <div key={c.id} className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span>{c.name}</span>
                              <span className="text-primary">{formatCurrency(c.workingCapital)}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${Math.min(100, (c.workingCapital / (fundCapital.localCapital || 1)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>


              </div>
            </div>
          )}
        </TabsContent>
        {/* Fund Operation Dialog */}
        <Dialog open={showFundDialog} onOpenChange={setShowFundDialog}>
          <DialogContent className="max-w-md p-0 overflow-hidden border-0 rounded-[2rem] shadow-2xl">
            <div className="bg-gradient-to-br from-orange-500 to-primary p-8 text-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-16 -mt-16 blur-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                  {fundOpType === 'add' ? <PlusCircle className="h-6 w-6" /> :
                    fundOpType === 'withdraw' ? <MinusCircle className="h-6 w-6" /> :
                      <ShieldAlert className="h-6 w-6" />}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold font-heading">
                    {fundOpType === 'add' ? 'إيداع رصيد جديد' :
                      fundOpType === 'withdraw' ? 'سحب رصيد' :
                        'إعادة تعيين رأس المال'}
                  </DialogTitle>
                  <p className="text-white/70 text-xs mt-1 font-medium">
                    {fundOpType === 'set' ? 'تغيير القيمة الأساسية للصندوق السيادي' : 'تعديل سيولة الصندوق المركزي'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6 bg-card">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground/70 ps-1">AMOUNT (DZD)</Label>
                  <div className="relative">
                    <CurrencyInput
                      placeholder="0.00"
                      value={opAmount}
                      onValueChange={setOpAmount}
                      className="h-14 text-xl font-bold rounded-xl border-muted bg-muted/30 focus:bg-white pr-12"
                    />
                    <Wallet className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                  </div>
                </div>

                {fundOpType !== 'set' ? (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground/70 ps-1">DESCRIPTION</Label>
                    <div className="relative">
                      <Textarea
                        placeholder="أدخل وصفاً للعملية..."
                        value={opDescription}
                        onChange={(e) => setOpDescription(e.target.value)}
                        className="min-h-[100px] rounded-xl border-muted bg-muted/30 focus:bg-white resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground/70 ps-1">SECURITY PASSWORD</Label>
                    <div className="relative">
                      <Input
                        type="password"
                        placeholder="أدخل كلمة السر للتأكيد"
                        value={opPassword}
                        onChange={(e) => setOpPassword(e.target.value)}
                        className="h-14 font-bold rounded-xl border-muted bg-muted/30 focus:bg-card pr-12"
                      />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFundDialog(false)}
                  className="flex-1 h-14 rounded-xl font-bold border-muted hover:bg-muted/50"
                  disabled={isSubmittingFund}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={() => handleFundOperation()}
                  className={`flex-[2] h-14 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex gap-2 ${fundOpType === 'add' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' :
                    fundOpType === 'withdraw' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' :
                      'bg-primary hover:bg-orange-600 shadow-orange-500/20'
                    }`}
                  disabled={isSubmittingFund || !opAmount || (fundOpType === 'set' && !opPassword)}
                >
                  {isSubmittingFund ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                  تأكيد العملية
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Personal info & Profile */}
              <div className="md:col-span-2 space-y-6">
                <Card className="border-0 card-premium overflow-hidden flex flex-col h-full">
                  <div className="bg-gradient-to-l from-primary/10 to-transparent p-6 border-b border-border/50 flex items-center justify-between">
                    <div className="text-start">
                      <h3 className="text-xl font-bold font-heading text-foreground">بيانات الحساب الشخصي</h3>
                      <p className="text-muted-foreground text-[10px] mt-0.5">إدارة معلومات الدخول والأمان الأساسية</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary border border-primary/10">
                      <Lock className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="p-6 space-y-6 flex-1">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ps-1">EMAIL ADDRESS</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="h-11 rounded-xl font-bold border-muted bg-muted/20 focus:bg-white transition-all shadow-inner"
                          />
                          <Button onClick={handleChangeEmail} className="h-11 rounded-xl px-6 font-bold bg-primary hover:bg-orange-600">تحديث</Button>
                        </div>
                      </div>

                      <div className="pt-4 space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ps-1 mb-2 block text-start">SECURITY & AUTHENTICATION</Label>
                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-muted transition-all hover:bg-muted/40 group">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white rounded-xl shadow-sm text-primary">
                              <KeyRound className="h-5 w-5" />
                            </div>
                            <div className="text-start">
                              <p className="font-bold text-sm">كلمة المرور</p>
                              <p className="text-[10px] text-muted-foreground">تغيير رمز الدخول الخاص بلوحة التحكم</p>
                            </div>
                          </div>
                          <Button onClick={() => setIsPasswordDialogOpen(true)} variant="ghost" className="text-primary font-bold text-xs hover:bg-primary/10 rounded-lg">تعديل الرمز</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: UI Prefs & Actions */}
              <div className="space-y-6">
                <Card className="border-0 card-premium p-6">
                  <Button
                    onClick={logout}
                    variant="ghost"
                    className="w-full h-14 rounded-2xl text-red-600 hover:bg-red-50 hover:text-red-700 font-black text-lg flex items-center justify-center gap-3 group transition-all border border-red-100/50 shadow-sm"
                  >
                    <RotateCcw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                    تسجيل الخروج من المنصة
                  </Button>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* سلة المهملات Tab */}
        <TabsContent value="trash" className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="border-0 card-premium">
            <div className="p-8 border-b border-border/50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold font-heading text-foreground">المحذوفات المؤقتة</h3>
                <p className="text-muted-foreground text-sm mt-1">استرجع البيانات التي قمت بحذفها بالخطأ</p>
              </div>
              {trash.length > 0 && (
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => setEmptyTrashDialogOpen(true)}
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 font-bold gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف الكل
                  </Button>
                  <div className="bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-bold text-primary">{getTrashCountLabel(trash.length)}</span>
                  </div>
                </div>
              )}
            </div>

            {trash.length === 0 ? (
              <div className="p-20 text-center">
                <div className="bg-muted/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="h-12 w-12 text-muted-foreground opacity-10" />
                </div>
                <h4 className="text-xl font-bold text-foreground font-heading">لا توجد محذوفات</h4>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">سيتم عرض البيانات المحذوفة مؤقتاً هنا لمدة 30 يوم قبل حذفها نهائياً.</p>
              </div>
            ) : (
              <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                <Table dir="rtl">
                  <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent border-border/50">
                      <TableHead className="text-start font-black text-muted-foreground w-[50px]"></TableHead>
                      <TableHead className="text-start font-black text-muted-foreground">النوع</TableHead>
                      <TableHead className="text-start font-black text-muted-foreground">التفاصيل</TableHead>
                      <TableHead className="text-start font-black text-muted-foreground">تاريخ الحذف</TableHead>
                      <TableHead className="text-start font-black text-muted-foreground w-[150px]">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trash.map((item) => {
                      const typeConfig = [
                        { type: 'company', label: 'شركة', Icon: Building2, color: 'text-orange-600', bg: 'bg-orange-500/10' },
                        { type: 'fournisseur', label: 'مزود', Icon: Truck, color: 'text-blue-600', bg: 'bg-blue-500/10' },
                        { type: 'currency_company', label: 'مكتب صرف', Icon: Banknote, color: 'text-green-600', bg: 'bg-green-500/10' },
                        { type: 'transaction', label: 'معاملة', Icon: FileText, color: 'text-purple-600', bg: 'bg-purple-500/10' },
                        { type: 'currency_transaction', label: 'تحويل عملة', Icon: ArrowLeftRight, color: 'text-amber-600', bg: 'bg-amber-500/10' },
                      ].find(t => t.type === item.itemType) || { type: 'unknown', label: 'غير معروف', Icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-500/10' };

                      const displayName =
                        item.itemType === 'company' || item.itemType === 'fournisseur' || item.itemType === 'currency_company'
                          ? (item.itemData as { name?: string }).name || '—'
                          : item.itemType === 'transaction' || item.itemType === 'currency_transaction'
                            ? (item.itemData as { description?: string }).description || '—'
                            : '—';

                      return (
                        <TableRow key={item.id} className="group hover:bg-muted/20 border-border/50 transition-colors">
                          <TableCell className="py-4">
                            <div className={`p-2 rounded-lg w-fit ${typeConfig.bg} ${typeConfig.color}`}>
                              <typeConfig.Icon className="h-4 w-4" />
                            </div>
                          </TableCell>
                          <TableCell className="py-4 font-bold text-foreground">
                            {typeConfig.label}
                          </TableCell>
                          <TableCell className="py-4 font-medium text-muted-foreground max-w-[300px] truncate" title={displayName}>
                            {displayName}
                          </TableCell>
                          <TableCell className="py-4 font-medium text-muted-foreground" dir="ltr">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-muted-foreground/50" />
                              {new Date(item.deletedAt).toLocaleDateString('fr-FR')}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  setRestoringId(item.id);
                                  try {
                                    await restoreFromTrash(item.id);
                                    toast.success('تم استرجاع العنصر');
                                  } catch {
                                    toast.error('فشل الاسترجاع');
                                  } finally {
                                    setRestoringId(null);
                                  }
                                }}
                                disabled={restoringId !== null}
                                className="h-8 px-3 rounded-lg font-bold text-[10px] border-muted hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/20"
                              >
                                <RotateCcw className="h-3 w-3 ms-1.5" />
                                استرجاع
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPermanentDeleteId(item.id)}
                                className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                                title="حذف نهائي"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="reset" className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="max-w-3xl mx-auto border-0 card-premium overflow-hidden">
            <div className="bg-red-600/10 p-10 text-center border-b border-red-100">
              <div className="w-20 h-20 bg-red-600 rounded-[1.5rem] shadow-xl flex items-center justify-center text-white mx-auto mb-6 rotate-2 shadow-red-500/10">
                <ShieldAlert className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-black font-heading text-red-700 mb-3">منطقة شديدة الخطورة</h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto font-medium">
                هل أنت متأكد من رغبتك في تصفير التطبيق؟ سيؤدي هذا الإجراء إلى حذف كافة الشركات، المزودين، والمعاملات بشكل نهائي.
              </p>
            </div>

            <div className="p-10 space-y-8">
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
                  <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-900">تنبيه هام</p>
                    <p className="text-xs text-amber-800/80 leading-relaxed">
                      هذه العملية غير قابلة للتراجع تماماً. ننصحك بتحميل نسخة احتياطية من البيانات قبل الاستمرار.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50 text-center">
                <p className="text-sm font-bold text-foreground">للتأكيد، يرجى كتابة كلمة المرور الخاصة بحسابك</p>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="كلمة المرور"
                    className="h-14 rounded-xl text-center font-bold pr-12 focus:border-red-500 focus:ring-red-500/10"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                </div>

                <Button
                  onClick={() => setResetDialogOpen(true)}
                  disabled={!resetConfirmPassword}
                  variant="destructive"
                  className="w-full h-14 rounded-xl font-black text-lg shadow-xl shadow-red-500/20 hover:scale-[1.01] transition-transform"
                >
                  <Trash2 className="ms-2 h-5 w-5" />
                  تصفير كافة البيانات الآن
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* تأكيد الحذف النهائي من سلة المهملات */}
      <AlertDialog open={!!permanentDeleteId} onOpenChange={(open) => !open && setPermanentDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف نهائي</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا العنصر نهائياً ولن يمكن استرجاعه. هل أنت متأكد؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!permanentDeleteId) return;
                try {
                  await permanentlyDeleteFromTrash(permanentDeleteId);
                  toast.success('تم الحذف النهائي');
                  setPermanentDeleteId(null);
                } catch {
                  toast.error('فشل الحذف');
                }
              }}
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteConfirmationDialog
        open={deleteAllDialogOpen}
        onOpenChange={setDeleteAllDialogOpen}
        onConfirm={confirmDeleteAllTransactions}
        title="حذف جميع المعاملات"
        description="هل أنت متأكد من حذف جميع المعاملات؟ هذه العملية غير قابلة للعكس!"
        isDeleting={isDeletingTransactions}
      />

      <DeleteConfirmationDialog
        open={emptyTrashDialogOpen}
        onOpenChange={setEmptyTrashDialogOpen}
        onConfirm={async () => {
          setIsEmptyingTrash(true);
          try {
            await emptyTrash();
          } finally {
            setIsEmptyingTrash(false);
            setEmptyTrashDialogOpen(false);
          }
        }}
        title="إفراغ سلة المهملات"
        description="هل أنت متأكد من حذف جميع العناصر في سلة المهملات نهائياً؟ لا يمكن التراجع عن هذه العملية!"
        isDeleting={isEmptyingTrash}
      />

      {/* Password Prompt Dialog */}
      <Dialog open={showPasswordPrompt} onOpenChange={setShowPasswordPrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تحقق من الهوية</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              للوصول إلى المعاملات القديمة، يرجى إدخال كلمة المرور الخاصة بك للتحقق.
            </p>
            <div className="space-y-2">
              <Label htmlFor="verify-password">كلمة المرور</Label>
              <Input
                id="verify-password"
                type="password"
                placeholder="أدخل كلمة المرور"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
              />
            </div>
            <Button onClick={handlePasswordSubmit} className="w-full bg-primary text-primary-foreground hover:bg-orange-600 font-bold">
              تحقق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تغيير كلمة المرور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>كلمة المرور الحالية</Label>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="********"
              />
            </div>
            <div className="space-y-2">
              <Label>كلمة المرور الجديدة</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="********"
              />
            </div>
            <div className="space-y-2">
              <Label>تأكيد كلمة المرور الجديدة</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
              />
            </div>
            <Button onClick={handleChangePassword} className="w-full bg-primary hover:bg-orange-600 font-bold">
              حفظ التغييرات
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent className="max-w-md border-red-100 rounded-[2rem]">
          <AlertDialogHeader>
            <div className="p-4 bg-red-100 rounded-full w-fit mx-auto mb-4 text-red-600">
              <ShieldAlert className="h-10 w-10" />
            </div>
            <AlertDialogTitle className="text-2xl font-black font-heading text-red-700 text-center">القرار النهائي</AlertDialogTitle>
            <AlertDialogDescription className="text-center font-medium leading-relaxed mt-2">
              هل أنت متأكد تماماً؟ سيتم تصفير ميزانية الصندوق وحذف جميع بيانات الشركات والعمليات. <strong>سيصبح التطبيق كأنك قمت بتثبيته للتو.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-col gap-3 mt-6">
            <Button
              onClick={handleResetApp}
              disabled={isResettingApp}
              variant="destructive"
              className="w-full h-14 rounded-xl font-black text-lg shadow-lg shadow-red-500/10"
            >
              {isResettingApp ? <Loader2 className="h-6 w-6 animate-spin" /> : 'نعم، أنا متأكد - تصفير التطبيق'}
            </Button>
            <AlertDialogCancel className="w-full h-12 rounded-xl border-none bg-muted/50 hover:bg-muted font-bold">
              إلغاء العملية
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
