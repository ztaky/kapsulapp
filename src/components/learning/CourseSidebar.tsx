import { Link, useParams } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, CheckCircle2, Circle, Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  position: number;
}

interface Module {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

interface UserProgress {
  lesson_id: string;
  is_completed: boolean;
}

interface CourseSidebarProps {
  course: {
    title: string;
    organizations?: {
      name: string;
      brand_color?: string;
    };
  };
  modules: Module[];
  progress: UserProgress[];
  currentLessonId?: string;
}

export function CourseSidebar({ course, modules, progress, currentLessonId }: CourseSidebarProps) {
  const { slug, courseId } = useParams();

  const allLessons = modules.flatMap((m) => m.lessons);
  const completedLessons = progress.filter((p) => p.is_completed).length;
  const totalLessons = allLessons.length;
  const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const getLessonStatus = (lessonId: string) => {
    const lessonProgress = progress.find((p) => p.lesson_id === lessonId);
    
    if (lessonProgress?.is_completed) return "completed";
    if (lessonId === currentLessonId) return "current";
    return "todo";
  };

  const getLessonIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "current":
        return <Play className="h-4 w-4 text-primary" />;
      case "locked":
        return <Lock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const activeModuleId = modules.find((m) =>
    m.lessons.some((l) => l.id === currentLessonId)
  )?.id;

  return (
    <div className="h-full flex flex-col">
      {/* Bouton retour */}
      <div className="p-4 border-b border-slate-100">
        <Link 
          to="/student" 
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux formations
        </Link>
      </div>

      <div className="p-6 border-b border-slate-100">
        <h2 className="font-semibold text-xl mb-1 text-slate-900 tracking-tight">{course.title}</h2>
        {course.organizations && (
          <p className="text-sm text-slate-600">{course.organizations.name}</p>
        )}
        
        <div className="mt-6 p-4 bg-gradient-to-br from-orange-50 to-slate-50 rounded-2xl border border-orange-100/50">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-slate-700 font-medium">Progression</span>
            <span className="font-semibold text-orange-600">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2.5 bg-slate-200" />
          <p className="text-xs text-slate-600 mt-2">
            {completedLessons} sur {totalLessons} leçons terminées
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Accordion
          type="multiple"
          defaultValue={activeModuleId ? [activeModuleId] : []}
          className="space-y-3"
        >
          {modules.map((module) => (
            <AccordionItem key={module.id} value={module.id} className="border border-slate-200 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-slate-50/50 rounded-t-2xl transition-colors">
                <span className="font-semibold text-sm text-slate-900">{module.title}</span>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-2">
                <div className="space-y-1.5">
                  {module.lessons.map((lesson) => {
                    const status = getLessonStatus(lesson.id);
                    const isActive = lesson.id === currentLessonId;

                    return (
                      <Link
                        key={lesson.id}
                        to={`/school/${slug}/learn/${courseId}/lessons/${lesson.id}`}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                          isActive
                            ? "bg-gradient-to-r from-orange-100 to-orange-50 text-orange-900 font-semibold shadow-sm border border-orange-200"
                            : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                        )}
                      >
                        {getLessonIcon(status)}
                        <span className="flex-1">{lesson.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
