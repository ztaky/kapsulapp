import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Course {
  id: string;
  title: string;
}

interface Module {
  id: string;
  title: string;
  course_id: string;
}

interface Lesson {
  id: string;
  title: string;
  module_id: string;
}

interface DestinationSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "quiz" | "modules";
  organizationId: string;
  onConfirm: (destination: { courseId?: string; moduleId?: string; lessonId?: string }) => void;
}

export function DestinationSelector({
  open,
  onOpenChange,
  type,
  organizationId,
  onConfirm,
}: DestinationSelectorProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && organizationId) {
      fetchCourses();
    }
  }, [open, organizationId]);

  useEffect(() => {
    if (selectedCourse && type === "quiz") {
      fetchModules(selectedCourse);
    }
  }, [selectedCourse, type]);

  useEffect(() => {
    if (selectedModule) {
      fetchLessons(selectedModule);
    }
  }, [selectedModule]);

  const fetchCourses = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("courses")
      .select("id, title")
      .eq("organization_id", organizationId)
      .order("title");
    setCourses(data || []);
    setIsLoading(false);
  };

  const fetchModules = async (courseId: string) => {
    const { data } = await supabase
      .from("modules")
      .select("id, title, course_id")
      .eq("course_id", courseId)
      .order("position");
    setModules(data || []);
    setSelectedModule("");
    setSelectedLesson("");
  };

  const fetchLessons = async (moduleId: string) => {
    const { data } = await supabase
      .from("lessons")
      .select("id, title, module_id")
      .eq("module_id", moduleId)
      .order("position");
    setLessons(data || []);
    setSelectedLesson("");
  };

  const handleConfirm = () => {
    if (type === "quiz" && selectedLesson) {
      onConfirm({ lessonId: selectedLesson, moduleId: selectedModule, courseId: selectedCourse });
    } else if (type === "modules" && selectedCourse) {
      onConfirm({ courseId: selectedCourse });
    }
    onOpenChange(false);
    // Reset selections
    setSelectedCourse("");
    setSelectedModule("");
    setSelectedLesson("");
  };

  const isConfirmDisabled = type === "quiz" ? !selectedLesson : !selectedCourse;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === "quiz" ? "Choisir une leçon" : "Choisir un cours"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cours</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un cours" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {type === "quiz" && selectedCourse && (
              <div className="space-y-2">
                <Label>Module</Label>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un module" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {type === "quiz" && selectedModule && (
              <div className="space-y-2">
                <Label>Leçon</Label>
                <Select value={selectedLesson} onValueChange={setSelectedLesson}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une leçon" />
                  </SelectTrigger>
                  <SelectContent>
                    {lessons.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {courses.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                Aucun cours trouvé. Créez d'abord un cours.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant="gradient"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
