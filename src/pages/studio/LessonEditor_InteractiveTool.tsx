import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QuizEditor } from "@/components/studio/QuizEditor";

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
            <SelectItem value="custom_embed">📦 Embed Personnalisé (iframe)</SelectItem>
            <SelectItem value="rich_content">📝 Contenu Enrichi</SelectItem>
            <SelectItem value="quiz">❓ Quiz Interactif</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
          <Label>Contenu HTML</Label>
          <Textarea
            rows={12}
            placeholder="<h2>Titre</h2><p>Contenu...</p>"
            value={toolConfig.html_content || ""}
            onChange={(e) =>
              onChange(toolId, { ...toolConfig, html_content: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            Rich text editor (TipTap/Lexical) à implémenter plus tard
          </p>
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
