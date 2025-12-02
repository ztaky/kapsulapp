import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, RefreshCw, Trash2, Plus } from "lucide-react";
import { LessonRow } from "./LessonRow";
import { LessonContentModal } from "./LessonContentModal";

interface Lesson {
  id: string;
  title: string;
  content: string;
  has_quiz: boolean;
  objective?: string;
}

interface ModuleEditorProps {
  title: string;
  objective?: string;
  lessons: Lesson[];
  onTitleChange: (newTitle: string) => void;
  onObjectiveChange?: (newObjective: string) => void;
  onLessonUpdate: (lessonId: string, updates: Partial<Lesson>) => void;
  onAddLesson: () => void;
  onDeleteLesson: (lessonId: string) => void;
  onRegenerate?: () => void;
  onDelete: () => void;
}

export function ModuleEditor({
  title,
  objective,
  lessons,
  onTitleChange,
  onObjectiveChange,
  onLessonUpdate,
  onAddLesson,
  onDeleteLesson,
  onRegenerate,
  onDelete,
}: ModuleEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);

  return (
    <>
      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        {/* Module Header */}
        <div className="flex items-center gap-2 p-4 bg-slate-50 border-b border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          
          <span className="text-slate-600">📁</span>
          
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="flex-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-orange-200 font-medium"
          />
          
          {onObjectiveChange && (
            <Input
              value={objective || ""}
              onChange={(e) => onObjectiveChange(e.target.value)}
              placeholder="Objectif du module..."
              className="flex-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-orange-200 text-sm text-slate-500"
            />
          )}
          
          <span className="text-sm text-slate-500">
            {lessons.length} leçon{lessons.length > 1 ? "s" : ""}
          </span>
          
          <div className="flex gap-1">
            {onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                className="h-8"
                title="Regénérer ce module"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Supprimer ce module"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Lessons List */}
        {isExpanded && (
          <div className="p-4 space-y-2">
            {lessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                title={lesson.title}
                content={lesson.content}
                hasQuiz={lesson.has_quiz}
                onTitleChange={(newTitle) =>
                  onLessonUpdate(lesson.id, { title: newTitle })
                }
                onViewContent={() => setViewingLesson(lesson)}
                onToggleQuiz={() =>
                  onLessonUpdate(lesson.id, { has_quiz: !lesson.has_quiz })
                }
                onDelete={() => onDeleteLesson(lesson.id)}
              />
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={onAddLesson}
              className="w-full mt-2 border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une leçon
            </Button>
          </div>
        )}
      </div>

      {viewingLesson && (
        <LessonContentModal
          open={!!viewingLesson}
          onOpenChange={(open) => !open && setViewingLesson(null)}
          lessonTitle={viewingLesson.title}
          content={viewingLesson.content}
          onSave={(newContent) =>
            onLessonUpdate(viewingLesson.id, { content: newContent })
          }
        />
      )}
    </>
  );
}
