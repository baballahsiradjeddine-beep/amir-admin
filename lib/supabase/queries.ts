
import { supabase } from './client';

// Re-export types from SQLite queries for consistency
import type {
    Company, Fournisseur, Transaction, FundCapital, FundTransaction,
    CurrencyCompany, CurrencyTransaction, User, TrashItem
} from '../sqlite/queries';

export type {
    Company, Fournisseur, Transaction, FundCapital, FundTransaction,
    CurrencyCompany, CurrencyTransaction, User, TrashItem
};

// --- Helper Functions (Mappers) ---

// 1. Company Mapper
function mapCompanyFromDB(db: any): Company {
    return {
        id: db.id,
        userId: db.user_id,
        name: db.name,
        owner: db.owner,
        description: db.description,
        initialCapital: Number(db.initial_capital), // Ensure number
        workingCapital: Number(db.working_capital),
        sharePercentage: Number(db.share_percentage),
        isActive: db.is_active,
        image: db.image,
        createdAt: db.created_at,
        updatedAt: db.updated_at
    };
}

function mapCompanyToDB(app: Partial<Company>, userId?: string): any {
    const db: any = {};
    if (userId) db.user_id = userId;
    // Check against undefined to allow partial updates (e.g. during edit)
    if (app.name !== undefined) db.name = app.name;
    if (app.owner !== undefined) db.owner = app.owner;
    if (app.description !== undefined) db.description = app.description;
    if (app.initialCapital !== undefined) db.initial_capital = app.initialCapital;
    if (app.workingCapital !== undefined) db.working_capital = app.workingCapital;
    if (app.sharePercentage !== undefined) db.share_percentage = app.sharePercentage;
    if (app.isActive !== undefined) db.is_active = app.isActive;
    if (app.image !== undefined) db.image = app.image;
    // We don't manually set created_at/updated_at usually, DB handles it
    return db;
}

// 2. Fournisseur Mapper
function mapFournisseurFromDB(db: any): Fournisseur {
    return {
        id: db.id,
        userId: db.user_id,
        name: db.name,
        currency: db.currency,
        currencies: db.currencies, // JSON is auto-parsed by supabase-js
        balance: Number(db.balance),
        image: db.image,
        createdAt: db.created_at,
        updatedAt: db.updated_at
    };
}

function mapFournisseurToDB(app: Partial<Fournisseur>, userId?: string): any {
    const db: any = {};
    if (userId) db.user_id = userId;
    if (app.name !== undefined) db.name = app.name;
    if (app.currency !== undefined) db.currency = app.currency;
    if (app.currencies !== undefined) db.currencies = app.currencies;
    if (app.balance !== undefined) db.balance = app.balance;
    if (app.image !== undefined) db.image = app.image;
    return db;
}

// 3. Transaction Mapper
function mapTransactionFromDB(db: any): Transaction {
    return {
        id: db.id,
        userId: db.user_id,
        type: db.type,
        amount: Number(db.amount),
        rate: Number(db.rate), // Changed from exchangeRate to rate to match Interface
        description: db.description,
        companyId: db.company_id,
        fournisseurId: db.fournisseur_id,
        createdAt: db.created_at,
        updatedAt: db.updated_at
    };
}

function mapTransactionToDB(app: Partial<Transaction>, userId?: string): any {
    const db: any = {};
    if (userId) db.user_id = userId;
    if (app.type !== undefined) db.type = app.type;
    if (app.amount !== undefined) db.amount = app.amount;
    if (app.rate !== undefined) db.rate = app.rate; // Changed from exchangeRate to rate
    if (app.description !== undefined) db.description = app.description;
    if (app.companyId !== undefined) db.company_id = app.companyId;
    if (app.fournisseurId !== undefined) db.fournisseur_id = app.fournisseurId;
    return db;
}

// 4. Fund Capital Mapper
function mapFundCapitalFromDB(db: any): FundCapital {
    return {
        id: db.id,
        userId: db.user_id,
        amount: Number(db.amount),
        passwordHash: db.password_hash,
        createdAt: db.created_at,
        updatedAt: db.updated_at
    };
}

