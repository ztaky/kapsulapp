-- Enum for email types
CREATE TYPE public.email_type AS ENUM (
  'welcome_purchase',
  'invoice',
  'course_reminder',
  'new_content',
  'onboarding_day_1',
  'onboarding_day_3',
  'onboarding_day_7',
  'coach_welcome',
  'founder_welcome',
  'support_ticket_created',
  'support_ticket_reply',
  'support_ticket_status',
  'platform_update',
  'custom'
);

-- Enum for email send status
CREATE TYPE public.email_send_status AS ENUM (
  'pending',
  'sent',
  'failed',
  'opened',
  'clicked'
);

-- Enum for sequence trigger events
CREATE TYPE public.sequence_trigger_event AS ENUM (
  'purchase_completed',
  'student_signup',
  'course_completed',
  'manual'
);

-- Email templates table
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email_type email_type NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email sequences table
CREATE TABLE public.email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event sequence_trigger_event NOT NULL,
  trigger_course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email sequence steps table
CREATE TABLE public.email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES public.email_sequences(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE CASCADE NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 0,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email sends history table
CREATE TABLE public.email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  sequence_step_id UUID REFERENCES public.email_sequence_steps(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID,
  subject TEXT NOT NULL,
  status email_send_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sequence enrollments (track user progress in sequences)
CREATE TABLE public.sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES public.email_sequences(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  current_step INTEGER DEFAULT 0,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  next_email_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
CREATE POLICY "Coaches can manage their org templates"
ON public.email_templates FOR ALL
USING (organization_id IS NOT NULL AND has_org_role(auth.uid(), organization_id, 'coach'::org_role));

CREATE POLICY "Super admins can manage all templates"
ON public.email_templates FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Anyone can view default templates"
ON public.email_templates FOR SELECT
USING (organization_id IS NULL AND is_default = true);

-- RLS Policies for email_sequences
CREATE POLICY "Coaches can manage their org sequences"
ON public.email_sequences FOR ALL
USING (organization_id IS NOT NULL AND has_org_role(auth.uid(), organization_id, 'coach'::org_role));

CREATE POLICY "Super admins can manage all sequences"
ON public.email_sequences FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for email_sequence_steps
CREATE POLICY "Coaches can manage steps of their sequences"
ON public.email_sequence_steps FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.email_sequences es
  WHERE es.id = email_sequence_steps.sequence_id
  AND es.organization_id IS NOT NULL
  AND has_org_role(auth.uid(), es.organization_id, 'coach'::org_role)
));

CREATE POLICY "Super admins can manage all steps"
ON public.email_sequence_steps FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for email_sends
CREATE POLICY "Coaches can view their org email sends"
ON public.email_sends FOR SELECT
USING (organization_id IS NOT NULL AND has_org_role(auth.uid(), organization_id, 'coach'::org_role));

CREATE POLICY "Super admins can manage all email sends"
ON public.email_sends FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for sequence_enrollments
CREATE POLICY "Coaches can view their org enrollments"
ON public.sequence_enrollments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.email_sequences es
  WHERE es.id = sequence_enrollments.sequence_id
  AND es.organization_id IS NOT NULL
  AND has_org_role(auth.uid(), es.organization_id, 'coach'::org_role)
));

CREATE POLICY "Super admins can manage all enrollments"
ON public.sequence_enrollments FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Indexes for performance
CREATE INDEX idx_email_templates_org ON public.email_templates(organization_id);
CREATE INDEX idx_email_templates_type ON public.email_templates(email_type);
CREATE INDEX idx_email_sequences_org ON public.email_sequences(organization_id);
CREATE INDEX idx_email_sends_org ON public.email_sends(organization_id);
CREATE INDEX idx_email_sends_status ON public.email_sends(status);
CREATE INDEX idx_email_sends_created ON public.email_sends(created_at);
CREATE INDEX idx_sequence_enrollments_next ON public.sequence_enrollments(next_email_at) WHERE is_active = true;

-- Triggers for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_sequences_updated_at
  BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_sequence_steps_updated_at
  BEFORE UPDATE ON public.email_sequence_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sequence_enrollments_updated_at
  BEFORE UPDATE ON public.sequence_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();