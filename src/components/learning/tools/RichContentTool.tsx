import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";

interface Attachment {
  name: string;
  url: string;
  size?: string;
}

interface RichContentConfig {
  html_content: string;
  attachments?: Attachment[];
}

interface RichContentToolProps {
  config: RichContentConfig;
}

export function RichContentTool({ config }: RichContentToolProps) {
  if (!config.html_content) {
    return (
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-background">
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Contenu non configuré</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-background">
      <CardContent className="pt-6">
        {/* Display HTML content - TODO: sanitize with DOMPurify in production */}
        <div 
          className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: config.html_content }}
        />
        
        {/* Downloadable attachments */}
        {config.attachments && config.attachments.length > 0 && (
          <div className="mt-8 space-y-2">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Fichiers joints
            </h4>
            <div className="space-y-2">
              {config.attachments.map((file, i) => (
                <a
                  key={i}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-accent transition-colors group"
                >
                  <Download className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="flex-1 font-medium text-foreground">{file.name}</span>
                  {file.size && (
                    <span className="text-sm text-muted-foreground">({file.size})</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
