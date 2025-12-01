import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ArrowLeft, CheckCircle, Sparkles } from "lucide-react";
import kapsulLogo from "@/assets/kapsul-logo.png";
import confetti from "canvas-confetti";

// Helper function to translate Supabase auth errors to French
const getAuthErrorMessage = (error: any): string => {
  const errorMessage = error?.message?.toLowerCase() || "";
  
  if (errorMessage.includes("invalid login credentials") || errorMessage.includes("invalid credentials")) {
    return "Email ou mot de passe incorrect.";
  }
  if (errorMessage.includes("user already registered") || errorMessage.includes("already been registered")) {
    return "Un compte existe déjà avec cet email.";
  }
  if (errorMessage.includes("email not confirmed")) {
    return "Veuillez confirmer votre email avant de vous connecter.";
  }
  if (errorMessage.includes("invalid email")) {
    return "L'adresse email n'est pas valide.";
  }
  if (errorMessage.includes("password") && errorMessage.includes("weak")) {
    return "Le mot de passe est trop faible.";
  }
  if (errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
    return "Trop de tentatives. Veuillez réessayer dans quelques minutes.";
  }
  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return "Erreur de connexion. Vérifiez votre connexion internet.";
  }
  if (errorMessage.includes("user not found")) {
    return "Aucun compte trouvé avec cet email.";
  }
  
  return error?.message || "Une erreur est survenue.";
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

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    // Check for payment success parameter
    const isPaymentSuccess = searchParams.get("payment_success") === "true";
    if (isPaymentSuccess) {
      setPaymentSuccess(true);
      triggerConfetti();
      // Pre-fill email if available
      const founderEmail = localStorage.getItem("founder_email");
      if (founderEmail) {
        setEmail(founderEmail);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // If payment success, redirect to /start instead of dashboard
        if (isPaymentSuccess) {
          const sessionId = searchParams.get("session_id");
          navigate(`/start?payment_success=true&session_id=${sessionId}`);
        } else {
          navigate("/dashboard");
        }
      }
    });
  }, [navigate, searchParams]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    const redirectUrl = paymentSuccess 
      ? `${window.location.origin}/start?payment_success=true&session_id=${searchParams.get("session_id")}`
      : `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      const friendlyMessage = getAuthErrorMessage(error);
      toast.error(friendlyMessage);
      setGoogleLoading(false);
    }
    // Note: On success, the user will be redirected to Google
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const redirectUrl = paymentSuccess 
      ? `${window.location.origin}/start?payment_success=true&session_id=${searchParams.get("session_id")}`
      : `${window.location.origin}/dashboard`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      const friendlyMessage = getAuthErrorMessage(error);
      toast.error(friendlyMessage);
    } else {
      toast.success("Inscription réussie ! Vous pouvez maintenant vous connecter.");
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const friendlyMessage = getAuthErrorMessage(error);
      toast.error(friendlyMessage);
    } else {
      toast.success("Connexion réussie !");
      // Redirect to /start if payment success, otherwise dashboard
      if (paymentSuccess) {
        const sessionId = searchParams.get("session_id");
        navigate(`/start?payment_success=true&session_id=${sessionId}`);
      } else {
        navigate("/dashboard");
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      toast.error("Veuillez entrer votre adresse email.");
      return;
    }
    
    setResetLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });

    if (error) {
      const friendlyMessage = getAuthErrorMessage(error);
      toast.error(friendlyMessage);
    } else {
      toast.success("Un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception.");
      setShowForgotPassword(false);
      setResetEmail("");
    }
    setResetLoading(false);
  };

  // Forgot password view
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 justify-center mb-4">
              <img src={kapsulLogo} alt="Kapsul" className="h-10 w-10 rounded-lg" />
              <span className="text-2xl font-bold font-gotham text-slate-900">Kapsul</span>
            </Link>
            <CardTitle className="text-2xl font-bold">Mot de passe oublié ?</CardTitle>
            <CardDescription>
              Entrez votre email pour recevoir un lien de réinitialisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="votre@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={resetLoading}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-[hsl(340,85%,55%)] hover:opacity-90 transition-opacity"
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer le lien de réinitialisation"
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowForgotPassword(false)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la connexion
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 justify-center mb-4">
            <img src={kapsulLogo} alt="Kapsul" className="h-10 w-10 rounded-lg" />
            <span className="text-2xl font-bold font-gotham text-slate-900">Kapsul</span>
          </Link>
          
          {paymentSuccess ? (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-[hsl(340,85%,55%)] text-white rounded-full font-semibold mb-3 mx-auto">
                <Sparkles className="w-4 h-4" />
                FONDATEUR
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Paiement confirmé !</span>
              </div>
              <CardTitle className="text-2xl font-bold">Créez votre compte</CardTitle>
              <CardDescription>Pour accéder à votre académie et commencer à créer</CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl font-bold">Bienvenue</CardTitle>
              <CardDescription>Connectez-vous à votre plateforme LMS</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-6 h-11 border-slate-300 hover:bg-slate-50"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span className="ml-2">Continuer avec Google</span>
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-[hsl(340,85%,55%)] hover:opacity-90 transition-opacity"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nom complet</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Votre nom"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 8 caractères</p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-[hsl(340,85%,55%)] hover:opacity-90 transition-opacity"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inscription...
                    </>
                  ) : (
                    "S'inscrire"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          {/* Coach signup CTA */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Vous êtes formateur ?
            </p>
            <Link to="/start">
              <Button variant="outline" className="w-full">
                🚀 Créer mon académie
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
