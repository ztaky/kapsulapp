-- Create platform_settings table for SaaS-level configuration
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage platform settings
CREATE POLICY "Super admins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Anyone can read platform settings (for public legal pages)
CREATE POLICY "Anyone can read platform settings"
ON public.platform_settings
FOR SELECT
USING (true);

-- Insert default legal page placeholders
INSERT INTO public.platform_settings (key, value) VALUES
('legal_mentions', '{"title": "Mentions Légales", "content": "# Mentions Légales\n\nCette page est en cours de rédaction.\n\nPour toute question, contactez-nous à : contact@kapsul.io\n\n## Éditeur du site\n\n[Nom de la société]\n[Adresse]\n[Email]\n[Téléphone]\n\n## Hébergement\n\n[Nom de l''hébergeur]\n[Adresse]\n\n## Propriété intellectuelle\n\nL''ensemble du contenu de ce site est protégé par le droit d''auteur.\n\n*Dernière mise à jour : [Date]*"}'),
('privacy_policy', '{"title": "Politique de Confidentialité", "content": "# Politique de Confidentialité\n\nCette page est en cours de rédaction.\n\n## Collecte des données\n\nNous collectons les données suivantes :\n- Email\n- Nom\n- Données de navigation\n\n## Utilisation des données\n\nVos données sont utilisées pour :\n- Fournir nos services\n- Améliorer l''expérience utilisateur\n- Communiquer avec vous\n\n## Vos droits\n\nConformément au RGPD, vous disposez des droits suivants :\n- Droit d''accès\n- Droit de rectification\n- Droit à l''effacement\n- Droit à la portabilité\n\nContact : contact@kapsul.io\n\n*Dernière mise à jour : [Date]*"}'),
('terms_of_service', '{"title": "Conditions Générales de Vente", "content": "# Conditions Générales de Vente\n\nCette page est en cours de rédaction.\n\n## Article 1 - Objet\n\nLes présentes CGV régissent les ventes de services sur la plateforme Kapsul.\n\n## Article 2 - Prix\n\nLes prix sont indiqués en euros TTC.\n\n## Article 3 - Paiement\n\nLe paiement s''effectue par carte bancaire via Stripe.\n\n## Article 4 - Rétractation\n\nConformément à l''article L221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les contenus numériques.\n\n## Article 5 - Contact\n\ncontact@kapsul.io\n\n*Dernière mise à jour : [Date]*"}'),
('cookie_policy', '{"title": "Politique des Cookies", "content": "# Politique des Cookies\n\n## Qu''est-ce qu''un cookie ?\n\nUn cookie est un petit fichier texte déposé sur votre appareil.\n\n## Cookies utilisés\n\n### Cookies essentiels\n- Session utilisateur\n- Préférences de consentement\n\n### Cookies analytiques (avec consentement)\n- Google Analytics via GTM\n- Mesure d''audience\n\n### Cookies marketing (avec consentement)\n- Facebook Pixel\n- Remarketing\n\n## Gérer vos préférences\n\nVous pouvez modifier vos préférences à tout moment via le bandeau cookies.\n\n## Contact\n\ncontact@kapsul.io\n\n*Dernière mise à jour : [Date]*"}'),
('tracking', '{"gtm_container_id": "", "facebook_pixel_id": ""}');

-- Add tracking columns to organizations for coaches
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT,
ADD COLUMN IF NOT EXISTS gtm_container_id TEXT;

-- Add 'cookies' to legal_page_type enum
ALTER TYPE public.legal_page_type ADD VALUE IF NOT EXISTS 'cookies';