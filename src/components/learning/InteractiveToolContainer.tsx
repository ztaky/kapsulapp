import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomEmbedTool } from "./tools/CustomEmbedTool";
import { RichContentTool } from "./tools/RichContentTool";
import { QuizTool } from "./tools/QuizTool";
import { AIGeneratedTool } from "./tools/AIGeneratedTool";
import { Code } from "lucide-react";

interface InteractiveToolContainerProps {
  lessonId: string;
  toolId?: string | null;
  toolConfig?: any;
}

// Component for custom HTML code
function CustomCodeTool({ config }: { config: { htmlCode?: string; title?: string } }) {
  if (!config.htmlCode) {
    return (
      <Card className="border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-background">
        <CardContent className="text-center py-12">
          <Code className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <p className="text-muted-foreground">Code personnalisé non configuré</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {config.title && (
        <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 text-white py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code className="h-4 w-4" />
            {config.title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <iframe
          srcDoc={config.htmlCode}
          className="w-full min-h-[500px] border-0"
          sandbox="allow-scripts allow-forms allow-popups"
          title={config.title || "Outil interactif"}
        />
      </CardContent>
    </Card>
  );
}

export function InteractiveToolContainer({ lessonId, toolId, toolConfig }: InteractiveToolContainerProps) {
  if (!toolId || !toolConfig) {
    return (
      <Card className="border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-background">
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Outil interactif non configuré</p>
        </CardContent>
      </Card>
    );
  }

  switch (toolId) {
    case "custom_embed":
      return <CustomEmbedTool config={toolConfig} />;
    
    case "rich_content":
      return <RichContentTool config={toolConfig} />;
    
    case "quiz":
      return <QuizTool config={toolConfig} lessonId={lessonId} />;
    
    case "ai_tool":
      return <AIGeneratedTool config={toolConfig} />;
    
    case "custom_code":
      return <CustomCodeTool config={toolConfig} />;
    
    default:
      return (
        <Card className="border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-background">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Type d'outil inconnu : {toolId}</p>
          </CardContent>
        </Card>
      );
  }
}
