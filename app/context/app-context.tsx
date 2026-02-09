'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './auth-context';
import { toast } from 'sonner';
import {
  getCompanies,
  addCompany as apiAddCompany,
  updateCompany as apiUpdateCompany,
  deleteCompany as apiDeleteCompany,
  getFournisseurs,
  addFournisseur as apiAddFournisseur,
  updateFournisseur as apiUpdateFournisseur,
  deleteFournisseur as apiDeleteFournisseur,
  getTransactions,
  addTransaction as apiAddTransaction,
  updateTransaction as apiUpdateTransaction,
  deleteTransaction as apiDeleteTransaction,
  getFundCapital,
  setFundCapital,
  getFundTransactions,
  addFundTransaction as apiAddFundTransaction,
  getCurrencyCompanies,
  addCurrencyCompany as apiAddCurrencyCompany,
  updateCurrencyCompany as apiUpdateCurrencyCompany,
  deleteCurrencyCompany as apiDeleteCurrencyCompany,
  getCurrencyTransactions,
  addCurrencyTransaction as apiAddCurrencyTransaction,
  updateCurrencyTransaction as apiUpdateCurrencyTransaction,
  deleteCurrencyTransaction as apiDeleteCurrencyTransaction,
  getTrashItems,
  addToTrash as apiAddToTrash,
  removeFromTrash as apiRemoveFromTrash,
  resetUserDatabase as apiResetUserDatabase,
} from '@/lib/api-client';
import type { TrashItem as ApiTrashItem, FundTransaction as ApiFundTransaction } from '@/lib/api-client';

export interface Company {
  id: string;
  name: string;
  owner: string;
  description: string;
  initialCapital: number;
  workingCapital: number;
  sharePercentage: number;
  isActive: boolean;
  image: string | null;
  createdAt: string;
}

export interface Fournisseur {
  id: string;
  name: string;
  currency: string;
  currencies?: string[];
  balance: number;
  image?: string | null;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: 'company' | 'fournisseur';
  amount: number;
  rate: number;
  description: string;
  companyId?: string | null;
  fournisseurId?: string | null;
  createdAt: string;
}

export interface CurrencyCompany {
  id: string;
  name: string;
  baseCurrency: string;
  baseCurrencies?: string[];
  targetCurrency: string;
  targetCurrencies?: string[];
  exchangeRate: number;
  commissionPercentage: number;
  description: string;
  image: string | null;
  isActive: boolean;
  createdAt: string;
  balance?: number;
}

export interface CurrencyTransaction {
  id: string;
  currencyCompanyId: string;
  fromAmount: number;
  toAmount: number;
  exchangeRateUsed: number;
  commissionAmount: number;
  description: string;
  usdFournisseurId?: string | null;
  dzdCompanyId?: string | null;
  usdDescription?: string | null;
  dzdDescription?: string | null;
  createdAt: string;
}

