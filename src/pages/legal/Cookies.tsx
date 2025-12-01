import { usePlatformSetting, LegalPageSetting } from "@/hooks/usePlatformSettings";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cookie, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { KapsulFooter } from "@/components/landing/KapsulFooter";
import kapsulLogo from "@/assets/kapsul-logo.png";

export default function Cookies() {
  const { data: content, isLoading } = usePlatformSetting<LegalPageSetting>("cookie_policy");
  const { resetConsent } = useCookieConsent();

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

  const title = content?.title || "Politique des Cookies";
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
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
              <Cookie className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {title}
            </h1>
          </div>

          {/* Cookie preferences button */}
          <div className="mb-8 p-4 rounded-xl bg-muted/50 border border-border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Gérer vos préférences
              </h3>
              <p className="text-sm text-muted-foreground">
                Modifiez vos choix de cookies à tout moment
              </p>
            </div>
            <Button variant="outline" onClick={resetConsent}>
              Modifier mes préférences
            </Button>
          </div>
          
          <div className="prose prose-lg max-w-none dark:prose-invert">
            {text.split('\n').map((paragraph: string, index: number) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-xl font-bold mt-6 mb-3 text-foreground">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
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
              if (paragraph.startsWith('- ')) {
                return (
                  <li key={index} className="text-muted-foreground ml-6">
                    {paragraph.replace('- ', '')}
                  </li>
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

      <KapsulFooter />
    </div>
  );
}
