import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QuizEditor } from "@/components/studio/QuizEditor";
import { AIToolBuilder } from "@/components/studio/AIToolBuilder";
import { RichTextEditor } from "@/components/studio/RichTextEditor";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Code, Plus, Library, Sparkles, FileCode, HelpCircle, FileText, ExternalLink, Loader2, Save, Trash2, Pencil, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { InteractiveToolContainer } from "@/components/learning/InteractiveToolContainer";

interface InteractiveToolEditorProps {
  toolId: string | null;
  toolConfig: any;
  organizationId?: string;
  lessonId?: string;
  lessonContext?: {
    title?: string;
    objective?: string;
    content?: string;
  };
  courseContext?: {
    title?: string;
    description?: string;
    specialty?: string;
  };
  onChange: (toolId: string | null, toolConfig: any) => void;
}

const TOOL_TYPES = [
  { id: "ai_tool", label: "🤖 Outil IA", icon: Sparkles, description: "Généré par IA" },
  { id: "custom_code", label: "💻 Code Personnalisé", icon: FileCode, description: "HTML/CSS/JS" },
  { id: "quiz", label: "❓ Quiz", icon: HelpCircle, description: "Quiz interactif" },
  { id: "custom_embed", label: "📦 Embed", icon: ExternalLink, description: "iframe externe" },
  { id: "rich_content", label: "📝 Contenu Enrichi", icon: FileText, description: "Texte formaté" },
];

// Helper function to compare configs robustly
const areConfigsEqual = (config1: any, config2: any): boolean => {
  try {
    const normalize = (obj: any): string => {
      if (obj === null || obj === undefined) return "";
      return JSON.stringify(obj, Object.keys(obj).sort());
    };
    return normalize(config1) === normalize(config2);
  } catch {
    return false;
  }
};