interface AppContextType {
  companies: Company[];
  fournisseurs: Fournisseur[];
  transactions: Transaction[];
  currencyCompanies: CurrencyCompany[];
  currencyTransactions: CurrencyTransaction[];
  loading: boolean;
  fundCapital: { localCapital: number; foreignCapital: number };
  fundTransactions: ApiFundTransaction[];
  addCompany: (company: Omit<Company, 'id' | 'createdAt'>) => Promise<void>;
  addFournisseur: (fournisseur: Omit<Fournisseur, 'id' | 'createdAt'>) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
  updateFournisseur: (id: string, updates: Partial<Fournisseur>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  deleteFournisseur: (id: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteAllOldTransactions: () => Promise<void>;
  addCurrencyCompany: (company: Omit<CurrencyCompany, 'id' | 'createdAt'>) => Promise<void>;
  updateCurrencyCompany: (id: string, updates: Partial<CurrencyCompany>) => Promise<void>;
  deleteCurrencyCompany: (id: string) => Promise<void>;
  addCurrencyTransaction: (transaction: Omit<CurrencyTransaction, 'id' | 'createdAt'>) => Promise<void>;
  updateCurrencyTransaction: (id: string, updates: Partial<CurrencyTransaction>) => Promise<void>;
  deleteCurrencyTransaction: (id: string) => Promise<void>;
  getCompanyById: (id: string) => Company | undefined;
  getFournisseurById: (id: string) => Fournisseur | undefined;
  saveFundCapital: (capital: number, password: string) => Promise<void>;
  addFundTransaction: (transaction: Omit<ApiFundTransaction, 'id' | 'createdAt'>) => Promise<void>;
  trash: ApiTrashItem[];
  loadTrash: () => Promise<void>;
  restoreFromTrash: (trashId: string) => Promise<void>;
  permanentlyDeleteFromTrash: (trashId: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  resetAppData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [rawCompanies, setRawCompanies] = useState<Company[]>([]);
  const [rawFournisseurs, setRawFournisseurs] = useState<Fournisseur[]>([]);
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [rawCurrencyCompanies, setRawCurrencyCompanies] = useState<CurrencyCompany[]>([]);
  const [rawCurrencyTransactions, setRawCurrencyTransactions] = useState<CurrencyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [fundCapital, setFundCapitalState] = useState<{ localCapital: number; foreignCapital: number }>({
    localCapital: 0,
    foreignCapital: 0
  });
  const [fundTransactions, setFundTransactions] = useState<ApiFundTransaction[]>([]);
  const [trash, setTrash] = useState<ApiTrashItem[]>([]);

  // Load data from SQLite via API
  useEffect(() => {
    if (!user || !user.id) {
      console.log('[v0] No user or user ID found, skipping data load');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        console.log('[v0] Loading data for user:', user.id);
        const [
          companiesData,
          fournisseursData,
          transactionsData,
          fundData,
          fundTransactionsData,
          currencyCompaniesData,
          currencyTransactionsData,
          trashData
        ] = await Promise.all([
          getCompanies(user.id),
          getFournisseurs(user.id),
          getTransactions(user.id),
          getFundCapital(user.id),
          getFundTransactions(user.id),
          getCurrencyCompanies(user.id),
          getCurrencyTransactions(user.id),
          getTrashItems(user.id),
        ]);
        setRawCompanies(companiesData || []);
        setRawFournisseurs(fournisseursData || []);
        setRawTransactions(transactionsData || []);
        setFundTransactions(fundTransactionsData || []);
        setRawCurrencyCompanies(currencyCompaniesData || []);
        setRawCurrencyTransactions(currencyTransactionsData || []);
        setTrash(trashData || []);
        if (fundData) {
          setFundCapitalState({
            localCapital: fundData.amount || 0,
            foreignCapital: 0
          });
        } else {
          setFundCapitalState({
            localCapital: 0,
            foreignCapital: 0
          });
        }
        console.log('[v0] Data loaded successfully from SQLite');
      } catch (error) {
        console.error('[v0] Error loading data from SQLite:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const currencyCompanies = rawCurrencyCompanies;

  // Memoized DERIVED state: Companies with LIVE working capital (calculated from transactions)
  const companies = React.useMemo(() => {
    return rawCompanies.map(c => {
      const companyT = rawTransactions.filter(t => t.companyId === c.id && t.type === 'company');
      const workingCapital = companyT.reduce((sum, t) => sum + t.amount, 0);
      return { ...c, workingCapital };
    });
  }, [rawCompanies, rawTransactions]);

  // Memoized DERIVED state: Fournisseurs with LIVE balance (calculated from transactions)
  const fournisseurs = React.useMemo(() => {
    return rawFournisseurs.map(f => {
      const fournisseurT = rawTransactions.filter(t => t.fournisseurId === f.id && t.type === 'fournisseur');
      const balance = fournisseurT.reduce((sum, t) => sum + t.amount, 0);
      return { ...f, balance };
    });
  }, [rawFournisseurs, rawTransactions]);

  // Public filtered transactions to ensure deleted entities don't show up in totals or lists
  const transactions = React.useMemo(() => {
    return rawTransactions.filter(t => {
      if (t.type === 'company') return companies.some(c => c.id === t.companyId);
      if (t.type === 'fournisseur') return fournisseurs.some(f => f.id === t.fournisseurId);
      return true;
    });
  }, [rawTransactions, companies, fournisseurs]);

  const currencyTransactions = React.useMemo(() => {
    return rawCurrencyTransactions.filter(t =>
      currencyCompanies.some(cc => cc.id === t.currencyCompanyId)
    );
  }, [rawCurrencyTransactions, currencyCompanies]);

  const refreshData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [
        companiesData,
        fournisseursData,
        transactionsData,
        fundData,
        fundTransactionsData,
        currencyCompaniesData,
        currencyTransactionsData,
        trashData
      ] = await Promise.all([
        getCompanies(user.id),
        getFournisseurs(user.id),
        getTransactions(user.id),
        getFundCapital(user.id),
        getFundTransactions(user.id),
        getCurrencyCompanies(user.id),
        getCurrencyTransactions(user.id),
        getTrashItems(user.id),
      ]);
      setRawCompanies(companiesData || []);
      setRawFournisseurs(fournisseursData || []);
      setRawTransactions(transactionsData || []);
      setFundTransactions(fundTransactionsData || []);
      setRawCurrencyCompanies(currencyCompaniesData || []);
      setRawCurrencyTransactions(currencyTransactionsData || []);
      setTrash(trashData || []);
      if (fundData) {
        setFundCapitalState({ localCapital: fundData.amount || 0, foreignCapital: 0 });
      }
    } catch (e) {
      console.error('Refresh error:', e);
    }
  }, [user]);

  const addCompany = useCallback(
    async (company: Omit<Company, 'id' | 'createdAt'>) => {
      if (!user) return;
      try {
        const newCompany = await apiAddCompany(user.id, company);
        setRawCompanies((prev) => [...prev, newCompany]);
        await refreshData();
      } catch (error) {
        console.error('[v0] Error adding company:', error);
        throw error;
      }
    },
    [user, refreshData]
  );

  const addFournisseur = useCallback(
    async (fournisseur: Omit<Fournisseur, 'id' | 'createdAt'>) => {
      if (!user) return;
      try {
        const newFournisseur = await apiAddFournisseur(user.id, fournisseur);
        setRawFournisseurs((prev) => [...prev, newFournisseur]);
        await refreshData();
      } catch (error) {
        console.error('[v0] Error adding fournisseur:', error);
        throw error;
      }
    },
    [user, refreshData]
  );

  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
      if (!user) return;
      try {
        const newTransaction = await apiAddTransaction(user.id, transaction);
        setRawTransactions((prev) => [...prev, newTransaction]);

        // Update database aggregate (best effort, UI will use live memoized values)
        if (transaction.type === 'company' && transaction.companyId) {
          const comp = rawCompanies.find(c => c.id === transaction.companyId);
          if (comp) {
            const currentT = rawTransactions.filter(t => t.companyId === transaction.companyId && t.type === 'company');
            const total = currentT.reduce((sum, t) => sum + t.amount, 0) + transaction.amount;
            await apiUpdateCompany(transaction.companyId, { workingCapital: total });
          }
        } else if (transaction.type === 'fournisseur' && transaction.fournisseurId) {
          const four = rawFournisseurs.find(f => f.id === transaction.fournisseurId);
          if (four) {
            const currentT = rawTransactions.filter(t => t.fournisseurId === transaction.fournisseurId && t.type === 'fournisseur');
            const total = currentT.reduce((sum, t) => sum + t.amount, 0) + transaction.amount;
            await apiUpdateFournisseur(transaction.fournisseurId, { balance: total });
          }
        }

        await refreshData();
      } catch (error) {
        console.error('[v0] Error adding transaction:', error);
        throw error;
      }
    },
    [user, rawCompanies, rawFournisseurs, rawTransactions, refreshData]
  );

  const updateCompany = useCallback(
    async (id: string, updates: Partial<Company>) => {
      if (!user) return;
      try {
        await apiUpdateCompany(id, updates);
        setRawCompanies((prev) =>
          prev.map((company) => (company.id === id ? { ...company, ...updates } : company))
        );
        await refreshData();
      } catch (error) {
        console.error('[v0] Error updating company:', error);
        throw error;
      }
    },
    [user, refreshData]
  );

  const updateFournisseur = useCallback(
    async (id: string, updates: Partial<Fournisseur>) => {
      if (!user) return;
      try {
        await apiUpdateFournisseur(id, updates);
        setRawFournisseurs((prev) =>
          prev.map((fournisseur) =>
            fournisseur.id === id ? { ...fournisseur, ...updates } : fournisseur
          )
        );
        await refreshData();
      } catch (error) {
        console.error('[v0] Error updating fournisseur:', error);
        throw error;
      }
    },
    [user, refreshData]
  );

  const loadTrash = useCallback(async () => {
    if (!user?.id) return;
    try {
      const trashData = await getTrashItems(user.id);
      setTrash(trashData || []);
    } catch (error) {
      console.error('[v0] Error loading trash:', error);
    }
  }, [user]);

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      if (!user) return;
      try {
        await apiUpdateTransaction(id, updates);
        setRawTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
        );
        toast.success('تم تحديث المعاملة بنجاح');
      } catch (error) {
        console.error('[v0] Error updating transaction:', error);
        throw error;
      }
    },
    [user]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        const transaction = rawTransactions.find((t) => t.id === id);
        if (transaction) {
          await apiAddToTrash(user.id, 'transaction', transaction as unknown as Record<string, unknown>);

          // Update DB aggregate best effort
          if (transaction.type === 'company' && transaction.companyId) {
            const currentT = rawTransactions.filter(t => t.companyId === transaction.companyId && t.type === 'company' && t.id !== id);
            const total = currentT.reduce((sum, t) => sum + t.amount, 0);
            await apiUpdateCompany(transaction.companyId, { workingCapital: total });
          } else if (transaction.type === 'fournisseur' && transaction.fournisseurId) {
            const currentT = rawTransactions.filter(t => t.fournisseurId === transaction.fournisseurId && t.type === 'fournisseur' && t.id !== id);
            const total = currentT.reduce((sum, t) => sum + t.amount, 0);
            await apiUpdateFournisseur(transaction.fournisseurId, { balance: total });
          }
        }

