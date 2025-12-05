import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CreditCard, AlertTriangle, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface StripeConnectAlertProps {
  organizationSlug: string;
  variant?: "warning" | "info" | "inline";
  className?: string;
}

export function StripeConnectAlert({ 
  organizationSlug, 
  variant = "warning",
  className 
}: StripeConnectAlertProps) {
  const navigate = useNavigate();

  const handleConnect = () => {
    navigate(`/school/${organizationSlug}/studio/branding`);
  };

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200", className)}>
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800">Stripe non connecté</p>
          <p className="text-xs text-amber-600">Connectez Stripe pour recevoir les paiements</p>
        </div>
        <Button 
          size="sm" 
          onClick={handleConnect}
          className="shrink-0 bg-amber-600 hover:bg-amber-700"
        >
          Connecter
        </Button>
      </div>
    );
  }

  return (
    <Alert className={cn(
      "relative overflow-hidden border-0",
      variant === "warning" 
        ? "bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-l-amber-500" 
        : "bg-gradient-to-r from-purple-50 to-violet-50 border-l-4 border-l-purple-500",
      className
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          "rounded-xl p-3 shrink-0",
          variant === "warning" ? "bg-amber-100" : "bg-purple-100"
        )}>
          <CreditCard className={cn(
            "h-6 w-6",
            variant === "warning" ? "text-amber-600" : "text-purple-600"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <AlertTitle className={cn(
            "text-lg font-bold tracking-tight mb-1",
            variant === "warning" ? "text-amber-900" : "text-purple-900"
          )}>
            Connectez Stripe pour recevoir vos paiements
          </AlertTitle>
          <AlertDescription className={cn(
            "text-sm mb-4",
            variant === "warning" ? "text-amber-700" : "text-purple-700"
          )}>
            Pour vendre vos formations, vous devez connecter votre compte Stripe. 
            Les paiements seront versés directement sur votre compte bancaire.
          </AlertDescription>
          
          <div className="flex flex-wrap gap-4 text-xs mb-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Paiements sécurisés</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Virements automatiques</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Configuration en 2 min</span>
            </div>
          </div>

          <Button 
            onClick={handleConnect}
            className={cn(
              "rounded-full",
              variant === "warning" 
                ? "bg-amber-600 hover:bg-amber-700" 
                : "bg-purple-600 hover:bg-purple-700"
            )}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Connecter Stripe
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}
