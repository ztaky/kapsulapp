-- Add tool_id and tool_config columns for interactive lessons
ALTER TABLE lessons ADD COLUMN tool_id TEXT;
ALTER TABLE lessons ADD COLUMN tool_config JSONB DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN lessons.tool_id IS 'Type of interactive tool: custom_embed, rich_content, quiz';
COMMENT ON COLUMN lessons.tool_config IS 'JSON configuration for the interactive tool';

-- tool_config structure examples:
-- custom_embed: { "embed_url": "https://...", "embed_type": "iframe" }
-- rich_content: { "html_content": "<p>...</p>", "attachments": [...] }
-- quiz: { "title": "...", "questions": [{ "question": "...", "answers": [...], "correct": 0, "explanation": "..." }] }