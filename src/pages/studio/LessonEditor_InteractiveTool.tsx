import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QuizEditor } from "@/components/studio/QuizEditor";
import { AIToolBuilder } from "@/components/studio/AIToolBuilder";
import { RichTextEditor } from "@/components/studio/RichTextEditor";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Code } from "lucide-react";

interface InteractiveToolEditorProps {
  toolId: string | null;
  toolConfig: any;
  onChange: (toolId: string | null, toolConfig: any) => void;
}

export function InteractiveToolEditor({ toolId, toolConfig, onChange }: InteractiveToolEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

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
      case "custom_code":
        return { htmlCode: "", title: "" };
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
            <SelectItem value="custom_code">💻 Code Personnalisé (HTML/CSS/JS)</SelectItem>
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

      {toolId === "custom_code" && (
        <div className="space-y-4">
          <div>
            <Label>Titre de l'outil (optionnel)</Label>
            <Input
              placeholder="Ex: Calculateur de calories, Quiz interactif..."
              value={toolConfig.title || ""}
              onChange={(e) =>
                onChange(toolId, { ...toolConfig, title: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Code HTML/CSS/JS</Label>
            <Textarea
              className="font-mono text-sm min-h-[300px]"
              placeholder="Collez votre code HTML complet ici (incluant <style> et <script>)..."
              value={toolConfig.htmlCode || ""}
              onChange={(e) =>
                onChange(toolId, { ...toolConfig, htmlCode: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Collez du code HTML autonome avec CSS et JavaScript intégrés. Le code sera affiché dans une iframe sandboxée.
            </p>
          </div>
          
          {toolConfig.htmlCode && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? "Masquer l'aperçu" : "Voir l'aperçu"}
              </Button>
              
              {showPreview && (
                <div className="border rounded-lg overflow-hidden bg-white">
                  <div className="bg-muted px-3 py-2 text-xs font-medium flex items-center gap-2 border-b">
                    <Code className="h-3 w-3" />
                    Aperçu du code personnalisé
                  </div>
                  <iframe
                    srcDoc={toolConfig.htmlCode}
                    className="w-full min-h-[400px] border-0"
                    sandbox="allow-scripts allow-forms"
                    title="Aperçu du code personnalisé"
                  />
                </div>
              )}
            </div>
          )}
        </div>
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