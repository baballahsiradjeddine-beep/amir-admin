-- Enable Row Level Security (RLS) for all tables
-- Each user can only access their own data based on 'user_id' = auth.uid()

-- 1. Companies Table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    owner TEXT,
    description TEXT,
    initial_capital NUMERIC DEFAULT 0,
    working_capital NUMERIC DEFAULT 0,
    share_percentage NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own companies" ON public.companies
    FOR ALL USING (auth.uid() = user_id);


-- 2. Fournisseurs Table
CREATE TABLE public.fournisseurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    currency TEXT DEFAULT 'USD',
    currencies JSONB, -- Stored as JSON array of strings
    balance NUMERIC DEFAULT 0,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own fournisseurs" ON public.fournisseurs
    FOR ALL USING (auth.uid() = user_id);


-- 3. Transactions Table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('company', 'fournisseur')),
    amount NUMERIC DEFAULT 0,
    rate NUMERIC DEFAULT 1,
    description TEXT,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    fournisseur_id UUID REFERENCES public.fournisseurs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own transactions" ON public.transactions
    FOR ALL USING (auth.uid() = user_id);
-- Add indexes for faster fetching
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_company_id ON public.transactions(company_id);
CREATE INDEX idx_transactions_fournisseur_id ON public.transactions(fournisseur_id);


-- 4. Fund Capital Table (Stores current capital state)
CREATE TABLE public.fund_capital (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC DEFAULT 0,
    password_hash TEXT, -- Optional: Password to protect sensitive actions
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id) -- Only one record per user
);
ALTER TABLE public.fund_capital ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own fund capital" ON public.fund_capital
    FOR ALL USING (auth.uid() = user_id);


-- 5. Fund Transactions Table (History of capital changes)
CREATE TABLE public.fund_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('set', 'add', 'withdraw')),
    amount NUMERIC DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own fund transactions" ON public.fund_transactions
    FOR ALL USING (auth.uid() = user_id);


-- 6. Currency Companies Table
CREATE TABLE public.currency_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    base_currency TEXT DEFAULT 'USD',
    base_currencies JSONB, -- JSON array
    target_currency TEXT DEFAULT 'DZD',
    target_currencies JSONB, -- JSON array
    exchange_rate NUMERIC DEFAULT 1,
    commission_percentage NUMERIC DEFAULT 0,
    description TEXT,
    image TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.currency_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own currency companies" ON public.currency_companies
    FOR ALL USING (auth.uid() = user_id);


-- 7. Currency Transactions Table
CREATE TABLE public.currency_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    currency_company_id UUID REFERENCES public.currency_companies(id) ON DELETE SET NULL,
    from_amount NUMERIC DEFAULT 0,
    to_amount NUMERIC DEFAULT 0,
    exchange_rate_used NUMERIC DEFAULT 1,
    commission_amount NUMERIC DEFAULT 0,
    description TEXT,
    usd_fournisseur_id UUID REFERENCES public.fournisseurs(id) ON DELETE SET NULL,
    dzd_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    usd_description TEXT,
    dzd_description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.currency_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own currency transactions" ON public.currency_transactions
    FOR ALL USING (auth.uid() = user_id);
-- Indexes
CREATE INDEX idx_currency_transactions_user_id ON public.currency_transactions(user_id);
CREATE INDEX idx_currency_transactions_company_id ON public.currency_transactions(currency_company_id);


-- 8. Trash Table (Soft Deletions)
CREATE TABLE public.trash (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_type TEXT NOT NULL,
    item_data JSONB NOT NULL, -- Store the deleted item as JSON
    deleted_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.trash ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own trash" ON public.trash
    FOR ALL USING (auth.uid() = user_id);


-- Set up Realtime for relevant tables (Optional but good for live updates)
alter publication supabase_realtime add table public.companies;
alter publication supabase_realtime add table public.fournisseurs;
alter publication supabase_realtime add table public.transactions;
