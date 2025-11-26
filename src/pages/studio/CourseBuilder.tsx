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
    <div className="space-y-8 animate-fade-in">
      {/* Header - Premium Style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/50 p-10 border border-slate-100 shadow-premium">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/school/${slug}/studio/courses`)} className="hover:bg-orange-50">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight mb-1">
                {course?.title}
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                Constructeur de cours
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-200">
              <Switch
                checked={course?.is_published}
                onCheckedChange={(checked) => togglePublishMutation.mutate(checked)}
              />
              <Label className="text-sm font-medium text-slate-900">Publié</Label>
            </div>
            <Button variant="gradient" size="lg" className="shadow-lg">
              <Save className="mr-2 h-5 w-5" />
              Sauvegarder
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#1e293b] tracking-tight">Modules & Leçons</h3>
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
          <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 border-dashed bg-white/50">
            <div className="text-center">
              <p className="text-lg font-medium text-slate-900">Aucun module</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Créez votre premier module pour commencer
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