export function InteractiveToolEditor({ toolId, toolConfig, organizationId, lessonId, lessonContext, courseContext, onChange }: InteractiveToolEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [mode, setMode] = useState<"library" | "create" | "edit">("library");
  const [newToolType, setNewToolType] = useState<string>("ai_tool");
  const [newToolConfig, setNewToolConfig] = useState<any>({});
  const [newToolName, setNewToolName] = useState("");
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [previewToolId, setPreviewToolId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch existing tools from library (filtered by lesson)
  const { data: tools, isLoading: toolsLoading } = useQuery({
    queryKey: ["interactive-tools", organizationId, lessonId],
    queryFn: async () => {
      if (!organizationId || !lessonId) return [];
      const { data, error } = await supabase
        .from("interactive_tools")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId && !!lessonId,
  });

  // Save tool to library (specific to lesson)
  const saveToolMutation = useMutation({
    mutationFn: async ({ name, type, config }: { name: string; type: string; config: any }) => {
      if (!organizationId) throw new Error("Organization ID required");
      if (!lessonId) throw new Error("Lesson ID required");
      const { data, error } = await supabase
        .from("interactive_tools")
        .insert({
          organization_id: organizationId,
          lesson_id: lessonId,
          name,
          tool_type: type,
          config,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["interactive-tools", organizationId, lessonId] });
      toast.success("Outil sauvegardé");
      // Select the newly created tool
      onChange(data.tool_type, data.config);
      setMode("library");
      resetForm();
    },
    onError: () => {
      toast.error("Erreur lors de la sauvegarde");
    },
  });

  // Update tool in library
  const updateToolMutation = useMutation({
    mutationFn: async ({ id, name, config }: { id: string; name: string; config: any }) => {
      const { data, error } = await supabase
        .from("interactive_tools")
        .update({ name, config })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["interactive-tools", organizationId, lessonId] });
      toast.success("Outil mis à jour");
      onChange(data.tool_type, data.config);
      setMode("library");
      resetForm();
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  // Delete tool from library
  const deleteToolMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("interactive_tools")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactive-tools", organizationId, lessonId] });
      toast.success("Outil supprimé");
    },
  });

  const resetForm = () => {
    setNewToolType("ai_tool");
    setNewToolConfig({});
    setNewToolName("");
    setEditingToolId(null);
  };

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case "custom_embed":
        return { embed_url: "", embed_type: "iframe" };
      case "rich_content":
        return { html_content: "", attachments: [] };
      case "quiz":
        return { questions: [] };
      case "ai_tool":
        return { description: "", generatedCode: "", generatedAt: "" };
      case "custom_code":
        return { htmlCode: "" };
      default:
        return {};
    }
  };

  const handleSelectFromLibrary = (tool: any) => {
    onChange(tool.tool_type, tool.config);
  };

  const handleEditFromLibrary = (tool: any) => {
    setMode("edit");
    setEditingToolId(tool.id);
    setNewToolType(tool.tool_type);
    setNewToolConfig(tool.config);
    setNewToolName(tool.name);
  };

  const handleSaveNew = () => {
    if (!newToolName.trim()) {
      toast.error("Veuillez entrer un nom pour l'outil");
      return;
    }
    if (!hasValidConfig()) {
      toast.error("Configurez d'abord l'outil");
      return;
    }
    saveToolMutation.mutate({
      name: newToolName,
      type: newToolType,
      config: newToolConfig,
    });
  };

  const handleUpdateExisting = () => {
    if (!editingToolId || !newToolName.trim()) {
      toast.error("Veuillez entrer un nom pour l'outil");
      return;
    }
    updateToolMutation.mutate({
      id: editingToolId,
      name: newToolName,
      config: newToolConfig,
    });
  };

  const hasValidConfig = () => {
    return (
      newToolConfig.htmlCode ||
      newToolConfig.generatedCode ||
      newToolConfig.embed_url ||
      newToolConfig.html_content ||
      (newToolConfig.questions && newToolConfig.questions.length > 0)
    );
  };

  const getToolIcon = (type: string) => {
    const tool = TOOL_TYPES.find(t => t.id === type);
    return tool?.icon || FileCode;
  };

  // Auto-update lesson's tool when editing
  useEffect(() => {
    if (mode === "edit" && editingToolId) {
      onChange(newToolType, newToolConfig);
    }
  }, [newToolConfig]);

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "library" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setMode("library");
            resetForm();
          }}
          className="gap-2"
        >
          <Library className="h-4 w-4" />
          Bibliothèque
        </Button>
        <Button
          type="button"
          variant={mode === "create" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setMode("create");
            resetForm();
            setNewToolType("ai_tool");
            setNewToolConfig(getDefaultConfig("ai_tool"));
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Créer un outil
        </Button>
        {mode === "edit" && (
          <Button
            type="button"
            variant="default"
            size="sm"
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Édition
          </Button>
        )}
      </div>

      {/* Library Mode */}
      {mode === "library" && (
        <div className="space-y-4">
          {toolsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tools && tools.length > 0 ? (
            <div className="grid gap-3">
              {tools.map((tool) => {
                const IconComponent = getToolIcon(tool.tool_type);
                const isSelected = toolConfig && areConfigsEqual(toolConfig, tool.config);
                return (
                  <Card
                    key={tool.id}
                    className={`transition-all hover:shadow-md ${
                      isSelected ? "ring-2 ring-primary border-primary" : ""
                    }`}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div 
                        className="flex-1 flex items-center gap-4 cursor-pointer"
                        onClick={() => handleSelectFromLibrary(tool)}
                      >
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{tool.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {TOOL_TYPES.find(t => t.id === tool.tool_type)?.label || tool.tool_type}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          Sélectionné
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewToolId(previewToolId === tool.id ? null : tool.id);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {previewToolId === tool.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditFromLibrary(tool);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteToolMutation.mutate(tool.id);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                    
                    {/* Preview panel */}
                    {previewToolId === tool.id && (
                      <div className="border-t p-4 bg-muted/30">
                        <p className="text-sm font-medium mb-3">Aperçu de l'outil</p>
                        <div className="border rounded-lg p-4 bg-background min-h-[200px]">
                          <InteractiveToolContainer
                            lessonId=""
                            toolId={tool.tool_type}
                            toolConfig={tool.config}
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Library className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">
                  Aucun outil dans votre bibliothèque
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode("create")}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Créer votre premier outil
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Current tool preview if selected but not in library */}
          {toolId && toolConfig && !tools?.some(t => areConfigsEqual(t.config, toolConfig)) && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Outil actuellement configuré (non sauvegardé)</p>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      onChange(null, {});
                      toast.success("Outil supprimé de la leçon");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                  <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="gap-2">
                        <Save className="h-4 w-4" />
                        Sauvegarder
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Sauvegarder l'outil</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Nom de l'outil</Label>
                          <Input
                            placeholder="Ex: Calculateur de calories, Quiz module 1..."
                            value={newToolName}
                            onChange={(e) => setNewToolName(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline">Annuler</Button>
                        </DialogClose>
                        <Button
                          type="button"
                          onClick={() => {
                            if (!newToolName.trim()) {
                              toast.error("Veuillez entrer un nom pour l'outil");
                              return;
                            }
                            saveToolMutation.mutate({
                              name: newToolName,
                              type: toolId,
                              config: toolConfig,
                            }, {
                              onSuccess: () => {
                                setSaveDialogOpen(false);
                                setNewToolName("");
                              }
                            });
                          }}
                          disabled={saveToolMutation.isPending}
                        >
                          {saveToolMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                          Sauvegarder
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Type: {TOOL_TYPES.find(t => t.id === toolId)?.label || toolId}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create Mode */}
      {mode === "create" && (
        <div className="space-y-4">
          <div>
            <Label>Nom de l'outil *</Label>
            <Input
              placeholder="Ex: Calculateur de calories, Quiz module 1..."
              value={newToolName}
              onChange={(e) => setNewToolName(e.target.value)}
              className="mb-4"
            />
          </div>

          <div>
            <Label>Type d'outil</Label>
            <Select
              value={newToolType}
              onValueChange={(v) => {
                setNewToolType(v);
                setNewToolConfig(getDefaultConfig(v));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {TOOL_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tool-specific editors */}
          <ToolConfigEditor
            toolType={newToolType}
            config={newToolConfig}
            onChange={(config) => {
              setNewToolConfig(config);
              onChange(newToolType, config);
            }}
            organizationId={organizationId}
            lessonContext={lessonContext}
            courseContext={courseContext}
          />

          {/* Save & Return buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="default"
              onClick={handleSaveNew}
              disabled={saveToolMutation.isPending || !newToolName.trim()}
              className="gap-2"
            >
              {saveToolMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Sauvegarder
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMode("library");
                resetForm();
              }}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {mode === "edit" && (
        <div className="space-y-4">
          <div>
            <Label>Nom de l'outil *</Label>
            <Input
              placeholder="Ex: Calculateur de calories, Quiz module 1..."
              value={newToolName}
              onChange={(e) => setNewToolName(e.target.value)}
              className="mb-4"
            />
          </div>

          <div>
            <Label>Type d'outil</Label>
            <Input
              value={TOOL_TYPES.find(t => t.id === newToolType)?.label || newToolType}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Le type ne peut pas être modifié
            </p>
          </div>

          {/* Tool-specific editors */}
          <ToolConfigEditor
            toolType={newToolType}
            config={newToolConfig}
            onChange={(config) => {
              setNewToolConfig(config);
              onChange(newToolType, config);
            }}
            organizationId={organizationId}
            lessonContext={lessonContext}
            courseContext={courseContext}
          />

          {/* Update & Return buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="default"
              onClick={handleUpdateExisting}
              disabled={updateToolMutation.isPending || !newToolName.trim()}
              className="gap-2"
            >
              {updateToolMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Mettre à jour
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMode("library");
                resetForm();
              }}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Centralized Tool Config Editor
function ToolConfigEditor({ 
  toolType, 
  config, 
  onChange,
  organizationId,
  lessonContext,
  courseContext
}: { 
  toolType: string; 
  config: any; 
  onChange: (config: any) => void;
  organizationId?: string;
  lessonContext?: {
    title?: string;
    objective?: string;
    content?: string;
  };
  courseContext?: {
    title?: string;
    description?: string;
    specialty?: string;
  };
}) {
  const [showPreview, setShowPreview] = useState(false);

  switch (toolType) {
    case "ai_tool":
      return (
        <AIToolBuilder
          toolConfig={config}
          onChange={onChange}
          organizationId={organizationId}
          lessonContext={lessonContext}
          courseContext={courseContext}
        />
      );

    case "custom_code":
      return (
        <CustomCodeEditor
          config={config}
          onChange={onChange}
        />
      );

    case "custom_embed":
      return (
        <div>
          <Label>URL à intégrer</Label>
          <Input
            type="url"
            placeholder="https://notion.so/... ou typeform.com/..."
            value={config.embed_url || ""}
            onChange={(e) => onChange({ ...config, embed_url: e.target.value })}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Supporte Notion, Typeform, Google Forms, Loom, etc.
          </p>
        </div>
      );

    case "rich_content":
      return (
        <div>
          <Label>Contenu enrichi</Label>
          <RichTextEditor
            content={config.html_content || ""}
            onChange={(html) => onChange({ ...config, html_content: html })}
            placeholder="Écrivez votre contenu enrichi..."
          />
        </div>
      );

    case "quiz":
      return (
        <QuizEditor
          config={config}
          onChange={onChange}
        />
      );

    default:
      return null;
  }
}

// Custom Code Editor component
function CustomCodeEditor({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <Label>Code HTML/CSS/JS</Label>
        <Textarea
          className="font-mono text-sm min-h-[300px]"
          placeholder="Collez votre code HTML complet ici (incluant <style> et <script>)..."
          value={config.htmlCode || ""}
          onChange={(e) => onChange({ ...config, htmlCode: e.target.value })}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Collez du code HTML autonome avec CSS et JavaScript intégrés.
        </p>
      </div>

      {config.htmlCode && (
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
                srcDoc={config.htmlCode}
                className="w-full min-h-[400px] border-0"
                sandbox="allow-scripts allow-forms"
                title="Aperçu du code personnalisé"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
