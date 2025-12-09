-- Ajouter la colonne bonus_credits manquante à la table ai_credits
ALTER TABLE ai_credits ADD COLUMN IF NOT EXISTS bonus_credits INTEGER NOT NULL DEFAULT 0;