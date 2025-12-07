import { usePlatformSetting, LegalPageSetting } from "@/hooks/usePlatformSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { KapsulPublicFooter } from "@/components/shared/KapsulPublicFooter";
import kapsulLogo from "@/assets/kapsul-logo.png";

export default function MentionsLegales() {
  const { data: content, isLoading } = usePlatformSetting<LegalPageSetting>("legal_mentions");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const title = content?.title || "Mentions Légales";
  const text = content?.content || "Cette page sera bientôt disponible.";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <img src={kapsulLogo} alt="Kapsul" className="h-6 w-6" />
            <span className="font-semibold text-foreground">Kapsul</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            {title}
          </h1>
          
          <div className="prose prose-lg max-w-none dark:prose-invert">
            {text.split('\n').map((paragraph: string, index: number) => {
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={index} className="text-2xl font-bold mt-8 mb-4 text-foreground">
                    {paragraph.replace('## ', '')}
                  </h2>
                );
              }
              if (paragraph.startsWith('# ')) {
                return (
                  <h1 key={index} className="text-3xl font-bold mt-8 mb-4 text-foreground">
                    {paragraph.replace('# ', '')}
                  </h1>
                );
              }
              if (paragraph.trim() === '') return null;
              return (
                <p key={index} className="mb-4 text-muted-foreground leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </div>
      </main>

      <KapsulPublicFooter />
    </div>
  );
}
