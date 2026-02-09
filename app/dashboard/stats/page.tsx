'use client';

import { useMemo } from 'react';
import { useAppData } from '@/app/context/app-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Building2, AlertCircle, Truck } from 'lucide-react';

export default function StatsPage() {
  const { companies, fournisseurs, transactions } = useAppData();

  const stats = useMemo(() => {
    const companyStats = companies.map((company) => {
      const companyTransactions = transactions.filter((t) => t.companyId === company.id);
      const income = companyTransactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = Math.abs(
        companyTransactions
          .filter((t) => t.amount < 0)
          .reduce((sum, t) => sum + t.amount, 0)
      );
      const profit = income - expenses;

      return {
        id: company.id,
        name: company.name,
        income,
        expenses,
        profit,
        profitPercentage: income > 0 ? (profit / income) * 100 : 0,
      };
    });

    const fournisseurStats = fournisseurs.map((fournisseur) => {
      const fournisseurTransactions = transactions.filter(
        (t) => t.fournisseurId === fournisseur.id
      );
      const income = fournisseurTransactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = Math.abs(
        fournisseurTransactions
          .filter((t) => t.amount < 0)
          .reduce((sum, t) => sum + t.amount, 0)
      );

      return {
        id: fournisseur.id,
        name: fournisseur.name,
        currency: fournisseur.currency,
        income,
        expenses,
      };
    });

    const sortedCompanies = [...companyStats].sort((a, b) => b.profit - a.profit);
    const topIncome = [...companyStats].sort((a, b) => b.income - a.income)[0];
    const topExpenses = [...companyStats].sort((a, b) => b.expenses - a.expenses)[0];

    return {
      companyStats,
      fournisseurStats,
      topProfitable: sortedCompanies[0],
      topIncome,
      topExpenses,
    };
  }, [companies, fournisseurs, transactions]);

  const formatCurrency = (amount: number) => {
    const str = Math.round(amount).toString();
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const chartColors = ['#ea580c', '#1e293b', '#f59e0b', '#0ea5e9', '#64748b'];

  const incomeExpenseData = stats.companyStats.map((stat) => ({
    name: stat.name,
    دخل: stat.income,
    مصروف: stat.expenses,
  }));

  const profitData = stats.companyStats.map((stat) => ({
    name: stat.name,
    الربح: stat.profit,
  }));

  const fournisseurData = stats.fournisseurStats.map((stat) => ({
    name: stat.name,
    دخل: stat.income,
    مصروف: stat.expenses,
  }));

  const totalInitialCapital = useMemo(() => {
    return companies.reduce((sum, company) => sum + company.initialCapital, 0);
  }, [companies]);

  const totalWorkingCapital = useMemo(() => {
    return companies.reduce((sum, company) => sum + company.workingCapital, 0);
  }, [companies]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">الإحصائيات والتقارير</h1>
        <p className="text-muted-foreground mt-1">عرض تحليلي شامل لأداء الشركات والمزودين</p>
      </div>

      {/* Capital Overview - Current Capital Only */}
      <Card className="p-6 md:p-8 border-0 card-premium relative overflow-hidden group">
        <div className="absolute top-0 start-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -ms-20 -mt-20 pointer-events-none transition-transform group-hover:scale-110" />
        <div className="absolute bottom-0 end-0 w-48 h-48 bg-navy-500/5 rounded-full blur-2xl -me-20 -mb-20 pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-end justify-between relative z-10 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1.5 bg-primary rounded-full" />
              <p className="text-sm text-muted-foreground font-bold font-heading uppercase">رأس المال الحالي</p>
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-4xl md:text-6xl font-black font-heading text-primary tracking-tighter" dir="ltr">
                {formatCurrency(totalWorkingCapital)}
              </p>
              <span className="text-lg md:text-xl font-bold text-primary/60 font-heading">د.ج</span>
            </div>
          </div>
          <div className="text-end space-y-1 self-end sm:self-auto">
            <p className="text-xs text-muted-foreground font-bold uppercase">إجمالي الشركات</p>
            <div className="flex items-center justify-end gap-2">
              <p className="text-3xl md:text-4xl font-black font-heading text-foreground" dir="ltr">{companies.length}</p>
              <div className="p-2 bg-foreground/5 rounded-lg">
                <Building2 className="h-5 w-5 text-foreground/50" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Income Company */}
        {stats.topIncome && (
          <Card className="p-6 border-0 card-premium group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium">أكثر شركة دخلاً</p>
                <h3 className="text-xl font-bold font-heading text-foreground mt-1 group-hover:text-primary transition-colors">{stats.topIncome.name}</h3>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">إجمالي الدخل:</span>
                <span className="font-bold text-foreground" dir="ltr">{formatCurrency(stats.topIncome.income)} د.ج</span>
              </div>
            </div>
          </Card>
        )}

        {/* Top Expenses Company */}
        {stats.topExpenses && (
          <Card className="p-6 border-0 card-premium group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium">أكثر شركة مصروفاً</p>
                <h3 className="text-xl font-bold font-heading text-foreground mt-1 group-hover:text-destructive transition-colors">{stats.topExpenses.name}</h3>
              </div>
              <div className="p-3 bg-destructive/10 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">إجمالي المصروفات:</span>
                <span className="font-bold text-foreground" dir="ltr">{formatCurrency(stats.topExpenses.expenses)} د.ج</span>
              </div>
            </div>
          </Card>
        )}

        {/* Most Profitable Company */}
        {stats.topProfitable && (
          <Card className="p-6 border-0 card-premium group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium">الشركة الأكثر ربحاً</p>
                <h3 className="text-xl font-bold font-heading text-foreground mt-1 group-hover:text-emerald-600 transition-colors">{stats.topProfitable.name}</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform">
                <Target className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">إجمالي الربح:</span>
                <span className="font-bold text-emerald-600" dir="ltr">{formatCurrency(stats.topProfitable.profit)} د.ج</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">نسبة الربح:</span>
                <span className="font-bold text-foreground" dir="ltr">{stats.topProfitable.profitPercentage.toFixed(2)}%</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses - Bar Chart */}
        <Card className="p-8 border-0 card-premium overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-black font-heading text-foreground">الدخل والمصروفات</h3>
              <p className="text-xs text-muted-foreground font-medium">مقارنة الأداء المالي لكل شركة</p>
            </div>
            <div className="p-3 bg-primary/5 rounded-2xl text-primary">
              <BarChart className="h-6 w-6" />
            </div>
          </div>
          {incomeExpenseData.length > 0 ? (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={incomeExpenseData}
                  margin={{ top: 20, right: 10, left: 10, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/30" vertical={false} />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    dy={10}
                    tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 600 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 600 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    cursor={{ fill: 'currentColor', opacity: 0.05 }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                      padding: '12px',
                      textAlign: 'right'
                    }}
                    itemStyle={{ fontFamily: 'var(--font-ibm-plex)', fontWeight: 700, padding: '2px 0' }}
                    labelStyle={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--foreground)', marginBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '4px' }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="دخل" fill="#F97316" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="مصروف" fill="#1e293b" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground space-y-4">
              <div className="p-4 bg-muted/50 rounded-full">
                <AlertCircle className="h-8 w-8 opacity-20" />
              </div>
              <p className="font-medium italic">لا توجد بيانات متاحة للعرض</p>
            </div>
          )}
        </Card>

        {/* Profit Line Chart */}
        <Card className="p-8 border-0 card-premium overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-black font-heading text-foreground">تحليل الأرباح</h3>
              <p className="text-xs text-muted-foreground font-medium">تتبع صافي الربح عبر جميع الشركات</p>
            </div>
            <div className="p-3 bg-emerald-500/5 rounded-2xl text-emerald-600">
              <LineChart className="h-6 w-6" />
            </div>
          </div>
          {profitData.length > 0 ? (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitData} margin={{ top: 20, right: 10, left: 10, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/30" vertical={false} />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    dy={10}
                    tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 600 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 600 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                      padding: '12px',
                      textAlign: 'right'
                    }}
                    itemStyle={{ fontFamily: 'var(--font-ibm-plex)', fontWeight: 700, padding: '2px 0', color: '#10b981' }}
                    labelStyle={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--foreground)', marginBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '4px' }}
                  />
                  <Legend iconType="circle" />
                  <Line
                    type="monotone"
                    dataKey="الربح"
                    stroke="#10b981"
                    strokeWidth={4}
                    dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground space-y-4">
              <div className="p-4 bg-muted/50 rounded-full">
                <AlertCircle className="h-8 w-8 opacity-20" />
              </div>
              <p className="font-medium italic">لا توجد بيانات ربح متاحة</p>
            </div>
          )}
        </Card>

        {/* Fournisseurs Stats */}
        <Card className="p-8 border-0 card-premium overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-black font-heading text-foreground">معاملات المزودين</h3>
              <p className="text-xs text-muted-foreground font-medium">نظرة على تدفق العملات للمزودين</p>
            </div>
            <div className="p-3 bg-amber-500/5 rounded-2xl text-amber-600">
              <Truck className="h-6 w-6" />
            </div>
          </div>
          {fournisseurData.length > 0 ? (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fournisseurData} margin={{ top: 20, right: 10, left: 10, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/30" vertical={false} />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    dy={10}
                    tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 600 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 600 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'currentColor', opacity: 0.05 }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                      padding: '12px',
                      textAlign: 'right'
                    }}
                    itemStyle={{ fontFamily: 'var(--font-ibm-plex)', fontWeight: 700, padding: '2px 0' }}
                    labelStyle={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--foreground)', marginBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '4px' }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="دخل" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="مصروف" fill="#64748b" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground space-y-4">
              <div className="p-4 bg-muted/50 rounded-full">
                <Truck className="h-8 w-8 opacity-20" />
              </div>
              <p className="font-medium italic">لا توجد معاملات مزودين مسجلة</p>
            </div>
          )}
        </Card>

        {/* Summary Table */}
        <Card className="lg:col-span-2 border-0 card-premium overflow-hidden">
          <div className="p-8 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-muted/20 to-transparent">
            <div className="space-y-1">
              <h3 className="text-xl font-black font-heading text-foreground">ملخص تحليل الشركات</h3>
              <p className="text-xs text-muted-foreground font-medium">نظرة سريعة على هوامش الربح والأداء</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ربح إيجابي</span>
              </div>
            </div>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-end py-5 px-8 font-black font-heading text-muted-foreground uppercase text-[11px]">الشركة</th>
                  <th className="text-end py-5 px-8 font-black font-heading text-muted-foreground uppercase text-[11px]">إجمالي الربح</th>
                  <th className="text-end py-5 px-8 font-black font-heading text-muted-foreground uppercase text-[11px] text-center">الهامش</th>
                </tr>
              </thead>
              <tbody>
                {stats.companyStats.map((stat) => (
                  <tr key={stat.id} className="border-b border-border/50 hover:bg-muted/50 transition-all group">
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <p className="font-black text-base text-foreground group-hover:text-primary transition-colors">{stat.name}</p>
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <p className="font-black text-lg text-primary" dir="ltr">{formatCurrency(stat.profit)} د.ج</p>
                    </td>
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-3 justify-center">
                        <div className={`px-4 py-1.5 rounded-full text-xs font-black border ${stat.profit > 0
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                          }`}>
                          {stat.profit > 0 ? '↑' : '↓'} {Math.abs(stat.profitPercentage).toFixed(1)}%
                        </div>
                        <div className="flex-1 max-w-[100px] h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-1000 ${stat.profit > 0 ? 'bg-emerald-500' : 'bg-destructive'}`}
                            style={{ width: `${Math.min(Math.abs(stat.profitPercentage), 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-4 space-y-4">
            {stats.companyStats.map((stat) => (
              <div key={stat.id} className="bg-card/50 border border-border/50 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{stat.name}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">تحليل الأداء</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${stat.profit > 0
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'bg-destructive/10 text-destructive border-destructive/20'
                    }`}>
                    {stat.profit > 0 ? '↑' : '↓'} {Math.abs(stat.profitPercentage).toFixed(1)}%
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end bg-muted/30 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground font-bold">إجمالي الربح</p>
                    <p className="font-black text-lg text-primary" dir="ltr">{formatCurrency(stat.profit)} د.ج</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                      <span>مؤشر الهامش</span>
                      <span>{Math.min(Math.abs(stat.profitPercentage), 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden w-full">
                      <div
                        className={`h-full transition-all duration-1000 ${stat.profit > 0 ? 'bg-emerald-500' : 'bg-destructive'}`}
                        style={{ width: `${Math.min(Math.abs(stat.profitPercentage), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
