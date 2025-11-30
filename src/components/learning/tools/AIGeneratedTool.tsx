import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface AIGeneratedToolProps {
  config: {
    description?: string;
    generatedCode?: string;
    generatedAt?: string;
  };
}

export function AIGeneratedTool({ config }: AIGeneratedToolProps) {
  if (!config.generatedCode) {
    return (
      <Card className="border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-background">
        <CardContent className="text-center py-12">
          <Sparkles className="h-12 w-12 mx-auto text-purple-400 mb-4" />
          <p className="text-muted-foreground">Outil interactif non configuré</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Outil Interactif
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 min-h-[200px]">
          {/* Render sandboxé du code généré */}
          <div 
            className="ai-generated-tool"
            dangerouslySetInnerHTML={{ __html: config.generatedCode }}
          />
        </div>
      </CardContent>
    </Card>
  );
}