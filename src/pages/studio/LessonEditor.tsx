import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function LessonEditor() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<{
    title: string;
    content_text: string;
    video_url: string;
    resource_url: string;
    type: "video" | "interactive_tool";
  }>({
    title: "",
    content_text: "",
    video_url: "",
    resource_url: "",
    type: "video",
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
      setFormData({
        title: lesson.title,
        content_text: lesson.content_text || "",
        video_url: lesson.video_url || "",
        resource_url: lesson.resource_url || "",
        type: lesson.type,
      });
    }
  }, [lesson]);

  const updateLessonMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("lessons")
        .update(data)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Éditeur de Leçon</h2>
            <p className="text-muted-foreground">{formData.title || "Nouvelle leçon"}</p>
          </div>
        </div>

        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Sauvegarder
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4 rounded-lg border p-6">
            <div>
              <Label htmlFor="title">Titre de la leçon</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <Tabs
              value={formData.type}
              onValueChange={(v) =>
                setFormData({ ...formData, type: v as "video" | "interactive_tool" })
              }
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
                  <Textarea
                    id="content_text"
                    rows={12}
                    placeholder="Écrivez le contenu de votre leçon..."
                    value={formData.content_text}
                    onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Rich text editor à venir
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="interactive_tool" className="space-y-4">
                <div>
                  <Label htmlFor="tool_type">Type d'outil</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un outil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prompt_generator">Générateur de Prompt</SelectItem>
                      <SelectItem value="calculator">Calculateur</SelectItem>
                      <SelectItem value="custom_embed">Embed Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Configuration avancée à venir
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border p-6 space-y-4">
            <h3 className="font-semibold">Paramètres</h3>
            
            <div>
              <Label htmlFor="resource_url">Ressource téléchargeable</Label>
              <Input
                id="resource_url"
                type="url"
                placeholder="https://..."
                value={formData.resource_url}
                onChange={(e) => setFormData({ ...formData, resource_url: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="free_preview">Aperçu gratuit</Label>
              <Switch id="free_preview" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
