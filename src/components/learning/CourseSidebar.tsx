import { Link, useParams } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, Circle, Lock, Play } from "lucide-react";
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
      <div className="p-6 border-b">
        <h2 className="font-semibold text-lg mb-1">{course.title}</h2>
        {course.organizations && (
          <p className="text-sm text-muted-foreground">{course.organizations.name}</p>
        )}
        
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {completedLessons} sur {totalLessons} leçons terminées
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Accordion
          type="multiple"
          defaultValue={activeModuleId ? [activeModuleId] : []}
          className="space-y-2"
        >
          {modules.map((module) => (
            <AccordionItem key={module.id} value={module.id} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <span className="font-medium text-sm">{module.title}</span>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-2">
                <div className="space-y-1">
                  {module.lessons.map((lesson) => {
                    const status = getLessonStatus(lesson.id);
                    const isActive = lesson.id === currentLessonId;

                    return (
                      <Link
                        key={lesson.id}
                        to={`/school/${slug}/learn/${courseId}/lessons/${lesson.id}`}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
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
