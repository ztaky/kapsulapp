import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Check, Loader2, Zap, Crown, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AI_CREDIT_PACKS = [
  {
    id: "starter",
    name: "Starter",
    credits: 1000,
    price: 9,
    icon: Zap,
    popular: false,
    description: "Idéal pour tester",
  },
  {
    id: "pro",
    name: "Pro",
    credits: 5000,
    price: 29,
    icon: Rocket,
    popular: true,
    description: "Le plus populaire",
  },
  {
    id: "business",
    name: "Business",
    credits: 15000,
    price: 69,
    icon: Crown,
    popular: false,
    description: "Pour les gros volumes",
  },
] as const;

interface AICreditsShopProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationSlug: string;
}

export function AICreditsShop({ open, onOpenChange, organizationId, organizationSlug }: AICreditsShopProps) {
  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  const handlePurchase = async (packId: string) => {
    setLoadingPack(packId);

    try {
      const { data, error } = await supabase.functions.invoke("create-credits-checkout", {
        body: {
          packType: packId,
          organizationId,
          organizationSlug,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.open(data.url, "_blank");
        onOpenChange(false);
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Error creating checkout:", err);
      toast.error("Erreur lors de la création du paiement");
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Acheter des crédits IA
          </DialogTitle>
          <DialogDescription>
            Les crédits bonus n'expirent jamais et s'ajoutent à votre quota mensuel.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3 py-4">
          {AI_CREDIT_PACKS.map((pack) => {
            const Icon = pack.icon;
            const isLoading = loadingPack === pack.id;
            const pricePerCredit = (pack.price / pack.credits * 100).toFixed(2);

            return (
              <Card
                key={pack.id}
                className={cn(
                  "relative p-5 flex flex-col transition-all hover:shadow-md",
                  pack.popular && "border-violet-300 ring-2 ring-violet-100"
                )}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-violet-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Populaire
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "rounded-xl p-2.5",
                    pack.popular 
                      ? "bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600" 
                      : "bg-slate-100 text-slate-600"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{pack.name}</h3>
                    <p className="text-xs text-muted-foreground">{pack.description}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{pack.credits.toLocaleString('fr-FR')}</span>
                    <span className="text-muted-foreground">crédits</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {pack.price}€
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pricePerCredit}c / crédit
                  </p>
                </div>

                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>Sans expiration</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>Utilisable immédiatement</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>Ajouté au quota mensuel</span>
                  </div>
                </div>

                <Button
                  onClick={() => handlePurchase(pack.id)}
                  disabled={isLoading || loadingPack !== null}
                  className={cn(
                    "w-full",
                    pack.popular 
                      ? "bg-violet-600 hover:bg-violet-700" 
                      : ""
                  )}
                  variant={pack.popular ? "default" : "outline"}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    "Acheter"
                  )}
                </Button>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Paiement sécurisé par Stripe. Les crédits sont ajoutés instantanément après le paiement.
        </p>
      </DialogContent>
    </Dialog>
  );
}
