import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, CheckCircle, PartyPopper } from "lucide-react";
import kapsulLogo from "@/assets/kapsul-logo.png";
import { KapsulPublicFooter } from "@/components/shared/KapsulPublicFooter";

// Helper function to translate Supabase auth errors to French
const getAuthErrorMessage = (error: unknown): string => {
  const errorMessage = (error as { message?: string })?.message?.toLowerCase() || "";
  
  if (errorMessage.includes("user already registered") || errorMessage.includes("already been registered")) {
    return "Un compte existe déjà avec cet email. Essayez de vous connecter.";
  }
  if (errorMessage.includes("invalid email")) {
    return "L'adresse email n'est pas valide.";
  }
  if (errorMessage.includes("password") && errorMessage.includes("weak")) {
    return "Le mot de passe est trop faible. Utilisez au moins 8 caractères.";
  }
  if (errorMessage.includes("password") && errorMessage.includes("short")) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  if (errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
    return "Trop de tentatives. Veuillez réessayer dans quelques minutes.";
  }
  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return "Erreur de connexion. Vérifiez votre connexion internet.";
  }
  
  return (error as { message?: string })?.message || "Une erreur est survenue lors de l'inscription.";
};

// Password validation
const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return { valid: false, message: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  return { valid: true, message: "" };
};

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

interface PaymentData {
  verified: boolean;
  email: string | null;
  name: string | null;
  amountPaid: number | null;
}

