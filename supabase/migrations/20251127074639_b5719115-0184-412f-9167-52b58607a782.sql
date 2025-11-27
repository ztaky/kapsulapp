-- Add payment_link_url to courses table
ALTER TABLE courses ADD COLUMN payment_link_url TEXT;

-- Add Stripe tracking fields to purchases table
ALTER TABLE purchases ADD COLUMN stripe_payment_id TEXT;
ALTER TABLE purchases ADD COLUMN stripe_session_id TEXT;

-- Create index for faster lookups by Stripe session
CREATE INDEX idx_purchases_stripe_session ON purchases(stripe_session_id);