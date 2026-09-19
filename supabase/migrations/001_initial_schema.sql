-- MedSafe AI Supabase Database Schema Migration
-- Enables Row Level Security (RLS) on all tables

-- 1. Profiles Table (tied to Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Sources Table (Medical label evidence sources like DailyMed, openFDA)
CREATE TABLE IF NOT EXISTS public.sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'package_insert',
    title TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    license_note TEXT DEFAULT 'Public Domain / FDA DailyMed'
);

-- 3. Source Chunks Table (TF-IDF vectorizer corpus chunks)
CREATE TABLE IF NOT EXISTS public.source_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
    ingredient_names TEXT[] NOT NULL,
    section_name TEXT NOT NULL,
    content TEXT NOT NULL,
    chunk_hash TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. DDI Rules Table (Curated Drug-Drug Interaction Rules)
-- ingredient_a and ingredient_b MUST be stored in alphabetical order (ingredient_a < ingredient_b)
CREATE TABLE IF NOT EXISTS public.ddi_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_a TEXT NOT NULL,
    ingredient_b TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('high', 'moderate', 'low')),
    mechanism TEXT NOT NULL,
    patient_friendly_summary TEXT NOT NULL,
    recommended_action_template TEXT NOT NULL,
    urgent_warning_template TEXT,
    source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT check_canonical_order CHECK (ingredient_a < ingredient_b),
    CONSTRAINT unique_ingredient_pair UNIQUE (ingredient_a, ingredient_b)
);

-- 5. Analyses Table (Audit log of medication safety queries)
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    overall_risk TEXT NOT NULL CHECK (overall_risk IN ('high', 'moderate', 'low', 'unknown')),
    request_json JSONB NOT NULL,
    response_json JSONB NOT NULL
);

-- 6. Feedback Table (User feedback on analysis quality)
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating IN (1, -1)),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- INDEXES for high performance queries
CREATE INDEX IF NOT EXISTS idx_ddi_rules_pair ON public.ddi_rules(ingredient_a, ingredient_b);
CREATE INDEX IF NOT EXISTS idx_source_chunks_ingredients ON public.source_chunks USING GIN(ingredient_names);
CREATE INDEX IF NOT EXISTS idx_analyses_user ON public.analyses(user_id, created_at DESC);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ddi_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update only their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Sources and Source Chunks: Public read, backend insert/update
CREATE POLICY "Public read sources" ON public.sources
    FOR SELECT USING (true);
CREATE POLICY "Public read source chunks" ON public.source_chunks
    FOR SELECT USING (true);

-- DDI Rules: Public read active rules
CREATE POLICY "Public read active ddi_rules" ON public.ddi_rules
    FOR SELECT USING (active = true);

-- Analyses: Users read only their own analyses; anonymous analyses (user_id IS NULL) are readable if requested by session
CREATE POLICY "Users view own analyses" ON public.analyses
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Insert analyses" ON public.analyses
    FOR INSERT WITH CHECK (true);

-- Feedback: Insert allowed for all; view allowed for own feedback
CREATE POLICY "Users view own feedback" ON public.feedback
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Insert feedback" ON public.feedback
    FOR INSERT WITH CHECK (true);
