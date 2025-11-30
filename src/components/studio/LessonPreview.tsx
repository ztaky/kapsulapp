import { VideoPlayer } from "@/components/learning/VideoPlayer";
import { InteractiveToolContainer } from "@/components/learning/InteractiveToolContainer";
import { FileText, Image, File, ExternalLink } from "lucide-react";
import { Resource } from "./LessonResourcesManager";

interface LessonPreviewProps {
  title: string;
  type: "video" | "interactive_tool";
  videoUrl?: string;
  contentText?: string;
  resources?: Resource[];
  toolId?: string | null;
  toolConfig?: any;
}

const getFileIcon = (fileType?: string) => {
  if (!fileType) return <File className="h-4 w-4 text-orange-600" />;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
    return <Image className="h-4 w-4 text-orange-600" />;
  }
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileType)) {
    return <FileText className="h-4 w-4 text-orange-600" />;
  }
  return <File className="h-4 w-4 text-orange-600" />;
};

export function LessonPreview({
  title,
  type,
  videoUrl,
  contentText,
  resources,
  toolId,
  toolConfig,
}: LessonPreviewProps) {
  return (
    <div className="bg-gradient-to-br from-white via-slate-50/30 to-orange-50/20 rounded-2xl p-6 min-h-[400px]">
      {/* Lesson Title */}
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-orange-900 bg-clip-text text-transparent tracking-tight">
        {title || "Titre de la leçon"}
      </h1>

      {/* Content based on type */}
      <div className="space-y-6">
        {/* Video section - shown whenever a video URL exists */}
        {videoUrl && <VideoPlayer url={videoUrl} />}

        {/* Text content (shown for both types if present) */}
        {contentText && (
          <div className="prose prose-lg max-w-none p-6 bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-sm">
            <div
              className="text-slate-700 leading-relaxed rich-text-content"
              dangerouslySetInnerHTML={{ __html: contentText }}
            />
          </div>
        )}

        {/* Interactive tool section */}
        {type === "interactive_tool" && (
          <div>
            {toolId && toolConfig ? (
              <InteractiveToolContainer
                lessonId="preview"
                toolId={toolId}
                toolConfig={toolConfig}
              />
            ) : (
              <div className="p-12 border-2 border-dashed border-slate-200 rounded-3xl text-center text-slate-400">
                Configurez un outil interactif pour voir l'aperçu
              </div>
            )}
          </div>
        )}

        {/* Empty state for video type without content */}
        {type === "video" && !videoUrl && !contentText && (
          <div className="p-12 border-2 border-dashed border-slate-200 rounded-3xl text-center text-slate-400">
            Ajoutez une vidéo ou du contenu textuel pour voir l'aperçu
          </div>
        )}
      </div>

      {/* Resources */}
      {resources && resources.length > 0 && (
        <div className="mt-8 p-6 border border-orange-200 rounded-3xl bg-gradient-to-br from-orange-50 to-slate-50">
          <p className="text-sm font-semibold mb-4 text-slate-900">
            Ressources téléchargeables ({resources.length})
          </p>
          <div className="space-y-2">
            {resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-white/80 rounded-xl hover:bg-white transition-colors group"
              >
                {resource.type === "file" ? (
                  getFileIcon(resource.fileType)
                ) : (
                  <ExternalLink className="h-4 w-4 text-blue-600" />
                )}
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  {resource.title}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Preview Badge */}
      <div className="mt-6 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
          👁️ Mode prévisualisation - Vue étudiant
        </span>
      </div>
    </div>
  );
}
