import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCookieConsent, CookiePreferences } from "@/hooks/useCookieConsent";
import { Cookie, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CookieConsentBannerProps {
  className?: string;
}

export function CookieConsentBanner({ className }: CookieConsentBannerProps) {
  const { hasConsented, isLoaded, acceptAll, rejectAll, savePreferences } = useCookieConsent();
  const [showCustomize, setShowCustomize] = useState(false);
  const [customPrefs, setCustomPrefs] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  // Don't render until loaded, or if user has already consented
  if (!isLoaded || hasConsented) {
    return null;
  }

  const handleSaveCustom = () => {
    savePreferences(customPrefs);
  };

  if (showCustomize) {
    return (
      <div className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4",
        className
      )}>
        <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Préférences cookies
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCustomize(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Essential - always enabled */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div>
                <Label className="font-medium">Cookies essentiels</Label>
                <p className="text-sm text-muted-foreground">
                  Nécessaires au fonctionnement du site
                </p>
              </div>
              <Switch checked disabled />
            </div>

            {/* Analytics */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div>
                <Label className="font-medium">Cookies analytiques</Label>
                <p className="text-sm text-muted-foreground">
                  Nous aident à comprendre comment vous utilisez le site
                </p>
              </div>
              <Switch
                checked={customPrefs.analytics}
                onCheckedChange={(checked) => 
                  setCustomPrefs(prev => ({ ...prev, analytics: checked }))
                }
              />
            </div>

            {/* Marketing */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div>
                <Label className="font-medium">Cookies marketing</Label>
                <p className="text-sm text-muted-foreground">
                  Permettent d'afficher des publicités pertinentes
                </p>
              </div>
              <Switch
                checked={customPrefs.marketing}
                onCheckedChange={(checked) => 
                  setCustomPrefs(prev => ({ ...prev, marketing: checked }))
                }
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowCustomize(false)}
            >
              Annuler
            </Button>
            <Button
              variant="gradient"
              className="flex-1"
              onClick={handleSaveCustom}
            >
              Sauvegarder
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6",
      className
    )}>
      <div className="max-w-4xl mx-auto bg-card rounded-2xl shadow-2xl border border-border p-6 animate-in slide-in-from-bottom duration-300">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Cookie className="h-6 w-6 text-primary" />
            </div>
          </div>
          
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-foreground">
              Nous utilisons des cookies 🍪
            </h3>
            <p className="text-sm text-muted-foreground">
              Nous utilisons des cookies pour améliorer votre expérience et analyser le trafic.{" "}
              <a href="/cookies" className="text-primary hover:underline">
                En savoir plus
              </a>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomize(true)}
              className="text-muted-foreground"
            >
              Personnaliser
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={rejectAll}
            >
              Refuser
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={acceptAll}
            >
              Tout accepter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
