import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { QuizEditor } from "@/components/studio/QuizEditor";
import { AIToolBuilder } from "@/components/studio/AIToolBuilder";
import { RichTextEditor } from "@/components/studio/RichTextEditor";

interface InteractiveToolEditorProps {
  toolId: string | null;
  toolConfig: any;
  onChange: (toolId: string | null, toolConfig: any) => void;
}

export function InteractiveToolEditor({ toolId, toolConfig, onChange }: InteractiveToolEditorProps) {
  const getDefaultConfig = (type: string) => {
    switch (type) {
      case "custom_embed":
        return { embed_url: "", embed_type: "iframe" };
      case "rich_content":
        return { html_content: "", attachments: [] };
      case "quiz":
        return { title: "", questions: [] };
      case "ai_tool":
        return { description: "", generatedCode: "", generatedAt: "" };
      default:
        return {};
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Type d'outil</Label>
        <Select
          value={toolId || ""}
          onValueChange={(v) => {
            onChange(v, getDefaultConfig(v));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un outil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ai_tool">🤖 Outil IA (Générateur)</SelectItem>
            <SelectItem value="quiz">❓ Quiz Interactif</SelectItem>
            <SelectItem value="custom_embed">📦 Embed Personnalisé (iframe)</SelectItem>
            <SelectItem value="rich_content">📝 Contenu Enrichi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {toolId === "ai_tool" && (
        <AIToolBuilder
          toolConfig={toolConfig}
          onChange={(newConfig) => onChange(toolId, newConfig)}
        />
      )}

      {toolId === "custom_embed" && (
        <div>
          <Label>URL à intégrer</Label>
          <Input
            type="url"
            placeholder="https://notion.so/... ou typeform.com/..."
            value={toolConfig.embed_url || ""}
            onChange={(e) =>
              onChange(toolId, { ...toolConfig, embed_url: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            Supporte Notion, Typeform, Google Forms, Loom, etc.
          </p>
        </div>
      )}

      {toolId === "rich_content" && (
        <div>
          <Label>Contenu enrichi</Label>
          <RichTextEditor
            content={toolConfig.html_content || ""}
            onChange={(html) =>
              onChange(toolId, { ...toolConfig, html_content: html })
            }
            placeholder="Écrivez votre contenu enrichi..."
          />
        </div>
      )}

      {toolId === "quiz" && (
        <QuizEditor
          config={toolConfig}
          onChange={(newConfig) => onChange(toolId, newConfig)}
        />
      )}
    </div>
  );
}