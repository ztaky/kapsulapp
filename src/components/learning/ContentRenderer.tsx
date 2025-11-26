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
            <div className="prose prose-lg max-w-none">
              <p className="whitespace-pre-wrap">{lesson.content_text}</p>
            </div>
          )}

          {lesson.resource_url && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <p className="text-sm font-medium mb-2">Ressource téléchargeable</p>
              <a
                href={lesson.resource_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                📥 Télécharger la ressource
              </a>
            </div>
          )}
        </div>
      );

    case "interactive_tool":
      return <InteractiveToolContainer lessonId={lesson.id} />;

    default:
      return (
        <div className="p-8 border rounded-lg bg-muted/30 text-center">
          <p className="text-muted-foreground">
            Type de contenu non pris en charge : {lesson.type}
          </p>
        </div>
      );
  }
}
