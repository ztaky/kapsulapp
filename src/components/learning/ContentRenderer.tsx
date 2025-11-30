import { VideoPlayer } from "./VideoPlayer";
import { InteractiveToolContainer } from "./InteractiveToolContainer";
import { FileDown, ExternalLink, FileText, Image, File } from "lucide-react";

interface Resource {
  id: string;
  type: "link" | "file";
  title: string;
  url: string;
  fileType?: string;
  fileSize?: number;
}

interface Lesson {
  id: string;
  title: string;
  type: "video" | "interactive_tool";
  video_url?: string | null;
  content_text?: string | null;
  resource_url?: string | null;
  resources?: any;
}

interface ContentRendererProps {
  lesson: Lesson;
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

export function ContentRenderer({ lesson }: ContentRendererProps) {
  // Parse resources if needed
  const resources: Resource[] = (() => {
    if (!lesson.resources) return [];
    if (typeof lesson.resources === 'string') {
      try {
        return JSON.parse(lesson.resources);
      } catch {
        return [];
      }
    }
    if (Array.isArray(lesson.resources)) {
      return lesson.resources;
    }
    return [];
  })();

  switch (lesson.type) {
    case "video":
      return (
        <div className="space-y-6">
          {lesson.video_url && <VideoPlayer url={lesson.video_url} />}
          
          {lesson.content_text && (
            <div className="prose prose-lg max-w-none p-6 bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-premium">
              <div 
                className="text-slate-700 leading-relaxed rich-text-content"
                dangerouslySetInnerHTML={{ __html: lesson.content_text }}
              />
            </div>
          )}

          {/* New resources array */}
          {resources.length > 0 && (
            <div className="p-6 border border-orange-200 rounded-3xl bg-gradient-to-br from-orange-50 to-slate-50 shadow-premium">
              <p className="text-sm font-semibold mb-4 text-slate-900">
                Ressources téléchargeables ({resources.length})
              </p>
              <div className="space-y-2">
                {resources.map((resource, index) => (
                  <a
                    key={resource.id || index}
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

          {/* Legacy single resource_url support */}
          {lesson.resource_url && resources.length === 0 && (
            <div className="p-6 border border-orange-200 rounded-3xl bg-gradient-to-br from-orange-50 to-slate-50 shadow-premium">
              <p className="text-sm font-semibold mb-3 text-slate-900">Ressource téléchargeable</p>
              <a
                href={lesson.resource_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm hover:underline transition-colors"
              >
                📥 Télécharger la ressource
              </a>
            </div>
          )}
        </div>
      );

      case "interactive_tool":
        return <InteractiveToolContainer 
          lessonId={lesson.id} 
          toolId={(lesson as any).tool_id}
          toolConfig={(lesson as any).tool_config}
        />;

    default:
      return (
        <div className="p-8 border border-slate-200 rounded-3xl bg-white/60 backdrop-blur-sm text-center shadow-premium">
          <p className="text-slate-600">
            Type de contenu non pris en charge : {lesson.type}
          </p>
        </div>
      );
  }
}
