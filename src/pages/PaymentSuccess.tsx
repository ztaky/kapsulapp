import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Sparkles, Crown, Zap, HeadphonesIcon, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    
    if (!sessionId) {
      navigate("/");
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-founder-payment", {
          body: { sessionId },
        });

        if (error || !data?.success) {
          navigate("/");
          return;
        }

        setCustomerEmail(data.customerEmail);
        setVerified(true);
        
        // Store for /start page
        localStorage.setItem("founder_payment_verified", "true");
        localStorage.setItem("founder_session_id", sessionId);
        if (data.customerEmail) {
          localStorage.setItem("founder_email", data.customerEmail);
        }

        // Trigger confetti
        triggerConfetti();
      } catch (err) {
        navigate("/");
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#f97316", "#ec4899", "#8b5cf6"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#f97316", "#ec4899", "#8b5cf6"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  const handleCreateAcademy = () => {
    const sessionId = searchParams.get("session_id");
    navigate(`/start?payment_success=true&session_id=${sessionId}`);
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Vérification de votre paiement...</p>
        </div>
      </div>
    );
  }

  if (!verified) {
    return null;
  }

  const benefits = [
    { icon: Zap, label: "Accès lifetime à Kapsul" },
    { icon: Crown, label: "0% de commission à vie" },
    { icon: HeadphonesIcon, label: "Support prioritaire" },
    { icon: BadgeCheck, label: "Badge Fondateur exclusif" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 text-center space-y-6 animate-scale-in shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        {/* Success Icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full animate-pulse opacity-30" />
          <div className="relative w-full h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Paiement confirmé !
          </h1>
          <p className="text-muted-foreground">
            Bienvenue dans la famille des Fondateurs Kapsul
          </p>
        </div>

        {/* Founder Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-semibold shadow-lg animate-pulse-glow">
          <Sparkles className="w-4 h-4" />
          FONDATEUR
          <Sparkles className="w-4 h-4" />
        </div>

        {/* Amount */}
        <div className="py-4 border-y border-border">
          <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            297€
          </p>
          <p className="text-sm text-muted-foreground">Paiement unique - Accès à vie</p>
        </div>

        {/* Email */}
        {customerEmail && (
          <p className="text-sm text-muted-foreground">
            Confirmation envoyée à <span className="font-medium text-foreground">{customerEmail}</span>
          </p>
        )}

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg"
            >
              <benefit.icon className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <span className="text-sm font-medium text-foreground">{benefit.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={handleCreateAcademy}
          size="lg"
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold shadow-lg"
        >
          Créer mon académie maintenant
        </Button>

        <p className="text-xs text-muted-foreground">
          Vous allez pouvoir configurer votre académie en quelques minutes
        </p>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