        await apiDeleteTransaction(id);
        setRawTransactions((prev) => prev.filter((t) => t.id !== id));
        await refreshData();
      } catch (error) {
        console.error('[v0] Error deleting transaction:', error);
        throw error;
      }
    },
    [user, rawTransactions, refreshData]
  );

  const getCompanyById = useCallback(
    (id: string) => companies.find((c) => c.id === id),
    [companies]
  );

  const getFournisseurById = useCallback(
    (id: string) => fournisseurs.find((f) => f.id === id),
    [fournisseurs]
  );

  const deleteAllOldTransactions = useCallback(
    async () => {
      if (!user) return;
      try {
        for (const transaction of rawTransactions) {
          await apiDeleteTransaction(transaction.id);
        }
        setRawTransactions([]);
        await refreshData();
        console.log('[v0] All old transactions deleted successfully');
      } catch (error) {
        console.error('[v0] Error deleting old transactions:', error);
        throw error;
      }
    },
    [user, rawTransactions, refreshData]
  );

  const deleteCompany = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        const company = companies.find((c) => c.id === id);
        if (company) {
          await apiAddToTrash(user.id, 'company', company as unknown as Record<string, unknown>);
        }
        await apiDeleteCompany(id);
        setRawCompanies((prev) => prev.filter((c) => c.id !== id));
        await refreshData();
      } catch (error) {
        console.error('[v0] Error deleting company:', error);
        throw error;
      }
    },
    [user, rawCompanies, refreshData]
  );

  const deleteFournisseur = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        const fournisseur = fournisseurs.find((f) => f.id === id);
        if (fournisseur) {
          await apiAddToTrash(user.id, 'fournisseur', fournisseur as unknown as Record<string, unknown>);
        }
        await apiDeleteFournisseur(id);
        setRawFournisseurs((prev) => prev.filter((f) => f.id !== id));
        await refreshData();
      } catch (error) {
        console.error('[v0] Error deleting fournisseur:', error);
        throw error;
      }
    },
    [user, rawFournisseurs, refreshData]
  );

  const saveFundCapital = useCallback(
    async (capital: number, password: string) => {
      if (!user) return;
      try {
        await setFundCapital(user.id, capital, password);
        setFundCapitalState((prev) => ({
          ...prev,
          localCapital: capital,
        }));

        // Refresh transactions after set
        const fundTransactionsData = await getFundTransactions(user.id);
        setFundTransactions(fundTransactionsData || []);

        console.log('[v0] Fund capital saved successfully:', capital);
      } catch (error) {
        console.error('[v0] Error saving fund capital:', error);
        throw error;
      }
    },
    [user]
  );

  const addFundTransaction = useCallback(
    async (transaction: Omit<ApiFundTransaction, 'id' | 'createdAt'>) => {
      if (!user) return;
      try {
        const newTransaction = await apiAddFundTransaction(user.id, transaction);
        setFundTransactions((prev) => [newTransaction, ...prev]);

        // Update local capital state
        setFundCapitalState((prev) => ({
          ...prev,
          localCapital: prev.localCapital + transaction.amount,
        }));

        console.log('[v0] Fund transaction added:', transaction.type, transaction.amount);
      } catch (error) {
        console.error('[v0] Error adding fund transaction:', error);
        throw error;
      }
    },
    [user]
  );

  const addCurrencyCompany = useCallback(
    async (company: Omit<CurrencyCompany, 'id' | 'createdAt'>) => {
      if (!user) return;
      try {
        const newCompany = await apiAddCurrencyCompany(user.id, company);
        setRawCurrencyCompanies((prev: CurrencyCompany[]) => [...prev, newCompany]);
        await refreshData();
      } catch (error) {
        console.error('[v0] Error adding currency company:', error);
        throw error;
      }
    },
    [user, refreshData]
  );

  const updateCurrencyCompany = useCallback(
    async (id: string, updates: Partial<CurrencyCompany>) => {
      if (!user) return;
      try {
        await apiUpdateCurrencyCompany(id, updates);
        setRawCurrencyCompanies((prev) =>
          prev.map((company) => (company.id === id ? { ...company, ...updates } : company))
        );
        await refreshData();
      } catch (error) {
        console.error('[v0] Error updating currency company:', error);
        throw error;
      }
    },
    [user, refreshData]
  );

  const deleteCurrencyCompany = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        const company = rawCurrencyCompanies.find((c) => c.id === id);
        if (company) {
          await apiAddToTrash(user.id, 'currency_company', company as unknown as Record<string, unknown>);
        }
        await apiDeleteCurrencyCompany(id);
        setRawCurrencyCompanies((prev) => prev.filter((c) => c.id !== id));
        await refreshData();
      } catch (error) {
        console.error('[v0] Error deleting currency company:', error);
        throw error;
      }
    },
    [user, rawCurrencyCompanies, refreshData]
  );

  const addCurrencyTransaction = useCallback(
    async (transaction: Omit<CurrencyTransaction, 'id' | 'createdAt'>) => {
      if (!user) return;
      try {
        // CRITICAL FIX: Respect the provided toAmount if it's non-zero (even if negative for outcomes)
        // Only calculate if toAmount is exactly 0
        const dzdAmount = transaction.toAmount !== 0
          ? transaction.toAmount
          : (transaction.fromAmount || 0) * (transaction.exchangeRateUsed || 1);

        // Use dzdAmount as toAmount to record the "Asset" for the currency company
        const transactionWithAmount = {
          ...transaction,
          toAmount: dzdAmount
        };

        const newTransaction = await apiAddCurrencyTransaction(user.id, transactionWithAmount);
        setRawCurrencyTransactions((prev: CurrencyTransaction[]) => [...prev, newTransaction]);

        // ... updates to related entities ...
        if (transaction.usdFournisseurId) {
          const currencyCompany = rawCurrencyCompanies.find(cc => cc.id === transaction.currencyCompanyId);
          const fournisseurTransaction: Omit<Transaction, 'id' | 'createdAt'> = {
            type: 'fournisseur',
            fournisseurId: transaction.usdFournisseurId,
            amount: -transaction.fromAmount,
            rate: 1,
            description: `تحويل عملة: ${transaction.fromAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} USD من شركة العملة : ${currencyCompany?.name || 'غير محدد'}`,
          };
          const fournisseurTx = await apiAddTransaction(user.id, fournisseurTransaction);
          setRawTransactions((prev: Transaction[]) => [...prev, fournisseurTx]);
        }

        if (transaction.dzdCompanyId) {
          // USER REFINEMENT: Add as outcome to the Company (Debt)
          // The full toAmount represents the debt transferred to the regular company
          const companyTransaction: Omit<Transaction, 'id' | 'createdAt'> = {
            type: 'company',
            companyId: transaction.dzdCompanyId,
            amount: -transaction.toAmount,
            rate: 1,
            description: `دين تحويل عملة: تحويل USD من العملة الصعبة (${transaction.fromAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} USD × ${transaction.exchangeRateUsed} = ${transaction.toAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DZD)`,
          };
          const companyTx = await apiAddTransaction(user.id, companyTransaction);
          setRawTransactions((prev: Transaction[]) => [...prev, companyTx]);
        }

        // USER REQUEST: Fund should not change by any transaction.
        // Removed silent fund update block that used to subtract dzdAmount from localCapital.

        await refreshData();
      } catch (error) {
        console.error('[v0] Error adding currency transaction:', error);
        throw error;
      }
    },
    [user, refreshData]
  );

  const updateCurrencyTransaction = useCallback(
    async (id: string, updates: Partial<CurrencyTransaction>) => {
      if (!user) return;
      try {
        const existingTx = rawCurrencyTransactions.find((t) => t.id === id);
        if (!existingTx) return;

        const mergedTx = { ...existingTx, ...updates };

        // Recalculate toAmount if it's not explicitly provided but rate or fromAmount changed
        let newToAmount = mergedTx.toAmount;
        let newDescription = updates.description || existingTx.description;

        const rateChanged = updates.exchangeRateUsed !== undefined;
        const amountChanged = updates.fromAmount !== undefined;

        if (rateChanged || amountChanged) {
          if (mergedTx.fromAmount > 0) {
            newToAmount = mergedTx.fromAmount * mergedTx.exchangeRateUsed;
          }

          // Only auto-update description if the user didn't explicitly change it in this update
          // OR if the current description looks like an automated one
          const isAutomatedDescription = existingTx.description.includes('تحويل USD من العملة الصعبة') ||
            existingTx.description.includes('×') ||
            existingTx.description === '';

          if (!updates.description && isAutomatedDescription) {
            newDescription = `تحويل USD من العملة الصعبة (${mergedTx.fromAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} USD × ${mergedTx.exchangeRateUsed} = ${newToAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DZD)`;
          }
        }

        const finalUpdates = { ...updates, toAmount: newToAmount, description: newDescription };
        const updatedTx = await apiUpdateCurrencyTransaction(id, finalUpdates);

        setRawCurrencyTransactions((prev) =>
          prev.map((t) => (t.id === id ? updatedTx : t))
        );

        // Update linked regular transactions
        const linkedTransactions = rawTransactions.filter(t => {
          // Check if transaction was created around the same time (within 10 seconds)
          const timeDiff = Math.abs(new Date(t.createdAt).getTime() - new Date(existingTx.createdAt).getTime());
          if (timeDiff > 10000) return false;

          const isUsdMatch = existingTx.usdFournisseurId &&
            t.fournisseurId === existingTx.usdFournisseurId &&
            t.amount === -existingTx.fromAmount &&
            t.description.includes(`تحويل عملة:`);

          const isDzdMatch = existingTx.dzdCompanyId &&
            t.companyId === existingTx.dzdCompanyId &&
            t.amount === -existingTx.toAmount && // Match the exact OLD amount
            t.description.includes(`دين تحويل عملة:`);

          return isUsdMatch || isDzdMatch;
        });

        const currencyCompany = rawCurrencyCompanies.find(cc => cc.id === mergedTx.currencyCompanyId);
        for (const lt of linkedTransactions) {
          if (lt.type === 'fournisseur' && (updates.fromAmount !== undefined || updates.currencyCompanyId !== undefined)) {
            await apiUpdateTransaction(lt.id, {
              amount: -mergedTx.fromAmount,
              description: `تحويل عملة: ${mergedTx.fromAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} USD من شركة العملة : ${currencyCompany?.name || 'غير محدد'}`
            });
          } else if (lt.type === 'company' && (newToAmount !== existingTx.toAmount || updates.fromAmount !== undefined || updates.exchangeRateUsed !== undefined)) {
            await apiUpdateTransaction(lt.id, {
              amount: -newToAmount,
              description: `دين تحويل عملة: تحويل USD من العملة الصعبة (${mergedTx.fromAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} USD × ${mergedTx.exchangeRateUsed} = ${newToAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DZD)`
            });
          }
        }

        await refreshData();
      } catch (error) {
        console.error('[v0] Error updating currency transaction:', error);
        throw error;
      }
    },
    [user, rawCurrencyTransactions, rawTransactions, refreshData]
  );

  const deleteCurrencyTransaction = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        const transaction = rawCurrencyTransactions.find((t) => t.id === id);
        if (!transaction) return;

        // 1. Add to trash
        await apiAddToTrash(user.id, 'currency_transaction', transaction as unknown as Record<string, unknown>);

        // 2. Find and delete linked regular transactions
        const linkedTransactions = rawTransactions.filter(t => {
          // Check if transaction was created around the same time (within 10 seconds)
          const timeDiff = Math.abs(new Date(t.createdAt).getTime() - new Date(transaction.createdAt).getTime());
          if (timeDiff > 10000) return false;

          const isUsdMatch = transaction.usdFournisseurId &&
            t.fournisseurId === transaction.usdFournisseurId &&
            t.amount === -transaction.fromAmount &&
            t.description.includes(`تحويل عملة:`);

          const isDzdMatch = transaction.dzdCompanyId &&
            t.companyId === transaction.dzdCompanyId &&
            t.amount === -transaction.toAmount && // Match the exact amount
            (t.description.includes(`دين تحويل عملة:`) || t.description.includes(`DZD`));

          return isUsdMatch || isDzdMatch;
        });

        for (const lt of linkedTransactions) {
          await apiDeleteTransaction(lt.id);
        }

        // 3. Delete the currency transaction itself
        await apiDeleteCurrencyTransaction(id);
        setRawCurrencyTransactions((prev) => prev.filter((t) => t.id !== id));
        await refreshData();

        console.log('[v0] Currency transaction deleted:', id);
      } catch (error) {
        console.error('[v0] Error deleting currency transaction:', error);
        throw error;
      }
    },
    [user, rawCurrencyTransactions, rawTransactions, refreshData]
  );

  const restoreFromTrash = useCallback(
    async (trashId: string) => {
      if (!user) return;
      const item = trash.find((t) => t.id === trashId);
      if (!item) return;
      try {
        switch (item.itemType) {
          case 'company': {
            await addCompany(item.itemData as any);
            break;
          }
          case 'fournisseur': {
            await addFournisseur(item.itemData as any);
            break;
          }
          case 'transaction': {
            await addTransaction(item.itemData as any);
            break;
          }
          case 'currency_company': {
            await addCurrencyCompany(item.itemData as any);
            break;
          }
          case 'currency_transaction': {
            await addCurrencyTransaction(item.itemData as any);
            break;
          }
        }
        await apiRemoveFromTrash(trashId);
        await refreshData();
      } catch (error) {
        console.error('[v0] Error restoring from trash:', error);
        throw error;
      }
    },
    [user, trash, addCompany, addFournisseur, addTransaction, addCurrencyCompany, addCurrencyTransaction, refreshData]
  );

  const permanentlyDeleteFromTrash = useCallback(
    async (trashId: string) => {
      if (!user) return;
      try {
        await apiRemoveFromTrash(trashId);
        setTrash((prev) => prev.filter((t) => t.id !== trashId));
      } catch (error) {
        console.error('[v0] Error permanently deleting from trash:', error);
        throw error;
      }
    },
    [user]
  );

  const emptyTrash = useCallback(
    async () => {
      if (!user) return;
      try {
        for (const item of trash) {
          await apiRemoveFromTrash(item.id);
        }
        setTrash([]);
        toast.success('تم إفراغ سلة المهملات بنجاح');
      } catch (error) {
        console.error('[v0] Error emptying trash:', error);
        throw error;
      }
    },
    [user, trash]
  );

  const resetAppData = useCallback(async () => {
    if (!user) return;
    try {
      await apiResetUserDatabase(user.id);
      await refreshData();
    } catch (error) {
      console.error('[v0] Error resetting app data:', error);
      throw error;
    }
  }, [user, refreshData]);

  return (
    <AppContext.Provider
      value={{
        companies,
        fournisseurs,
        transactions,
        currencyCompanies,
        currencyTransactions,
        loading,
        fundCapital,
        fundTransactions,
        addCompany,
        addFournisseur,
        addTransaction,
        updateCompany,
        updateFournisseur,
        updateTransaction,
        deleteCompany,
        deleteFournisseur,
        deleteTransaction,
        deleteAllOldTransactions,
        addCurrencyCompany,
        updateCurrencyCompany,
        deleteCurrencyCompany,
        addCurrencyTransaction,
        updateCurrencyTransaction,
        deleteCurrencyTransaction,
        getCompanyById,
        getFournisseurById,
        saveFundCapital,
        addFundTransaction,
        trash,
        loadTrash,
        restoreFromTrash,
        permanentlyDeleteFromTrash,
        emptyTrash,
        resetAppData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppContext);
  if (undefined === context) {
    throw new Error('useAppData must be used within AppProvider');
  }
  return context;
};
