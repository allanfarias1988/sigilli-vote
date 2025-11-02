-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('tenant_admin', 'commission_admin', 'voter', 'viewer');

-- Create anonimato_modo enum
CREATE TYPE public.anonimato_modo AS ENUM ('anonimo', 'obrigatorio', 'opcional');

-- Create commission_status enum
CREATE TYPE public.commission_status AS ENUM ('draft', 'aberta', 'finalizada');

-- Create survey_status enum
CREATE TYPE public.survey_status AS ENUM ('aberta', 'fechada');

-- =====================================================
-- TENANTS TABLE
-- =====================================================
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  ano_corrente INT DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES TABLE (extends auth.users)
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER_ROLES TABLE
-- =====================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tenant_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- MEMBERS TABLE
-- =====================================================
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  nome_completo TEXT NOT NULL,
  apelido TEXT,
  imagem_url TEXT,
  telefone TEXT,
  email TEXT,
  data_nasc DATE,
  estado_civil TEXT,
  endereco TEXT,
  ano_batismo INT,
  apto BOOLEAN DEFAULT TRUE,
  cargos_atuais TEXT[],
  interesses TEXT[],
  tempo_no_cargo INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_members_tenant ON public.members(tenant_id);
CREATE INDEX idx_members_nome ON public.members(nome_completo);

-- =====================================================
-- SURVEYS TABLE
-- =====================================================
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  ano INT NOT NULL,
  descricao TEXT,
  link_code VARCHAR(10) UNIQUE NOT NULL,
  status public.survey_status DEFAULT 'aberta',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_surveys_tenant ON public.surveys(tenant_id);
CREATE INDEX idx_surveys_link_code ON public.surveys(link_code);

-- =====================================================
-- SURVEY_ITEMS TABLE
-- =====================================================
CREATE TABLE public.survey_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  cargo_nome TEXT NOT NULL,
  max_sugestoes INT DEFAULT 2,
  ordem INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.survey_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_survey_items_survey ON public.survey_items(survey_id);

-- =====================================================
-- SURVEY_VOTES TABLE
-- =====================================================
CREATE TABLE public.survey_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  cargo_nome TEXT NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  vote_count INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.survey_votes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_survey_votes_survey ON public.survey_votes(survey_id);
CREATE INDEX idx_survey_votes_cargo ON public.survey_votes(cargo_nome);

-- =====================================================
-- COMMISSIONS TABLE
-- =====================================================
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  ano INT NOT NULL,
  descricao TEXT,
  survey_id UUID REFERENCES public.surveys(id) ON DELETE SET NULL,
  anonimato_modo public.anonimato_modo DEFAULT 'anonimo',
  status public.commission_status DEFAULT 'draft',
  link_code VARCHAR(10) UNIQUE NOT NULL,
  finalization_key VARCHAR(6),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalized_at TIMESTAMPTZ
);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_commissions_tenant ON public.commissions(tenant_id);
CREATE INDEX idx_commissions_link_code ON public.commissions(link_code);

-- =====================================================
-- COMMISSION_ROLES TABLE
-- =====================================================
CREATE TABLE public.commission_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commission_id UUID REFERENCES public.commissions(id) ON DELETE CASCADE NOT NULL,
  nome_cargo TEXT NOT NULL,
  max_selecoes INT DEFAULT 2,
  ordem INT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.commission_roles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_commission_roles_commission ON public.commission_roles(commission_id);

-- =====================================================
-- BALLOTS TABLE
-- =====================================================
CREATE TABLE public.ballots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commission_id UUID REFERENCES public.commissions(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.commission_roles(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  signature_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ballots ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ballots_commission ON public.ballots(commission_id);
CREATE INDEX idx_ballots_role ON public.ballots(role_id);

-- =====================================================
-- VOTES TABLE
-- =====================================================
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ballot_id UUID REFERENCES public.ballots(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_votes_ballot ON public.votes(ballot_id);
CREATE INDEX idx_votes_member ON public.votes(member_id);

-- =====================================================
-- AUDIT_LOG TABLE
-- =====================================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  details_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_audit_log_tenant ON public.audit_log(tenant_id);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);

-- =====================================================
-- SHORT_LINKS TABLE
-- =====================================================
CREATE TABLE public.short_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  target TEXT NOT NULL,
  target_id UUID NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_short_links_code ON public.short_links(code);
CREATE INDEX idx_short_links_tenant ON public.short_links(tenant_id);

-- =====================================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECKING
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- =====================================================
-- FUNCTION TO GET USER TENANT
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_tenant(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1;
$$;

-- =====================================================
-- TRIGGER FUNCTION FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON public.surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TRIGGER FUNCTION TO CREATE PROFILE ON USER SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Profile will be created by application logic with tenant assignment
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- RLS POLICIES - TENANTS
-- =====================================================
CREATE POLICY "Tenants viewable by members"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (id = public.get_user_tenant(auth.uid()));

CREATE POLICY "Tenants manageable by tenant admins"
  ON public.tenants FOR ALL
  TO authenticated
  USING (
    id = public.get_user_tenant(auth.uid()) 
    AND public.has_role(auth.uid(), 'tenant_admin')
  );

-- =====================================================
-- RLS POLICIES - PROFILES
-- =====================================================
CREATE POLICY "Profiles viewable by same tenant"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Profiles insertable by authenticated users"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- =====================================================
-- RLS POLICIES - USER_ROLES
-- =====================================================
CREATE POLICY "User roles viewable by same tenant"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()));

CREATE POLICY "User roles manageable by tenant admins"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant(auth.uid())
    AND public.has_role(auth.uid(), 'tenant_admin')
  );