// 5. Fund Transaction Mapper
function mapFundTransactionFromDB(db: any): FundTransaction {
    return {
        id: db.id,
        userId: db.user_id,
        type: db.type,
        amount: Number(db.amount),
        description: db.description,
        createdAt: db.created_at
    };
}

// 6. Currency Company Mapper
function mapCurrencyCompanyFromDB(db: any): CurrencyCompany {
    return {
        id: db.id,
        userId: db.user_id,
        name: db.name,
        baseCurrency: db.base_currency,
        baseCurrencies: db.base_currencies,
        targetCurrency: db.target_currency,
        targetCurrencies: db.target_currencies,
        exchangeRate: Number(db.exchange_rate),
        commissionPercentage: Number(db.commission_percentage),
        description: db.description,
        image: db.image,
        isActive: db.is_active,
        createdAt: db.created_at,
        updatedAt: db.updated_at
    };
}

function mapCurrencyCompanyToDB(app: Partial<CurrencyCompany>, userId?: string): any {
    const db: any = {};
    if (userId) db.user_id = userId;
    if (app.name !== undefined) db.name = app.name;
    if (app.baseCurrency !== undefined) db.base_currency = app.baseCurrency;
    if (app.baseCurrencies !== undefined) db.base_currencies = app.baseCurrencies;
    if (app.targetCurrency !== undefined) db.target_currency = app.targetCurrency;
    if (app.targetCurrencies !== undefined) db.target_currencies = app.targetCurrencies;
    if (app.exchangeRate !== undefined) db.exchange_rate = app.exchangeRate;
    if (app.commissionPercentage !== undefined) db.commission_percentage = app.commissionPercentage;
    if (app.description !== undefined) db.description = app.description;
    if (app.image !== undefined) db.image = app.image;
    if (app.isActive !== undefined) db.is_active = app.isActive;
    return db;
}

// 7. Currency Transaction Mapper
function mapCurrencyTransactionFromDB(db: any): CurrencyTransaction {
    return {
        id: db.id,
        userId: db.user_id,
        currencyCompanyId: db.currency_company_id,
        fromAmount: Number(db.from_amount),
        toAmount: Number(db.to_amount),
        exchangeRateUsed: Number(db.exchange_rate_used),
        commissionAmount: Number(db.commission_amount),
        description: db.description,
        usdFournisseurId: db.usd_fournisseur_id,
        dzdCompanyId: db.dzd_company_id,
        usdDescription: db.usd_description,
        dzdDescription: db.dzd_description,
        createdAt: db.created_at,
        updatedAt: db.updated_at || db.created_at
    };
}

function mapCurrencyTransactionToDB(app: Partial<CurrencyTransaction>, userId?: string): any {
    const db: any = {};
    if (userId) db.user_id = userId;
    if (app.currencyCompanyId !== undefined) db.currency_company_id = app.currencyCompanyId;
    if (app.fromAmount !== undefined) db.from_amount = app.fromAmount;
    if (app.toAmount !== undefined) db.to_amount = app.toAmount;
    if (app.exchangeRateUsed !== undefined) db.exchange_rate_used = app.exchangeRateUsed;
    if (app.commissionAmount !== undefined) db.commission_amount = app.commissionAmount;
    if (app.description !== undefined) db.description = app.description;
    if (app.usdFournisseurId !== undefined) db.usd_fournisseur_id = app.usdFournisseurId;
    if (app.dzdCompanyId !== undefined) db.dzd_company_id = app.dzdCompanyId;
    if (app.usdDescription !== undefined) db.usd_description = app.usdDescription;
    if (app.dzdDescription !== undefined) db.dzd_description = app.dzdDescription;
    return db;
}

// 8. Trash Mapper
function mapTrashFromDB(db: any): TrashItem {
    return {
        id: db.id,
        userId: db.user_id,
        itemType: db.item_type,
        itemData: db.item_data, // JSON
        deletedAt: db.deleted_at || db.created_at
    };
}


// --- Users (Placeholder) ---

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// --- Companies Operations ---

export async function getCompanies(userId: string): Promise<Company[]> {
    const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapCompanyFromDB);
}

