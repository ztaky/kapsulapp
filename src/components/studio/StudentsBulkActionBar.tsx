import { Button } from "@/components/ui/button";
import { BookOpen, X, Trash2 } from "lucide-react";

interface StudentsBulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onAssignCourses: () => void;
  onRemoveStudents?: () => void;
}

export function StudentsBulkActionBar({
  selectedCount,
  onClear,
  onAssignCourses,
  onRemoveStudents,
}: StudentsBulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex items-center gap-3 bg-background border shadow-lg rounded-full px-4 py-2">
        <span className="text-sm font-medium pl-2">
          {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
        </span>
        
        <div className="w-px h-6 bg-border" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onAssignCourses}
          className="gap-2"
        >
          <BookOpen className="h-4 w-4" />
          Assigner des cours
        </Button>

        {onRemoveStudents && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemoveStudents}
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            Retirer
          </Button>
        )}

        <div className="w-px h-6 bg-border" />

        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
