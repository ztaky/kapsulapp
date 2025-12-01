import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);

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

        // Store for /start page
        localStorage.setItem("founder_payment_verified", "true");
        localStorage.setItem("founder_session_id", sessionId);
        if (data.customerEmail) {
          localStorage.setItem("founder_email", data.customerEmail);
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
  }, [searchParams, navigate]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Vérification de votre paiement...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentSuccess;
