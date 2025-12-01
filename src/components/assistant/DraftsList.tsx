import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2, Clock, BookOpen, Loader2 } from "lucide-react";
import { useSaveDraft } from "@/hooks/useSaveDraft";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface DraftsListProps {
  organizationId: string;
  onLoadDraft: (draft: any) => void;
}

export function DraftsList({ organizationId, onLoadDraft }: DraftsListProps) {
  const { loadDrafts, deleteDraft, isLoading } = useSaveDraft(organizationId);
  const [drafts, setDrafts] = useState<any[]>([]);

  const fetchDrafts = async () => {
    const loadedDrafts = await loadDrafts();
    setDrafts(loadedDrafts);
  };

  useEffect(() => {
    fetchDrafts();
  }, [organizationId]);

  const handleDelete = async (draftId: string) => {
    const success = await deleteDraft(draftId);
    if (success) {
      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-500" />
        <p className="text-sm text-slate-500 mt-2">Chargement des brouillons...</p>
      </Card>
    );
  }

  if (drafts.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed border-2 border-slate-200">
        <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">Aucun brouillon sauvegardé</p>
        <p className="text-sm text-slate-400 mt-1">
          Générez un cours et sauvegardez-le comme brouillon
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold text-slate-900">Brouillons sauvegardés</h3>
          <Badge variant="secondary" className="ml-auto">
            {drafts.length}
          </Badge>
        </div>
      </div>

      <ScrollArea className="max-h-[400px]">
        <div className="p-4 space-y-3">
          {drafts.map((draft) => {
            const modulesCount = draft.draft_data?.modules?.length || 0;
            const lessonsCount =
              draft.draft_data?.modules?.reduce(
                (sum: number, m: any) => sum + (m.lessons?.length || 0),
                0
              ) || 0;

            return (
              <Card
                key={draft.id}
                className="p-4 hover:border-orange-200 transition-colors cursor-pointer"
                onClick={() => onLoadDraft(draft)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 truncate mb-1">
                      {draft.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>
                          {modulesCount} module{modulesCount > 1 ? "s" : ""} · {lessonsCount}{" "}
                          leçon{lessonsCount > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(draft.updated_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(draft.id);
                    }}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
