import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ModuleAccordion } from "@/components/studio/ModuleAccordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";

export default function CourseBuilder() {
  const { slug, courseId } = useParams<{ slug: string; courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["modules", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select(`
          *,
          lessons(*)
        `)
        .eq("course_id", courseId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data.map((m) => ({
        ...m,
        lessons: m.lessons?.sort((a: any, b: any) => a.position - b.position) || [],
      }));
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase.from("modules").insert({
        course_id: courseId,
        title,
        position: modules.length,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
      toast({ title: "Module créé" });
      setModuleDialogOpen(false);
      setModuleTitle("");
    },
  });

  const updateModulePositionsMutation = useMutation({
    mutationFn: async (reorderedModules: any[]) => {
      const updates = reorderedModules.map((module, index) => ({
        id: module.id,
        position: index,
      }));

      for (const update of updates) {
        await supabase
          .from("modules")
          .update({ position: update.position })
          .eq("id", update.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async (isPublished: boolean) => {
      const { error } = await supabase
        .from("courses")
        .update({ is_published: isPublished })
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      toast({ title: course?.is_published ? "Formation dépubliée" : "Formation publiée" });
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = modules.findIndex((m) => m.id === active.id);
      const newIndex = modules.findIndex((m) => m.id === over.id);

      const reordered = arrayMove(modules, oldIndex, newIndex);
      updateModulePositionsMutation.mutate(reordered);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/school/${slug}/studio/courses`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{course?.title}</h2>
            <p className="text-muted-foreground">Constructeur de cours</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={course?.is_published}
              onCheckedChange={(checked) => togglePublishMutation.mutate(checked)}
            />
            <Label>Publié</Label>
          </div>
          <Button variant="outline">
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Modules & Leçons</h3>
          <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Module
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un module</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createModuleMutation.mutate(moduleTitle);
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="module-title">Titre du module</Label>
                  <Input
                    id="module-title"
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Créer
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {modules.map((module) => (
                <ModuleAccordion key={module.id} module={module} courseId={courseId!} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {modules.length === 0 && (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <p className="text-lg font-medium">Aucun module</p>
              <p className="text-sm text-muted-foreground">
                Créez votre premier module pour commencer
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
