-- Add installment payment columns to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS installments_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS installments_count integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS installment_price_id text;

-- Add constraint for installments_count
ALTER TABLE public.courses 
ADD CONSTRAINT installments_count_check 
CHECK (installments_count >= 2 AND installments_count <= 12);