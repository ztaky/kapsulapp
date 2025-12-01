import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Rocket, Plus, BookOpen, Users, Clock, Save } from "lucide-react";
import { ModuleEditor } from "./ModuleEditor";
import { useCreateCompleteCourse } from "@/hooks/useCreateCompleteCourse";
import { useSaveDraft } from "@/hooks/useSaveDraft";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Lesson {
  id: string;
  title: string;
  content: string;
  has_quiz: boolean;
  quiz?: any;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

interface CourseInfo {
  title: string;
  description: string;
  target_audience?: string;
  duration_estimate?: string;
}

interface CoursePreviewCardProps {
  initialCourse: CourseInfo;
  initialModules: Array<{
    title: string;
    description?: string;
    lessons: Array<{
      title: string;
      content: string;
      has_quiz?: boolean;
      quiz?: any;
    }>;
  }>;
  organizationId: string;
  organizationSlug?: string;
  existingDraftId?: string;
}

export function CoursePreviewCard({
  initialCourse,
  initialModules,
  organizationId,
  organizationSlug,
  existingDraftId,
}: CoursePreviewCardProps) {
  const navigate = useNavigate();
  const { createCompleteCourse } = useCreateCompleteCourse();
  const { saveDraft, isSaving } = useSaveDraft(organizationId);
  
  const [course, setCourse] = useState<CourseInfo>(initialCourse);
  const [modules, setModules] = useState<Module[]>(
    initialModules.map((m, idx) => ({
      id: `module-${idx}`,
      title: m.title,
      description: m.description,
      lessons: m.lessons.map((l, lIdx) => ({
        id: `lesson-${idx}-${lIdx}`,
        title: l.title,
        content: l.content,
        has_quiz: l.has_quiz || false,
        quiz: l.quiz,
      })),
    }))
  );
  const [isCreating, setIsCreating] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(existingDraftId);

  const handleSaveDraft = async () => {
    const draftData = {
      course,
      modules: modules.map((m) => ({
        title: m.title,
        description: m.description,
        lessons: m.lessons.map((l) => ({
          title: l.title,
          content: l.content,
          has_quiz: l.has_quiz,
          quiz: l.quiz,
        })),
      })),
    };

    const result = await saveDraft(course.title, draftData, currentDraftId);
    if (result.success && result.draftId) {
      setCurrentDraftId(result.draftId);
    }
  };

  const handleCreateCourse = async () => {
    setIsCreating(true);
    
    const result = await createCompleteCourse(organizationId, {
      course,
      modules: modules.map((m) => ({
        title: m.title,
        description: m.description,
        lessons: m.lessons.map((l) => ({
          title: l.title,
          content: l.content,
          has_quiz: l.has_quiz,
          quiz: l.quiz,
        })),
      })),
    });

    setIsCreating(false);

    if (result.success && result.courseId) {
      // Delete draft if it was created from one
      if (currentDraftId) {
        await supabase.from("course_drafts").delete().eq("id", currentDraftId);
      }
      
      setTimeout(() => {
        if (organizationSlug) {
          navigate(`/school/${organizationSlug}/studio/courses/${result.courseId}/curriculum`);
        }
      }, 1500);
    }
  };

  const handleModuleUpdate = (moduleId: string, updates: Partial<Module>) => {
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, ...updates } : m))
    );
  };

  const handleLessonUpdate = (
    moduleId: string,
    lessonId: string,
    updates: Partial<Lesson>
  ) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              lessons: m.lessons.map((l) =>
                l.id === lessonId ? { ...l, ...updates } : l
              ),
            }
          : m
      )
    );
  };

  const handleAddModule = () => {
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: "Nouveau module",
      lessons: [],
    };
    setModules((prev) => [...prev, newModule]);
  };

  const handleDeleteModule = (moduleId: string) => {
    setModules((prev) => prev.filter((m) => m.id !== moduleId));
  };

  const handleAddLesson = (moduleId: string) => {
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: "Nouvelle leçon",
      content: "Contenu de la leçon à rédiger...",
      has_quiz: false,
    };
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m
      )
    );
  };

  const handleDeleteLesson = (moduleId: string, lessonId: string) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
          : m
      )
    );
  };

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const totalQuizzes = modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.has_quiz).length,
    0
  );

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Cours complet généré</h3>
            <p className="text-orange-100 text-sm">
              Prévisualisez et modifiez avant de créer
            </p>
          </div>
        </div>
        
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>{modules.length} modules</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{totalLessons} leçons</span>
          </div>
          {totalQuizzes > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{totalQuizzes} quiz</span>
            </div>
          )}
        </div>
      </div>

      {/* Course Info */}
      <div className="p-6 space-y-4 border-b border-orange-100">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Titre du cours
          </label>
          <Input
            value={course.title}
            onChange={(e) => setCourse({ ...course, title: e.target.value })}
            className="text-lg font-semibold"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Description
          </label>
          <Textarea
            value={course.description}
            onChange={(e) =>
              setCourse({ ...course, description: e.target.value })
            }
            className="min-h-[80px]"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {course.target_audience && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Public cible
              </label>
              <Input
                value={course.target_audience}
                onChange={(e) =>
                  setCourse({ ...course, target_audience: e.target.value })
                }
              />
            </div>
          )}
          {course.duration_estimate && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Durée estimée
              </label>
              <Input
                value={course.duration_estimate}
                onChange={(e) =>
                  setCourse({ ...course, duration_estimate: e.target.value })
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Modules List */}
      <ScrollArea className="max-h-[60vh]">
        <div className="p-6 space-y-4">
          {modules.map((module) => (
            <ModuleEditor
              key={module.id}
              title={module.title}
              lessons={module.lessons}
              onTitleChange={(newTitle) =>
                handleModuleUpdate(module.id, { title: newTitle })
              }
              onLessonUpdate={(lessonId, updates) =>
                handleLessonUpdate(module.id, lessonId, updates)
              }
              onAddLesson={() => handleAddLesson(module.id)}
              onDeleteLesson={(lessonId) =>
                handleDeleteLesson(module.id, lessonId)
              }
              onDelete={() => handleDeleteModule(module.id)}
            />
          ))}
          
          <Button
            variant="outline"
            onClick={handleAddModule}
            className="w-full border-dashed border-2 h-12"
          >
            <Plus className="h-5 w-5 mr-2" />
            Ajouter un module
          </Button>
        </div>
      </ScrollArea>

      {/* Action Buttons */}
      <div className="p-6 border-t border-orange-100 bg-white space-y-3">
        <div className="flex gap-3">
          <Button
            onClick={handleSaveDraft}
            disabled={isSaving || modules.length === 0}
            variant="outline"
            size="lg"
            className="flex-1 h-12"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {currentDraftId ? "Mettre à jour" : "Sauvegarder"} le brouillon
              </>
            )}
          </Button>
          
          <Button
            onClick={handleCreateCourse}
            disabled={isCreating || modules.length === 0}
            variant="gradient"
            size="lg"
            className="flex-1 h-12 text-base font-bold shadow-lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5 mr-2" />
                Créer le cours
              </>
            )}
          </Button>
        </div>
        <p className="text-center text-xs text-slate-500">
          Sauvegardez pour reprendre plus tard ou créez le cours directement
        </p>
      </div>
    </Card>
  );
}
