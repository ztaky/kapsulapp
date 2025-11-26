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
import { GripVertical, Plus, Edit, Trash2, Video, FileText } from "lucide-react";
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

function LessonItem({ lesson, moduleId }: { lesson: Lesson; moduleId: string }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border bg-card p-3 hover:bg-muted/50"
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      {lesson.type === "video" ? (
        <Video className="h-4 w-4 text-primary" />
      ) : (
        <FileText className="h-4 w-4 text-primary" />
      )}
      <span className="flex-1 text-sm">{lesson.title}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/school/${slug}/studio/lessons/${lesson.id}`)}
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
        <AccordionItem value={module.id}>
          <div className="flex items-center gap-2">
            <div {...attributes} {...listeners} className="cursor-grab p-2">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <AccordionTrigger className="flex-1 hover:no-underline">
              <span className="font-semibold">{module.title}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                ({module.lessons.length} leçon{module.lessons.length > 1 ? "s" : ""})
              </span>
            </AccordionTrigger>
          </div>
          <AccordionContent className="px-4 pt-2">
            <div className="space-y-2">
              <DndContext collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
                <SortableContext
                  items={module.lessons.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {module.lessons.map((lesson) => (
                    <LessonItem key={lesson.id} lesson={lesson} moduleId={module.id} />
                  ))}
                </SortableContext>
              </DndContext>

              <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
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
