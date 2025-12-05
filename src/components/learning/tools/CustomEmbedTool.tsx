import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FullscreenWrapper } from "./FullscreenWrapper";

interface EmbedConfig {
  embed_url: string;
  embed_type?: 'iframe' | 'notion' | 'typeform' | 'google_form' | 'loom';
}

interface CustomEmbedToolProps {
  config: EmbedConfig;
}

export function CustomEmbedTool({ config }: CustomEmbedToolProps) {
  if (!config.embed_url) {
    return (
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-background">
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">URL d'intégration non configurée</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <FullscreenWrapper title="Contenu Intégré">
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📦 Contenu Intégré
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full min-h-[600px] rounded-2xl overflow-hidden border-2 border-purple-200 bg-background shadow-lg">
            <iframe
              src={config.embed_url}
              className="w-full h-full min-h-[600px]"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Embedded content"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Contenu externe intégré
          </p>
        </CardContent>
      </Card>
    </FullscreenWrapper>
  );
}