export default function CoachSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    academyName: "",
    fullName: "",
    email: "",
    password: "",
  });
  const [passwordError, setPasswordError] = useState("");
  
  // Payment verification state
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  // Check for payment success on mount
  useEffect(() => {
    const paymentSuccess = searchParams.get("payment_success");
    const sessionId = searchParams.get("session_id");

    if (paymentSuccess === "true" && sessionId) {
      verifyPayment(sessionId);
    }
  }, [searchParams]);

  const verifyPayment = async (sessionId: string) => {
    setVerifyingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-founder-payment", {
        body: { sessionId },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.verified) {
        setPaymentVerified(true);
        setPaymentData(data);
        
        // Pre-fill form with payment data
        if (data.email) {
          setFormData(prev => ({ ...prev, email: data.email }));
        }
        if (data.name) {
          setFormData(prev => ({ ...prev, fullName: data.name }));
        }
        
        toast.success("🎉 Paiement confirmé ! Finalisez votre inscription.");
      } else {
        toast.error("Le paiement n'a pas pu être vérifié. Contactez le support.");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erreur de vérification";
      console.error("Payment verification error:", errorMessage);
      toast.error("Erreur lors de la vérification du paiement.");
    } finally {
      setVerifyingPayment(false);
    }
  };

  const generateUniqueSlug = async (baseName: string): Promise<string> => {
    const baseSlug = baseName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const { data } = await supabase
        .from("organizations")
        .select("slug")
        .eq("slug", slug)
        .single();

      if (!data) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  };

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    if (value.length > 0) {
      const validation = validatePassword(value);
      setPasswordError(validation.valid ? "" : validation.message);
    } else {
      setPasswordError("");
    }
  };

  const handleGoogleSignUp = async () => {
    if (!formData.academyName.trim()) {
      toast.error("Veuillez d'abord entrer le nom de votre académie.");
      return;
    }

    setGoogleLoading(true);
    
    // Store academy name and payment info in localStorage for after OAuth redirect
    localStorage.setItem("pending_academy_name", formData.academyName);
    if (paymentVerified) {
      localStorage.setItem("founder_payment_verified", "true");
    }
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard?setup_academy=true`,
      },
    });

    if (error) {
      const friendlyMessage = getAuthErrorMessage(error);
      toast.error(friendlyMessage);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password before submission
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.message);
      return;
    }
    
    setLoading(true);

    try {
      // 1. Create user with emailRedirectTo
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            is_founder: paymentVerified,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) {
        const friendlyMessage = getAuthErrorMessage(authError);
        
        // Special handling for existing user
        if (friendlyMessage.includes("existe déjà")) {
          toast.error(friendlyMessage, {
            action: {
              label: "Se connecter",
              onClick: () => navigate("/auth"),
            },
          });
          setLoading(false);
          return;
        }
        
        throw new Error(friendlyMessage);
      }
      
      if (!authData.user) throw new Error("Échec de création du compte");

      // 2. Generate unique slug
      const slug = await generateUniqueSlug(formData.academyName);

      // 3. Call edge function to create organization
      const { error: orgError } = await supabase.functions.invoke(
        "create-coach-academy",
        {
          body: {
            academyName: formData.academyName,
            slug,
            userId: authData.user.id,
            isFounder: paymentVerified,
          },
        }
      );

      if (orgError) {
        throw new Error("Erreur lors de la création de l'académie. Veuillez réessayer.");
      }

      toast.success("🎉 Votre académie a été créée avec succès !");
      navigate(`/school/${slug}/studio`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Loading state while verifying payment
  if (verifyingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEF7F0] via-white to-[#FEF7F0] flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-700">Vérification du paiement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF7F0] via-white to-[#FEF7F0] flex flex-col items-center justify-center p-4">
      {/* Logo/Header */}
      <div className="w-full max-w-md mb-8 text-center">
        <Link to="/" className="inline-flex items-center gap-3 justify-center">
          <img src={kapsulLogo} alt="Kapsul" className="h-12 w-12 rounded-xl" />
          <span className="text-3xl font-bold font-gotham text-slate-900">
            Kapsul
          </span>
        </Link>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-md border-slate-200 shadow-2xl bg-white/95 backdrop-blur">
        <CardHeader className="space-y-3 text-center pb-6">
          {paymentVerified ? (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 mx-auto mb-2">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-bold mx-auto">
                <PartyPopper className="w-4 h-4" />
                FONDATEUR
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Paiement confirmé !
              </CardTitle>
              <CardDescription className="text-base text-slate-600">
                Finalisez la création de votre académie
              </CardDescription>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 mx-auto mb-2">
                <span className="text-3xl">🚀</span>
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Lancez votre académie en ligne
              </CardTitle>
              <CardDescription className="text-base text-slate-600">
                Créez, vendez et enseignez vos formations en 5 minutes
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Academy name first - needed for both flows */}
            <div className="space-y-2">
              <Label htmlFor="academyName" className="text-slate-700 font-medium">
                Nom de votre académie
              </Label>
              <Input
                id="academyName"
                type="text"
                placeholder="Mon Académie Pro"
                value={formData.academyName}
                onChange={(e) => setFormData({ ...formData, academyName: e.target.value })}
                required
                disabled={loading || googleLoading}
                className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            {/* Google Sign Up Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-slate-300 hover:bg-slate-50"
              onClick={handleGoogleSignUp}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span className="ml-2">Continuer avec Google</span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">ou avec email</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-700 font-medium">
                Votre nom complet
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Jean Dupont"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                disabled={loading}
                className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Email professionnel
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="jean@exemple.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading || (paymentVerified && !!paymentData?.email)}
                className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
              />
              {paymentVerified && paymentData?.email && (
                <p className="text-xs text-green-600">✓ Email vérifié via le paiement</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  className={`h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500 pr-10 ${
                    passwordError ? "border-red-500" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError ? (
                <p className="text-xs text-red-500">{passwordError}</p>
              ) : (
                <p className="text-xs text-slate-500">Minimum 8 caractères</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !!passwordError}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Création en cours...
                </>
              ) : paymentVerified ? (
                <>
                  🎉 Finaliser mon académie
                </>
              ) : (
                <>
                  🎯 Créer mon académie maintenant
                </>
              )}
            </Button>

            <div className="text-center text-sm text-slate-600 pt-2">
              Déjà inscrit ?{" "}
              <Link to="/auth" className="font-semibold text-orange-600 hover:text-orange-700">
                Se connecter
              </Link>
            </div>
          </form>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-slate-200">
            {paymentVerified ? (
              <>
                <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <span>✓</span> Paiement OK
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <span>✓</span> Accès Lifetime
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <span>✓</span> Badge Fondateur
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <span className="text-green-600">✓</span> Gratuit
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <span className="text-green-600">✓</span> Sans CB
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <span className="text-green-600">✓</span> En 2 minutes
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-sm text-slate-500 mt-6 text-center max-w-md">
        En créant votre académie, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
      </p>
      
      <KapsulPublicFooter variant="compact" className="mt-4" />
    </div>
  );
}
