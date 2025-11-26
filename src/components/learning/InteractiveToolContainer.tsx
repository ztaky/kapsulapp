import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InteractiveToolContainerProps {
  lessonId: string;
}

export function InteractiveToolContainer({ lessonId }: InteractiveToolContainerProps) {
  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Outil Interactif
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Lightbulb className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-medium mb-2">Outil interactif à venir</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Cette leçon contiendra un outil interactif personnalisé.
              Le composant sera injecté dynamiquement ici.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              ID de la leçon : {lessonId}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
