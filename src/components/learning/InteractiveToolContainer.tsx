import { Card, CardContent } from "@/components/ui/card";
import { CustomEmbedTool } from "./tools/CustomEmbedTool";
import { RichContentTool } from "./tools/RichContentTool";
import { QuizTool } from "./tools/QuizTool";
import { AIGeneratedTool } from "./tools/AIGeneratedTool";

interface InteractiveToolContainerProps {
  lessonId: string;
  toolId?: string | null;
  toolConfig?: any;
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
