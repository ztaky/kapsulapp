import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { InteractiveToolEditor } from "./LessonEditor_InteractiveTool";
import { RichTextEditor } from "@/components/studio/RichTextEditor";
import { LessonResourcesManager, Resource } from "@/components/studio/LessonResourcesManager";

export default function LessonEditor() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<{
    title: string;
    content_text: string;
    video_url: string;
    resources: Resource[];
    type: "video" | "interactive_tool";
    tool_id: string | null;
    tool_config: any;
  }>({
    title: "",
    content_text: "",
    video_url: "",
    resources: [],
    type: "video",
    tool_id: null,
    tool_config: {},
  });

  const { data: lesson } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select(`
          *,
          modules!inner(
            id,
            course_id
          )
        `)
        .eq("id", lessonId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (lesson) {
      // Parse resources from JSONB
      let parsedResources: Resource[] = [];
      if ((lesson as any).resources) {
        try {
          parsedResources = typeof (lesson as any).resources === 'string' 
            ? JSON.parse((lesson as any).resources) 
            : (lesson as any).resources;
        } catch (e) {
          parsedResources = [];
        }
      }
      
      setFormData({
        title: lesson.title,
        content_text: lesson.content_text || "",
        video_url: lesson.video_url || "",
        resources: parsedResources,
        type: lesson.type,
        tool_id: (lesson as any).tool_id || null,
        tool_config: (lesson as any).tool_config || {},
      });
    }
  }, [lesson]);

  const updateLessonMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("lessons")
        .update({
          title: data.title,
          content_text: data.content_text,
          video_url: data.video_url,
          resources: data.resources as any,
          type: data.type,
          tool_id: data.tool_id,
          tool_config: data.tool_config,
        })
        .eq("id", lessonId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] });
      toast({ title: "Leçon sauvegardée" });
    },
  });

  const handleSave = () => {
    updateLessonMutation.mutate(formData);
  };

  const handleBack = () => {
    if (lesson?.modules) {
      navigate(`/school/${slug}/studio/courses/${lesson.modules.course_id}/curriculum`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header - Premium Style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/50 p-10 border border-slate-100 shadow-premium">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack} className="hover:bg-orange-50">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight mb-1">
                Éditeur de Leçon
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                {formData.title || "Nouvelle leçon"}
              </p>
            </div>
          </div>

          <Button onClick={handleSave} variant="gradient" size="lg" className="shadow-lg">
            <Save className="mr-2 h-5 w-5" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4 rounded-3xl border border-slate-100 shadow-premium bg-white p-8">
            <div>
              <Label htmlFor="title">Titre de la leçon</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <Tabs
              value={formData.type === "video" && formData.content_text && !formData.video_url ? "text" : formData.type}
              onValueChange={(v) => {
                // "text" is not a real type, it's just a UI tab - we save as "video" with content_text
                if (v === "text") {
                  setFormData({ ...formData, type: "video" });
                } else {
                  setFormData({ ...formData, type: v as "video" | "interactive_tool" });
                }
              }}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="video">Vidéo</TabsTrigger>
                <TabsTrigger value="text">Texte</TabsTrigger>
                <TabsTrigger value="interactive_tool">Outil Interactif</TabsTrigger>
              </TabsList>

              <TabsContent value="video" className="space-y-4">
                <div>
                  <Label htmlFor="video_url">URL de la vidéo</Label>
                  <Input
                    id="video_url"
                    type="url"
                    placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supporte YouTube, Vimeo, et liens directs
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-4">
                <div>
                  <Label htmlFor="content_text">Contenu textuel</Label>
                  <RichTextEditor
                    content={formData.content_text}
                    onChange={(content) => setFormData({ ...formData, content_text: content })}
                    placeholder="Écrivez le contenu de votre leçon..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="interactive_tool" className="space-y-4">
                <InteractiveToolEditor
                  toolId={formData.tool_id}
                  toolConfig={formData.tool_config}
                  onChange={(toolId, toolConfig) =>
                    setFormData({ ...formData, tool_id: toolId, tool_config: toolConfig })
                  }
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-100 shadow-premium bg-white p-8 space-y-4">
            <h3 className="font-bold text-[#1e293b] text-lg tracking-tight">Paramètres</h3>
            
            <LessonResourcesManager
              resources={formData.resources}
              onChange={(resources) => setFormData({ ...formData, resources })}
              lessonId={lessonId}
            />

            <div className="flex items-center justify-between pt-4 border-t">
              <Label htmlFor="free_preview">Aperçu gratuit</Label>
              <Switch id="free_preview" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
