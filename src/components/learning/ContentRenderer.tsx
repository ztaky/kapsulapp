import { VideoPlayer } from "./VideoPlayer";
import { InteractiveToolContainer } from "./InteractiveToolContainer";

interface Lesson {
  id: string;
  title: string;
  type: "video" | "interactive_tool";
  video_url?: string | null;
  content_text?: string | null;
  resource_url?: string | null;
}

interface ContentRendererProps {
  lesson: Lesson;
}

export function ContentRenderer({ lesson }: ContentRendererProps) {
  switch (lesson.type) {
    case "video":
      return (
        <div className="space-y-6">
          {lesson.video_url && <VideoPlayer url={lesson.video_url} />}
          
          {lesson.content_text && (
            <div className="prose prose-lg max-w-none p-6 bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-premium">
              <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{lesson.content_text}</p>
            </div>
          )}

          {lesson.resource_url && (
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
