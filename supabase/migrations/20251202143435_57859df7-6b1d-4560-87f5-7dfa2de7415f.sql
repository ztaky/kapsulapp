-- Add objective field to modules table
ALTER TABLE public.modules
ADD COLUMN objective text;

-- Add objective field to lessons table
ALTER TABLE public.lessons
ADD COLUMN objective text;