import { VideoPlayer } from "./VideoPlayer";
import { InteractiveToolContainer } from "./InteractiveToolContainer";
import { FileDown, ExternalLink, FileText, Image, File, PlayCircle, Wrench, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo } from "react";

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
  const resources: Resource[] = useMemo(() => {
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
  }, [lesson.resources]);

  const hasVideo = !!lesson.video_url;
  const hasText = !!lesson.content_text;
  const hasInteractiveTool = !!(lesson as any).tool_id && !!(lesson as any).tool_config;
  const hasResources = resources.length > 0 || !!lesson.resource_url;
  const hasCourseContent = hasVideo || hasText;

  // Determine which tabs to show
  const availableTabs = useMemo(() => {
    const tabs: string[] = [];
    if (hasCourseContent) tabs.push("cours");
    if (hasInteractiveTool) tabs.push("tool");
    if (hasResources) tabs.push("resources");
    return tabs;
  }, [hasCourseContent, hasInteractiveTool, hasResources]);

  // Determine default tab
  const defaultTab = availableTabs[0] || "cours";

  // If no content at all, show empty state
  if (availableTabs.length === 0) {
    return (
      <div className="p-8 border border-slate-200 rounded-3xl bg-white/60 backdrop-blur-sm text-center shadow-premium">
        <p className="text-slate-600">
          Aucun contenu disponible pour cette leçon
        </p>
      </div>
    );
  }

  // If only one tab, don't show tabs UI
  if (availableTabs.length === 1) {
    return (
      <div className="space-y-6">
        {hasCourseContent && (
          <>
            {hasVideo && <VideoPlayer url={lesson.video_url!} />}
            {hasText && (
              <div className="prose prose-lg max-w-none p-6 bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-premium">
                <div 
                  className="text-slate-700 leading-relaxed rich-text-content"
                  dangerouslySetInnerHTML={{ __html: lesson.content_text! }}
                />
              </div>
            )}
          </>
        )}
        {hasInteractiveTool && (
          <InteractiveToolContainer 
            lessonId={lesson.id} 
            toolId={(lesson as any).tool_id}
            toolConfig={(lesson as any).tool_config}
          />
        )}
        {hasResources && <ResourcesSection resources={resources} legacyUrl={lesson.resource_url} />}
      </div>
    );
  }

  // Grid columns based on number of tabs
  const gridCols = availableTabs.length === 2 ? "grid-cols-2" : "grid-cols-3";

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className={`grid w-full ${gridCols} mb-6 h-12 bg-slate-100/80 backdrop-blur-sm rounded-2xl p-1`}>
        {hasCourseContent && (
          <TabsTrigger 
            value="cours" 
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2"
          >
            <PlayCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Cours</span>
          </TabsTrigger>
        )}
        {hasInteractiveTool && (
          <TabsTrigger 
            value="tool" 
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2"
          >
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Outil interactif</span>
          </TabsTrigger>
        )}
        {hasResources && (
          <TabsTrigger 
            value="resources" 
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Ressources</span>
          </TabsTrigger>
        )}
      </TabsList>

      {hasCourseContent && (
        <TabsContent value="cours" className="mt-0 space-y-6">
          {hasVideo && <VideoPlayer url={lesson.video_url!} />}
          {hasText && (
            <div className="prose prose-lg max-w-none p-6 bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-premium">
              <div 
                className="text-slate-700 leading-relaxed rich-text-content"
                dangerouslySetInnerHTML={{ __html: lesson.content_text! }}
              />
            </div>
          )}
        </TabsContent>
      )}

      {hasInteractiveTool && (
        <TabsContent value="tool" className="mt-0">
          <InteractiveToolContainer 
            lessonId={lesson.id} 
            toolId={(lesson as any).tool_id}
            toolConfig={(lesson as any).tool_config}
          />
        </TabsContent>
      )}

      {hasResources && (
        <TabsContent value="resources" className="mt-0">
          <ResourcesSection resources={resources} legacyUrl={lesson.resource_url} />
        </TabsContent>
      )}
    </Tabs>
  );
}

// Extracted Resources Section component
function ResourcesSection({ resources, legacyUrl }: { resources: Resource[]; legacyUrl?: string | null }) {
  if (resources.length > 0) {
    return (
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
    );
  }

  // Legacy single resource_url support
  if (legacyUrl) {
    return (
      <div className="p-6 border border-orange-200 rounded-3xl bg-gradient-to-br from-orange-50 to-slate-50 shadow-premium">
        <p className="text-sm font-semibold mb-3 text-slate-900">Ressource téléchargeable</p>
        <a
          href={legacyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm hover:underline transition-colors"
        >
          📥 Télécharger la ressource
        </a>
      </div>
    );
  }

  return null;
}
