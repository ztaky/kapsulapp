-- Create interactive_tools table for reusable tools library
CREATE TABLE public.interactive_tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  tool_type TEXT NOT NULL CHECK (tool_type IN ('ai_tool', 'custom_code', 'quiz', 'custom_embed', 'rich_content')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interactive_tools ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their org's tools
CREATE POLICY "Coaches can manage their org tools"
ON public.interactive_tools
FOR ALL
USING (has_org_role(auth.uid(), organization_id, 'coach'::org_role));

-- Super admins can manage all tools
CREATE POLICY "Super admins can manage all tools"
ON public.interactive_tools
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_interactive_tools_updated_at
  BEFORE UPDATE ON public.interactive_tools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_interactive_tools_org ON public.interactive_tools(organization_id);
CREATE INDEX idx_interactive_tools_type ON public.interactive_tools(tool_type);