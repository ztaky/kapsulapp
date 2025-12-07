import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTrackEvent } from "@/components/shared/TrackingScripts";
import { KapsulPublicFooter } from "@/components/shared/KapsulPublicFooter";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const { trackPurchase } = useTrackEvent();

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

        if (error || !data?.verified) {
          navigate("/");
          return;
        }

        // Track Purchase conversion
        const amountInEuros = data.amountPaid ? data.amountPaid / 100 : 297;
        trackPurchase(amountInEuros, "EUR", data.paymentIntentId || sessionId);

        // Store for /start page
        localStorage.setItem("founder_payment_verified", "true");
        localStorage.setItem("founder_session_id", sessionId);
        if (data.email) {
          localStorage.setItem("founder_email", data.email);
        }

        // Redirect to auth with success parameter
        navigate(`/auth?payment_success=true&session_id=${sessionId}`);
      } catch (err) {
        navigate("/");
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, trackPurchase]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Vérification de votre paiement...</p>
        </div>
        <KapsulPublicFooter variant="compact" className="mt-8" />
      </div>
    );
  }

  return null;
};

export default PaymentSuccess;
