import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, CheckCircle } from "lucide-react";

interface LessonRowProps {
  title: string;
  content: string;
  hasQuiz: boolean;
  onTitleChange: (newTitle: string) => void;
  onViewContent: () => void;
  onToggleQuiz: () => void;
  onDelete: () => void;
}

export function LessonRow({
  title,
  content,
  hasQuiz,
  onTitleChange,
  onViewContent,
  onToggleQuiz,
  onDelete,
}: LessonRowProps) {
  const wordCount = content.trim().split(/\s+/).length;

  return (
    <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 hover:border-orange-200 transition-colors">
      <span className="text-slate-400">📄</span>
      
      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="flex-1 border-0 focus-visible:ring-1 focus-visible:ring-orange-200"
      />
      
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
          {wordCount} mots
        </Badge>
        
        {hasQuiz && (
          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
            Quiz
          </Badge>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewContent}
          className="h-8"
        >
          <Eye className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleQuiz}
          className="h-8"
        >
          {hasQuiz ? "Sans quiz" : "+ Quiz"}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
