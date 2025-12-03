-- Add lesson_id column to interactive_tools to make tools lesson-specific
ALTER TABLE public.interactive_tools 
ADD COLUMN lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX idx_interactive_tools_lesson_id ON public.interactive_tools(lesson_id);

-- Update RLS policy to allow access based on lesson
DROP POLICY IF EXISTS "Users can view tools for their organization" ON public.interactive_tools;
DROP POLICY IF EXISTS "Users can manage tools for their organization" ON public.interactive_tools;

CREATE POLICY "Users can view tools for their organization or lesson"
ON public.interactive_tools FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage tools for their organization"
ON public.interactive_tools FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'coach'
  )
);

COMMENT ON COLUMN public.interactive_tools.lesson_id IS 'When set, the tool is specific to this lesson only';