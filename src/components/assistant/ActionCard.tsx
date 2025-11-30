import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { QuizPreview } from "./QuizPreview";
import { ModulesPreview } from "./ModulesPreview";
import { DestinationSelector } from "./DestinationSelector";
import { useContentActions } from "@/hooks/useContentActions";

export type ActionType = "generate_quiz" | "suggest_modules";

interface QuizData {
  title: string;
  questions: {
    question: string;
    answers: string[];
    correctIndex: number;
    explanation?: string;
  }[];
}

interface ModulesData {
  course_topic?: string;
  modules: {
    title: string;
    lessons: { title: string; type?: "video" | "interactive_tool" }[];
  }[];
}

interface ActionCardProps {
  type: ActionType;
  data: QuizData | ModulesData;
  organizationId: string;
  onActionComplete?: () => void;
}

export function ActionCard({ type, data, organizationId, onActionComplete }: ActionCardProps) {
  const [showDestinationSelector, setShowDestinationSelector] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { saveQuizToLesson, createModulesForCourse } = useContentActions();

  const handleAdd = () => {
    setShowDestinationSelector(true);
  };

  const handleConfirmDestination = async (destination: {
    courseId?: string;
    moduleId?: string;
    lessonId?: string;
  }) => {
    setIsAdding(true);
    
    try {
      if (type === "generate_quiz" && destination.lessonId) {
        const quizData = data as QuizData;
        const result = await saveQuizToLesson(destination.lessonId, {
          title: quizData.title,
          questions: quizData.questions,
        });
        if (result.success) {
          setIsAdded(true);
          onActionComplete?.();
        }
      } else if (type === "suggest_modules" && destination.courseId) {
        const modulesData = data as ModulesData;
        const result = await createModulesForCourse(destination.courseId, modulesData.modules);
        if (result.success) {
          setIsAdded(true);
          onActionComplete?.();
        }
      }
    } finally {
      setIsAdding(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case "generate_quiz":
        return "📝";
      case "suggest_modules":
        return "📚";
      default:
        return "✨";
    }
  };

  const getTitle = () => {
    switch (type) {
      case "generate_quiz":
        return "Quiz généré";
      case "suggest_modules":
        return "Structure de modules";
      default:
        return "Contenu généré";
    }
  };

  return (
    <>
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getIcon()}</span>
            <span className="font-semibold text-slate-900">{getTitle()}</span>
            <Sparkles className="h-4 w-4 text-orange-500" />
          </div>
          
          {isAdded ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Ajouté !</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={isAdding}
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Modifier
              </Button>
              <Button
                variant="gradient"
                size="sm"
                className="text-xs"
                onClick={handleAdd}
                disabled={isAdding}
              >
                {isAdding ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3 mr-1" />
                )}
                Ajouter
              </Button>
            </div>
          )}
        </div>

        <div className="border-t border-orange-100 pt-4">
          {type === "generate_quiz" && (
            <QuizPreview
              title={(data as QuizData).title}
              questions={(data as QuizData).questions}
            />
          )}
          {type === "suggest_modules" && (
            <ModulesPreview
              modules={(data as ModulesData).modules}
              courseTopic={(data as ModulesData).course_topic}
            />
          )}
        </div>
      </Card>

      <DestinationSelector
        open={showDestinationSelector}
        onOpenChange={setShowDestinationSelector}
        type={type === "generate_quiz" ? "quiz" : "modules"}
        organizationId={organizationId}
        onConfirm={handleConfirmDestination}
      />
    </>
  );
}
