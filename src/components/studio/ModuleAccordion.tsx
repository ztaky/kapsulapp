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
import { GripVertical, Plus, Edit, Copy, Video, FileText, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DndContext, closestCenter } from "@dnd-kit/core";

interface Lesson {
  id: string;
  title: string;
  type: string;
  position: number;
}

interface Module {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

interface ModuleAccordionProps {
  module: Module;
  courseId: string;
}

function LessonItem({ lesson, moduleId, courseId, totalLessons }: { lesson: Lesson; moduleId: string; courseId: string; totalLessons: number }) {
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
      // Fetch full lesson data
      const { data: fullLesson, error: fetchError } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", lesson.id)
        .single();

      if (fetchError) throw fetchError;

      // Create duplicated lesson
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
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
      toast({ title: "Leçon dupliquée" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la duplication", variant: "destructive" });
    },
  });

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
    </div>
  );
}

export function ModuleAccordion({ module, courseId }: ModuleAccordionProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: module.id });
  const queryClient = useQueryClient();
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
      toast({ title: "Leçon créée" });
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
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
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
      <Accordion type="single" collapsible>
        <AccordionItem value={module.id} className="border-none">
          <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white shadow-premium p-6 hover:border-orange-200/50 transition-all">
            <div {...attributes} {...listeners} className="cursor-grab hover:text-orange-600 transition-colors">
              <GripVertical className="h-5 w-5 text-slate-400" />
            </div>
            <AccordionTrigger className="flex-1 hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1e293b] text-base tracking-tight">{module.title}</span>
                <span className="text-sm text-slate-600 font-normal">
                  ({module.lessons.length} leçon{module.lessons.length > 1 ? "s" : ""})
                </span>
              </div>
            </AccordionTrigger>
          </div>
          <AccordionContent className="px-4 pt-4">
            <div className="space-y-2">
              <DndContext collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
                <SortableContext
                  items={module.lessons.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {module.lessons.map((lesson) => (
                    <LessonItem key={lesson.id} lesson={lesson} moduleId={module.id} courseId={courseId} totalLessons={module.lessons.length} />
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
                    <Button type="submit" className="w-full">
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
