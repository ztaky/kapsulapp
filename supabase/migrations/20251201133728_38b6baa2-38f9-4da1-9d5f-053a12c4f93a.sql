-- Roadmap items table
CREATE TABLE IF NOT EXISTS roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  category TEXT,
  votes_count INTEGER NOT NULL DEFAULT 0,
  release_date DATE,
  position INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;

-- Public can view visible roadmap items
CREATE POLICY "Anyone can view visible roadmap items"
ON roadmap_items FOR SELECT
USING (is_visible = true);

-- Super admins can manage all roadmap items
CREATE POLICY "Super admins can manage all roadmap items"
ON roadmap_items FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_roadmap_items_updated_at
BEFORE UPDATE ON roadmap_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Pricing plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_credits_limit INTEGER,
  email_limit INTEGER,
  max_students INTEGER,
  max_courses INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_highlighted BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  badge_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

-- Public can view active pricing plans
CREATE POLICY "Anyone can view active pricing plans"
ON pricing_plans FOR SELECT
USING (is_active = true);

-- Super admins can manage all pricing plans
CREATE POLICY "Super admins can manage all pricing plans"
ON pricing_plans FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_pricing_plans_updated_at
BEFORE UPDATE ON pricing_plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default pricing plans
INSERT INTO pricing_plans (name, slug, description, price_monthly, price_yearly, features, ai_credits_limit, email_limit, max_students, is_highlighted, position, badge_text)
VALUES 
  ('Founder', 'founder', 'Accès à vie pour les premiers utilisateurs', 297, NULL, '["Accès à vie (paiement unique)", "5000 crédits IA / mois", "3000 emails / mois", "Étudiants illimités", "Landing pages illimitées", "Support prioritaire", "Badge Fondateur"]'::jsonb, 5000, 3000, NULL, true, 1, 'Offre limitée'),
  ('Pro', 'pro', 'Pour les coachs qui se lancent', 47, 470, '["5000 crédits IA / mois", "3000 emails / mois", "Étudiants illimités", "Landing pages illimitées", "Support standard"]'::jsonb, 5000, 3000, NULL, false, 2, NULL)
ON CONFLICT (slug) DO NOTHING;