-- Add marketing_content JSONB column to courses table
ALTER TABLE courses ADD COLUMN marketing_content JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN courses.marketing_content IS 'Marketing content for the sales page in JSON format: { headline, subheadline, video_url, pain_points: [], benefits: [], author_bio, faq: [] }';