export async function addCompany(userId: string, company: Partial<Company>): Promise<Company> {
    const dbPayload = mapCompanyToDB(company, userId);
    const { data, error } = await supabase
        .from('companies')
        .insert([dbPayload])
        .select()
        .single();

    if (error) throw error;
    return mapCompanyFromDB(data);
}

export async function updateCompany(companyId: string, updates: Partial<Company>): Promise<Company> {
    const dbPayload = mapCompanyToDB(updates);
    const { data, error } = await supabase
        .from('companies')
        .update(dbPayload)
        .eq('id', companyId)
        .select()
        .single();

    if (error) throw error;
    return mapCompanyFromDB(data);
}

export async function deleteCompany(companyId: string): Promise<void> {
    const { error } = await supabase.from('companies').delete().eq('id', companyId);
    if (error) throw error;
}

// --- Fournisseurs Operations ---

export async function getFournisseurs(userId: string): Promise<Fournisseur[]> {
    const { data, error } = await supabase
        .from('fournisseurs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapFournisseurFromDB);
}

export async function addFournisseur(userId: string, fournisseur: Partial<Fournisseur>): Promise<Fournisseur> {
    const dbPayload = mapFournisseurToDB(fournisseur, userId);
    const { data, error } = await supabase
        .from('fournisseurs')
        .insert([dbPayload])
        .select()
        .single();

    if (error) throw error;
    return mapFournisseurFromDB(data);
}

export async function updateFournisseur(fournisseurId: string, updates: Partial<Fournisseur>): Promise<Fournisseur> {
    const dbPayload = mapFournisseurToDB(updates);
    const { data, error } = await supabase
        .from('fournisseurs')
        .update(dbPayload)
        .eq('id', fournisseurId)
        .select()
        .single();

    if (error) throw error;
    return mapFournisseurFromDB(data);
}

export async function deleteFournisseur(fournisseurId: string): Promise<void> {
    const { error } = await supabase.from('fournisseurs').delete().eq('id', fournisseurId);
    if (error) throw error;
}

// --- Transactions Operations ---

export async function getTransactions(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapTransactionFromDB);
}

export async function addTransaction(userId: string, transaction: Partial<Transaction>): Promise<Transaction> {
    const dbPayload = mapTransactionToDB(transaction, userId);
    const { data, error } = await supabase
        .from('transactions')
        .insert([dbPayload])
        .select()
        .single();

    if (error) throw error;
    return mapTransactionFromDB(data);
}

export async function updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<Transaction> {
    const dbPayload = mapTransactionToDB(updates);
    const { data, error } = await supabase
        .from('transactions')
        .update(dbPayload)
        .eq('id', transactionId)
        .select()
        .single();

    if (error) throw error;
    return mapTransactionFromDB(data);
}

export async function deleteTransaction(transactionId: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
    if (error) throw error;
}

// --- Fund Capital Operations ---

export async function getFundCapital(userId: string): Promise<FundCapital | null> {
    const { data, error } = await supabase
        .from('fund_capital')
        .select('*')
        .maybeSingle();

    if (error) throw error;
    return data ? mapFundCapitalFromDB(data) : null;
}

export async function setFundCapital(userId: string, amount: number, passwordHash: string): Promise<FundCapital> {
    const { data, error } = await supabase
        .from('fund_capital')
        .upsert({ user_id: userId, amount, password_hash: passwordHash }, { onConflict: 'user_id' })
        .select()
        .single();

    if (error) throw error;
    return mapFundCapitalFromDB(data);
}

// --- Currency Companies Operations ---

export async function getCurrencyCompanies(userId: string): Promise<CurrencyCompany[]> {
    const { data, error } = await supabase
        .from('currency_companies')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapCurrencyCompanyFromDB);
}

export async function addCurrencyCompany(userId: string, company: Partial<CurrencyCompany>): Promise<CurrencyCompany> {
    const dbPayload = mapCurrencyCompanyToDB(company, userId);
    const { data, error } = await supabase
        .from('currency_companies')
        .insert([dbPayload])
        .select()
        .single();

    if (error) throw error;
    return mapCurrencyCompanyFromDB(data);
}

