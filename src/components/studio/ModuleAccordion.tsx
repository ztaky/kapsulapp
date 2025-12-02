import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GripVertical, Plus, Edit, Copy, Video, FileText, Loader2, Trash2, MoveRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DndContext, closestCenter } from "@dnd-kit/core";

interface Lesson {
  id: string;
  title: string;
  type: string;
  position: number;
  objective?: string;
}

interface Module {
  id: string;
  title: string;
  position: number;
  objective?: string;
  lessons: Lesson[];
}

interface ModuleAccordionProps {
  module: Module;
  courseId: string;
  allModules?: Module[];
}

function LessonItem({ lesson, moduleId, courseId, totalLessons, allModules }: { lesson: Lesson; moduleId: string; courseId: string; totalLessons: number; allModules?: Module[] }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const duplicateLessonMutation = useMutation({
    mutationFn: async () => {
      const { data: fullLesson, error: fetchError } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", lesson.id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase.from("lessons").insert({
        module_id: moduleId,
        title: `${fullLesson.title} - Copie`,
        position: totalLessons,
        type: fullLesson.type,
        content_text: fullLesson.content_text,
        video_url: fullLesson.video_url,
        resources: fullLesson.resources,
        tool_id: fullLesson.tool_id,
        tool_config: fullLesson.tool_config,
        objective: fullLesson.objective,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
      toast({ title: "Leçon dupliquée" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la duplication", variant: "destructive" });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", lesson.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
      toast({ title: "Leçon supprimée" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  const moveLessonMutation = useMutation({
    mutationFn: async (targetModuleId: string) => {
      // Get the target module's lessons count for position
      const targetModule = allModules?.find(m => m.id === targetModuleId);
      const newPosition = targetModule?.lessons.length || 0;

      const { error } = await supabase
        .from("lessons")
        .update({ module_id: targetModuleId, position: newPosition })
        .eq("id", lesson.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
      toast({ title: "Leçon déplacée" });
    },
    onError: () => {
      toast({ title: "Erreur lors du déplacement", variant: "destructive" });
    },
  });

  const otherModules = allModules?.filter(m => m.id !== moduleId) || [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:bg-orange-50/30 hover:border-orange-200/50 transition-all"
    >
      <div {...attributes} {...listeners} className="cursor-grab hover:text-orange-600 transition-colors">
        <GripVertical className="h-4 w-4 text-slate-400" />
      </div>
      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-orange-100 text-orange-600">
        {lesson.type === "video" ? (
          <Video className="h-4 w-4" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
      </div>
      <span className="flex-1 text-sm font-medium text-slate-900">{lesson.title}</span>
      <div className="flex items-center gap-1 ml-auto">
      {otherModules.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-blue-100 hover:text-blue-700"
              title="Déplacer vers un autre module"
              disabled={moveLessonMutation.isPending}
            >
              {moveLessonMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoveRight className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {otherModules.map((m) => (
              <DropdownMenuItem
                key={m.id}
                onClick={() => moveLessonMutation.mutate(m.id)}
              >
                {m.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => duplicateLessonMutation.mutate()}
        disabled={duplicateLessonMutation.isPending}
        className="hover:bg-orange-100 hover:text-orange-700"
        title="Dupliquer la leçon"
      >
        {duplicateLessonMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/school/${slug}/studio/lessons/${lesson.id}`)}
        className="hover:bg-orange-100 hover:text-orange-700"
        title="Modifier la leçon"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-red-100 hover:text-red-700"
            title="Supprimer la leçon"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette leçon ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La leçon "{lesson.title}" sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLessonMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLessonMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}

interface ModuleAccordionExtendedProps extends ModuleAccordionProps {
  isDefaultOpen?: boolean;
  onModuleChange?: (moduleId: string) => void;
}

export function ModuleAccordion({ module, courseId, allModules, isDefaultOpen, onModuleChange }: ModuleAccordionExtendedProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: module.id });
  const queryClient = useQueryClient();
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(module.title);
  const [editObjective, setEditObjective] = useState(module.objective || "");
  const [accordionValue, setAccordionValue] = useState<string | undefined>(isDefaultOpen ? module.id : undefined);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const updateModuleMutation = useMutation({
    mutationFn: async ({ title, objective }: { title: string; objective: string }) => {
      const { error } = await supabase
        .from("modules")
        .update({ title, objective: objective || null })
        .eq("id", module.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
      toast({ title: "Module mis à jour" });
      setEditDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async () => {
      // Delete all lessons first
      const { error: lessonsError } = await supabase
        .from("lessons")
        .delete()
        .eq("module_id", module.id);

      if (lessonsError) throw lessonsError;

      // Then delete the module
      const { error: moduleError } = await supabase
        .from("modules")
        .delete()
        .eq("id", module.id);

      if (moduleError) throw moduleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
      toast({ title: "Module supprimé" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  const duplicateModuleMutation = useMutation({
    mutationFn: async () => {
      // Get total modules count for position
      const { data: allModules } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", courseId);

      const newPosition = allModules?.length || 0;

      // Create duplicated module
      const { data: newModule, error: moduleError } = await supabase
        .from("modules")
        .insert({
          course_id: courseId,
          title: `${module.title} - Copie`,
          objective: module.objective,
          position: newPosition,
        })
        .select()
        .single();

      if (moduleError) throw moduleError;

      // Duplicate all lessons
      if (module.lessons.length > 0) {
        const lessonsToInsert = module.lessons.map((lesson, index) => ({
          module_id: newModule.id,
          title: lesson.title,
          type: lesson.type as "video" | "interactive_tool",
          position: index,
          objective: lesson.objective,
        }));

        const { error: lessonsError } = await supabase
          .from("lessons")
          .insert(lessonsToInsert);

        if (lessonsError) throw lessonsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
      toast({ title: "Module dupliqué avec ses leçons" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la duplication", variant: "destructive" });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase.from("lessons").insert({
        module_id: module.id,
        title,
        position: module.lessons.length,
        type: "video",
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["course-modules", courseId] });
      toast({ title: "Leçon créée" });
      onModuleChange?.(module.id);
      setLessonDialogOpen(false);
      setLessonTitle("");
    },
  });

  const updateLessonPositionsMutation = useMutation({
    mutationFn: async (reorderedLessons: Lesson[]) => {
      const updates = reorderedLessons.map((lesson, index) => ({
        id: lesson.id,
        position: index,
      }));

      for (const update of updates) {
        await supabase
          .from("lessons")
          .update({ position: update.position })
          .eq("id", update.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
    },
  });

  const handleLessonDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = module.lessons.findIndex((l) => l.id === active.id);
      const newIndex = module.lessons.findIndex((l) => l.id === over.id);

      const reordered = arrayMove(module.lessons, oldIndex, newIndex);
      updateLessonPositionsMutation.mutate(reordered);
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Accordion type="single" collapsible value={accordionValue} onValueChange={setAccordionValue}>
        <AccordionItem value={module.id} className="border-none">
          <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white shadow-premium p-6 hover:border-orange-200/50 transition-all">
            <div {...attributes} {...listeners} className="cursor-grab hover:text-orange-600 transition-colors">
              <GripVertical className="h-5 w-5 text-slate-400" />
            </div>
            <AccordionTrigger className="flex-1 hover:no-underline px-3 py-2 [&>svg]:ml-4 [&>svg]:h-5 [&>svg]:w-5">
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1e293b] text-base tracking-tight">{module.title}</span>
                  <span className="text-sm text-slate-600 font-normal">
                    ({module.lessons.length} leçon{module.lessons.length > 1 ? "s" : ""})
                  </span>
                </div>
                {module.objective && (
                  <span className="text-xs text-slate-500 font-normal text-left">
                    🎯 {module.objective}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <div className="flex items-center gap-1 ml-auto">
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-orange-100 hover:text-orange-700"
                  title="Modifier le module"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modifier le module</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateModuleMutation.mutate({ title: editTitle, objective: editObjective });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="edit-module-title">Titre du module</Label>
                    <Input
                      id="edit-module-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-module-objective">Objectif (optionnel)</Label>
                    <Input
                      id="edit-module-objective"
                      value={editObjective}
                      onChange={(e) => setEditObjective(e.target.value)}
                      placeholder="Ex: Comprendre les fondamentaux"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={updateModuleMutation.isPending}>
                    {updateModuleMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Enregistrer
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => duplicateModuleMutation.mutate()}
              disabled={duplicateModuleMutation.isPending}
              className="hover:bg-orange-100 hover:text-orange-700"
              title="Dupliquer le module"
            >
              {duplicateModuleMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-red-100 hover:text-red-700"
                  title="Supprimer le module"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce module ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Le module "{module.title}" et ses {module.lessons.length} leçon{module.lessons.length > 1 ? "s" : ""} seront définitivement supprimés.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteModuleMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteModuleMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            </div>
          </div>
          <AccordionContent className="px-4 pt-4">
            <div className="space-y-2">
              <DndContext collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
                <SortableContext
                  items={module.lessons.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {module.lessons.map((lesson) => (
                    <LessonItem key={lesson.id} lesson={lesson} moduleId={module.id} courseId={courseId} totalLessons={module.lessons.length} allModules={allModules} />
                  ))}
                </SortableContext>
              </DndContext>

              <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full rounded-2xl border-slate-200 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle Leçon
                  </Button>
                </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                    <DialogTitle>Créer une leçon</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      createLessonMutation.mutate(lessonTitle);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="lesson-title">Titre de la leçon</Label>
                      <Input
                        id="lesson-title"
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={createLessonMutation.isPending}>
                      {createLessonMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Créer
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