-- =====================================================
-- RLS POLICIES - MEMBERS
-- =====================================================
CREATE POLICY "Members viewable by same tenant"
  ON public.members FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()));

CREATE POLICY "Members manageable by admins"
  ON public.members FOR ALL
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant(auth.uid())
    AND (
      public.has_role(auth.uid(), 'tenant_admin')
      OR public.has_role(auth.uid(), 'commission_admin')
    )
  );

-- =====================================================
-- RLS POLICIES - SURVEYS
-- =====================================================
CREATE POLICY "Surveys viewable by same tenant"
  ON public.surveys FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()));

CREATE POLICY "Surveys manageable by admins"
  ON public.surveys FOR ALL
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant(auth.uid())
    AND (
      public.has_role(auth.uid(), 'tenant_admin')
      OR public.has_role(auth.uid(), 'commission_admin')
    )
  );

-- Public read for survey votes (anonymous participation)
CREATE POLICY "Survey items viewable by anyone"
  ON public.survey_items FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Survey items manageable by admins"
  ON public.survey_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.surveys s
      WHERE s.id = survey_items.survey_id
      AND s.tenant_id = public.get_user_tenant(auth.uid())
      AND (
        public.has_role(auth.uid(), 'tenant_admin')
        OR public.has_role(auth.uid(), 'commission_admin')
      )
    )
  );

-- =====================================================
-- RLS POLICIES - SURVEY_VOTES
-- =====================================================
CREATE POLICY "Survey votes insertable by anyone"
  ON public.survey_votes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Survey votes viewable by admins"
  ON public.survey_votes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.surveys s
      WHERE s.id = survey_votes.survey_id
      AND s.tenant_id = public.get_user_tenant(auth.uid())
      AND (
        public.has_role(auth.uid(), 'tenant_admin')
        OR public.has_role(auth.uid(), 'commission_admin')
      )
    )
  );

-- =====================================================
-- RLS POLICIES - COMMISSIONS
-- =====================================================
CREATE POLICY "Commissions viewable by same tenant"
  ON public.commissions FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()));

CREATE POLICY "Commissions manageable by admins"
  ON public.commissions FOR ALL
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant(auth.uid())
    AND (
      public.has_role(auth.uid(), 'tenant_admin')
      OR public.has_role(auth.uid(), 'commission_admin')
    )
  );

-- =====================================================
-- RLS POLICIES - COMMISSION_ROLES
-- =====================================================
CREATE POLICY "Commission roles viewable by anyone with commission access"
  ON public.commission_roles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Commission roles manageable by admins"
  ON public.commission_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.commissions c
      WHERE c.id = commission_roles.commission_id
      AND c.tenant_id = public.get_user_tenant(auth.uid())
      AND (
        public.has_role(auth.uid(), 'tenant_admin')
        OR public.has_role(auth.uid(), 'commission_admin')
      )
    )
  );

-- =====================================================
-- RLS POLICIES - BALLOTS
-- =====================================================
CREATE POLICY "Ballots insertable by participants"
  ON public.ballots FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Ballots viewable by admins"
  ON public.ballots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.commissions c
      WHERE c.id = ballots.commission_id
      AND c.tenant_id = public.get_user_tenant(auth.uid())
      AND (
        public.has_role(auth.uid(), 'tenant_admin')
        OR public.has_role(auth.uid(), 'commission_admin')
      )
    )
  );

-- =====================================================
-- RLS POLICIES - VOTES
-- =====================================================
CREATE POLICY "Votes insertable by participants"
  ON public.votes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Votes viewable by admins"
  ON public.votes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ballots b
      JOIN public.commissions c ON c.id = b.commission_id
      WHERE b.id = votes.ballot_id
      AND c.tenant_id = public.get_user_tenant(auth.uid())
      AND (
        public.has_role(auth.uid(), 'tenant_admin')
        OR public.has_role(auth.uid(), 'commission_admin')
      )
    )
  );

-- =====================================================
-- RLS POLICIES - AUDIT_LOG
-- =====================================================
CREATE POLICY "Audit logs viewable by tenant admins"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant(auth.uid())
    AND public.has_role(auth.uid(), 'tenant_admin')
  );

CREATE POLICY "Audit logs insertable by admins"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant(auth.uid())
    AND (
      public.has_role(auth.uid(), 'tenant_admin')
      OR public.has_role(auth.uid(), 'commission_admin')
    )
  );

-- =====================================================
-- RLS POLICIES - SHORT_LINKS
-- =====================================================
CREATE POLICY "Short links viewable by anyone"
  ON public.short_links FOR SELECT
  TO anon, authenticated
  USING (expires_at IS NULL OR expires_at > NOW());

CREATE POLICY "Short links manageable by admins"
  ON public.short_links FOR ALL
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant(auth.uid())
    AND (
      public.has_role(auth.uid(), 'tenant_admin')
      OR public.has_role(auth.uid(), 'commission_admin')
    )
  );