import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Save, BookOpen } from "lucide-react";

interface LessonContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonTitle: string;
  content: string;
  onSave: (newContent: string) => void;
  onRegenerate?: () => void;
}

export function LessonContentModal({
  open,
  onOpenChange,
  lessonTitle,
  content,
  onSave,
  onRegenerate,
}: LessonContentModalProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onSave(editedContent);
    setIsEditing(false);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setEditedContent(content);
      setIsEditing(false);
    }
    onOpenChange(newOpen);
  };

  const wordCount = editedContent.trim().split(/\s+/).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-orange-600" />
            <DialogTitle className="text-xl">{lessonTitle}</DialogTitle>
          </div>
          <DialogDescription>
            Contenu pédagogique de la leçon ({wordCount} mots)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[50vh] pr-4">
          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Contenu de la leçon..."
            />
          ) : (
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                {content}
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regénérer
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditedContent(content);
                    setIsEditing(false);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleSave}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Modifier
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
