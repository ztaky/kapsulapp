import { useState } from "react";
import { Mail, Send, MailPlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const EMAIL_PACKS = [
  {
    id: "starter",
    name: "Starter",
    emails: 1000,
    price: 9,
    priceId: "price_1SZXWiLKhO6E8gMJPTEl1Jw8",
    icon: Mail,
    popular: false,
    description: "Idéal pour débuter",
  },
  {
    id: "pro",
    name: "Pro",
    emails: 5000,
    price: 29,
    priceId: "price_1SZXWjLKhO6E8gMJopAlpYJE",
    icon: Send,
    popular: true,
    description: "Le plus populaire",
  },
  {
    id: "business",
    name: "Business",
    emails: 15000,
    price: 69,
    priceId: "price_1SZXWkLKhO6E8gMJJP0TMNsS",
    icon: MailPlus,
    popular: false,
    description: "Pour les gros volumes",
  },
];

interface EmailCreditsShopProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationSlug: string;
}

export function EmailCreditsShop({ open, onOpenChange, organizationId, organizationSlug }: EmailCreditsShopProps) {
  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  const handlePurchase = async (packId: string) => {
    setLoadingPack(packId);
    try {
      const { data, error } = await supabase.functions.invoke("create-email-credits-checkout", {
        body: {
          packType: packId,
          organizationId,
          organizationSlug,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement.",
        variant: "destructive",
      });
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Acheter des crédits emails
          </DialogTitle>
          <DialogDescription>
            Augmentez votre quota d'emails avec des crédits bonus qui ne expirent jamais.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {EMAIL_PACKS.map((pack) => {
            const Icon = pack.icon;
            const pricePerEmail = (pack.price / pack.emails * 1000).toFixed(1);
            
            return (
              <Card 
                key={pack.id} 
                className={`relative transition-all hover:shadow-md ${
                  pack.popular ? "border-primary shadow-sm" : ""
                }`}
              >
                {pack.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                    Populaire
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    pack.popular ? "bg-primary/10" : "bg-muted"
                  }`}>
                    <Icon className={`h-6 w-6 ${pack.popular ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <CardTitle className="text-lg">{pack.name}</CardTitle>
                  <CardDescription>{pack.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-foreground">{pack.price}€</p>
                    <p className="text-sm text-muted-foreground">
                      {pack.emails.toLocaleString("fr-FR")} emails
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pricePerEmail}€ / 1000 emails
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    variant={pack.popular ? "default" : "outline"}
                    onClick={() => handlePurchase(pack.id)}
                    disabled={loadingPack !== null}
                  >
                    {loadingPack === pack.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : (
                      "Acheter"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Les crédits sont ajoutés immédiatement à votre compte et ne expirent jamais.
        </p>
      </DialogContent>
    </Dialog>
  );
}