export async function updateCurrencyCompany(companyId: string, updates: Partial<CurrencyCompany>): Promise<CurrencyCompany> {
    const dbPayload = mapCurrencyCompanyToDB(updates);
    const { data, error } = await supabase
        .from('currency_companies')
        .update(dbPayload)
        .eq('id', companyId)
        .select()
        .single();

    if (error) throw error;
    return mapCurrencyCompanyFromDB(data);
}

export async function deleteCurrencyCompany(companyId: string): Promise<void> {
    const { error } = await supabase.from('currency_companies').delete().eq('id', companyId);
    if (error) throw error;
}

// --- Currency Transactions Operations ---

export async function getCurrencyTransactions(userId: string): Promise<CurrencyTransaction[]> {
    const { data, error } = await supabase
        .from('currency_transactions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapCurrencyTransactionFromDB);
}

export async function addCurrencyTransaction(userId: string, transaction: Partial<CurrencyTransaction>): Promise<CurrencyTransaction> {
    const dbPayload = mapCurrencyTransactionToDB(transaction, userId);
    const { data, error } = await supabase
        .from('currency_transactions')
        .insert([dbPayload])
        .select()
        .single();

    if (error) throw error;
    return mapCurrencyTransactionFromDB(data);
}

export async function updateCurrencyTransaction(transactionId: string, updates: Partial<CurrencyTransaction>): Promise<CurrencyTransaction> {
    const dbPayload = mapCurrencyTransactionToDB(updates);
    const { data, error } = await supabase
        .from('currency_transactions')
        .update(dbPayload)
        .eq('id', transactionId)
        .select()
        .single();

    if (error) throw error;
    return mapCurrencyTransactionFromDB(data);
}

export async function deleteCurrencyTransaction(transactionId: string): Promise<void> {
    const { error } = await supabase.from('currency_transactions').delete().eq('id', transactionId);
    if (error) throw error;
}

// --- Fund Transactions (Helper) Operations ---

export async function getFundTransactions(userId: string): Promise<FundTransaction[]> {
    const { data, error } = await supabase
        .from('fund_transactions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapFundTransactionFromDB);
}

export async function addFundTransaction(userId: string, transaction: Partial<FundTransaction>, updateBalance: boolean = true): Promise<FundTransaction> {
    const { data, error } = await supabase
        .from('fund_transactions')
        .insert([{
            user_id: userId,
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description
        }])
        .select()
        .single();

    if (error) throw error;

    if (updateBalance) {
        const { data: current } = await supabase.from('fund_capital').select('*').maybeSingle();
        if (current) {
            await supabase.from('fund_capital').update({
                amount: (current.amount || 0) + (transaction.amount || 0)
            }).eq('user_id', userId);
        }
    }

    return mapFundTransactionFromDB(data);
}

// --- Trash Operations ---

export async function getTrashItems(userId: string): Promise<TrashItem[]> {
    const { data, error } = await supabase
        .from('trash')
        .select('*')
        .order('deleted_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapTrashFromDB);
}

export async function addToTrash(userId: string, itemType: string, itemData: Record<string, unknown>): Promise<TrashItem> {
    const { data, error } = await supabase
        .from('trash')
        .insert([{
            user_id: userId,
            item_type: itemType,
            item_data: itemData
        }])
        .select()
        .single();

    if (error) throw error;
    return mapTrashFromDB(data);
}

export async function removeFromTrash(trashId: string): Promise<void> {
    const { error } = await supabase.from('trash').delete().eq('id', trashId);
    if (error) throw error;
}

// --- Reset Operations ---

export async function resetUserDatabase(userId: string): Promise<void> {
    const nullUUID = '00000000-0000-0000-0000-000000000000';
    await supabase.from('currency_transactions').delete().neq('id', nullUUID);
    await supabase.from('transactions').delete().neq('id', nullUUID);
    await supabase.from('fund_transactions').delete().neq('id', nullUUID);
    await supabase.from('companies').delete().neq('id', nullUUID);
    await supabase.from('fournisseurs').delete().neq('id', nullUUID);
    await supabase.from('fund_capital').delete().neq('id', nullUUID);
    await supabase.from('currency_companies').delete().neq('id', nullUUID);
    await supabase.from('trash').delete().neq('id', nullUUID);
}
