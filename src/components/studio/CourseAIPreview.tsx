import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Layers, 
  FileText, 
  HelpCircle, 
  Check, 
  Loader2,
  Pencil,
  Save,
  X
} from "lucide-react";
import { useCreateCompleteCourse } from "@/hooks/useCreateCompleteCourse";
import { GeneratedCourseData, GeneratedModule, GeneratedLesson } from "./CourseAIWizardDialog";
import { toast } from "sonner";

interface CourseAIPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseData: GeneratedCourseData | null;
  organizationId: string;
  organizationSlug: string;
}

export function CourseAIPreview({ 
  open, 
  onOpenChange, 
  courseData: initialData,
  organizationId,
  organizationSlug
}: CourseAIPreviewProps) {
  const navigate = useNavigate();
  const { createCompleteCourse } = useCreateCompleteCourse();
  const [isCreating, setIsCreating] = useState(false);
  const [courseData, setCourseData] = useState<GeneratedCourseData | null>(initialData);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);

  // Update local state when initialData changes
  useState(() => {
    if (initialData) {
      setCourseData(initialData);
    }
  });

  if (!courseData) return null;

  const totalLessons = courseData.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const totalQuizzes = courseData.modules.reduce(
    (acc, m) => acc + m.lessons.filter(l => l.has_quiz).length, 
    0
  );

  const handleCreate = async () => {
    setIsCreating(true);
    
    try {
      const result = await createCompleteCourse(organizationId, courseData);
      
      if (result.success && result.courseId) {
        onOpenChange(false);
        navigate(`/school/${organizationSlug}/studio/courses/${result.courseId}/curriculum`);
      }
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error("Erreur lors de la création du cours");
    } finally {
      setIsCreating(false);
    }
  };

  const updateCourseTitle = (newTitle: string) => {
    setCourseData({
      ...courseData,
      course: { ...courseData.course, title: newTitle }
    });
    setEditingTitle(false);
  };

  const updateCourseDescription = (newDescription: string) => {
    setCourseData({
      ...courseData,
      course: { ...courseData.course, description: newDescription }
    });
    setEditingDescription(false);
  };

  const updateModuleTitle = (moduleIndex: number, newTitle: string) => {
    const newModules = [...courseData.modules];
    newModules[moduleIndex] = { ...newModules[moduleIndex], title: newTitle };
    setCourseData({ ...courseData, modules: newModules });
  };

  const updateLessonTitle = (moduleIndex: number, lessonIndex: number, newTitle: string) => {
    const newModules = [...courseData.modules];
    const newLessons = [...newModules[moduleIndex].lessons];
    newLessons[lessonIndex] = { ...newLessons[lessonIndex], title: newTitle };
    newModules[moduleIndex] = { ...newModules[moduleIndex], lessons: newLessons };
    setCourseData({ ...courseData, modules: newModules });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] bg-white rounded-3xl border border-slate-100 p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Check className="h-6 w-6" />
              Cours généré avec succès !
            </DialogTitle>
          </DialogHeader>
          
          {/* Stats */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              <span className="font-medium">{courseData.modules.length} modules</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="font-medium">{totalLessons} leçons</span>
            </div>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              <span className="font-medium">{totalQuizzes} quiz</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {/* Course Info */}
          <div className="mb-6 p-4 bg-slate-50 rounded-xl">
            {/* Title */}
            <div className="mb-3">
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    defaultValue={courseData.course.title}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateCourseTitle(e.currentTarget.value);
                      }
                      if (e.key === "Escape") {
                        setEditingTitle(false);
                      }
                    }}
                    className="text-xl font-bold"
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h2 className="text-xl font-bold text-slate-900">{courseData.course.title}</h2>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setEditingTitle(true)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            
            {/* Description */}
            {editingDescription ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  defaultValue={courseData.course.description}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setEditingDescription(false);
                    }
                  }}
                  className="text-sm"
                  rows={3}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditingDescription(false)}>
                    Annuler
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={(e) => {
                      const textarea = e.currentTarget.parentElement?.parentElement?.querySelector("textarea");
                      if (textarea) updateCourseDescription(textarea.value);
                    }}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Enregistrer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 group">
                <p className="text-sm text-slate-600">{courseData.course.description}</p>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={() => setEditingDescription(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Modules */}
          <Accordion type="multiple" className="space-y-3">
            {courseData.modules.map((module, moduleIndex) => (
              <AccordionItem 
                key={moduleIndex} 
                value={`module-${moduleIndex}`}
                className="border border-slate-200 rounded-xl overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                      {moduleIndex + 1}
                    </div>
                    <EditableText
                      value={module.title}
                      onChange={(newValue) => updateModuleTitle(moduleIndex, newValue)}
                      className="font-semibold text-slate-900"
                    />
                    <Badge variant="secondary" className="ml-auto mr-2">
                      {module.lessons.length} leçons
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2 mt-2">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div 
                        key={lessonIndex}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                      >
                        {lesson.has_quiz ? (
                          <HelpCircle className="h-4 w-4 text-purple-500 flex-shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        )}
                        <EditableText
                          value={lesson.title}
                          onChange={(newValue) => updateLessonTitle(moduleIndex, lessonIndex, newValue)}
                          className="text-sm text-slate-700 flex-1"
                        />
                        {lesson.has_quiz && (
                          <Badge variant="outline" className="text-purple-600 border-purple-200 text-xs">
                            Quiz
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Vous pourrez modifier le contenu des leçons après la création
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
                Annuler
              </Button>
              <Button 
                variant="gradient" 
                onClick={handleCreate}
                disabled={isCreating}
                className="rounded-xl"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Valider et créer le cours
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for inline editing
function EditableText({ 
  value, 
  onChange, 
  className 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  if (isEditing) {
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => {
          onChange(editValue);
          setIsEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onChange(editValue);
            setIsEditing(false);
          }
          if (e.key === "Escape") {
            setEditValue(value);
            setIsEditing(false);
          }
        }}
        className={`bg-white border border-orange-300 rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-orange-200 ${className}`}
        autoFocus
      />
    );
  }

  return (
    <span 
      className={`cursor-pointer hover:bg-orange-50 px-1 rounded ${className}`}
      onClick={() => setIsEditing(true)}
      title="Cliquez pour modifier"
    >
      {value}
    </span>
  );
}
