import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Puzzle, Wand2, Infinity, Mail, CreditCard, Webhook, Tv, PartyPopper, Bot, Check, X, AlertTriangle, Shield, Gift, ChevronLeft, ChevronRight, BarChart3, GripVertical, Smartphone, Sparkles, Settings, Play, Loader2, ChevronDown } from "lucide-react";
import { KapsulFooter } from "@/components/landing/KapsulFooter";
import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import CountdownTimer from "@/components/landing/CountdownTimer";
import kapsulLogo from "@/assets/kapsul-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTrackEvent } from "@/components/shared/TrackingScripts";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { trackAddToCart, trackInitiateCheckout } = useTrackEvent();

  // Handle payment canceled
  useEffect(() => {
    if (searchParams.get("payment_canceled") === "true") {
      toast.error("Paiement annulé. Vous pouvez réessayer quand vous voulez.");
      // Clean URL
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams]);
  
  const handleFounderCheckout = async () => {
    // Track AddToCart + InitiateCheckout before redirecting to Stripe
    trackAddToCart("Offre Fondateur", 297, "EUR");
    trackInitiateCheckout("Offre Fondateur", 297, "EUR");
    
    setCheckoutLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("create-founder-checkout");
      if (error) {
        throw new Error(error.message || "Erreur lors de la création du paiement");
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de paiement non reçue");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error(errorMessage);
      setCheckoutLoading(false);
    }
  };
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth"
      });
    }
  };

  // Target date: December 31, 2025
  const targetDate = new Date("2025-12-31T23:59:59");
  return <div className="min-h-screen bg-background">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <img src={kapsulLogo} alt="Kapsul" className="h-8 w-8 sm:h-10 sm:w-10" />
              <span className="text-lg sm:text-xl font-bold text-foreground hidden sm:block">KAPSUL</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              <button onClick={() => scrollToSection("features")} className="text-muted-foreground hover:text-foreground transition-colors font-medium text-sm">
                Fonctionnalités
              </button>
              <button onClick={() => scrollToSection("comparison")} className="text-muted-foreground hover:text-foreground transition-colors font-medium text-sm">
                Comparatif
              </button>
              <button onClick={() => scrollToSection("pricing")} className="text-muted-foreground hover:text-foreground transition-colors font-medium text-sm">
                Pricing
              </button>
              <button onClick={() => scrollToSection("faq")} className="text-muted-foreground hover:text-foreground transition-colors font-medium text-sm">
                FAQ
              </button>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground px-2 sm:px-4">
                Connexion
              </Button>
              <Button variant="gradient" size="sm" onClick={handleFounderCheckout} disabled={checkoutLoading} className="shadow-lg shadow-[#DD2476]/25 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
                    <span className="hidden sm:inline">Profiter de l'offre Fondateur</span>
                    <span className="sm:hidden">Offre Fondateur</span>
                  </>}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border gradient-border mb-8">
            <span className="text-lg">✨</span>
            <span className="text-sm font-medium text-foreground">
              La nouvelle norme pour les formateurs en ligne
            </span>
          </div>

          {/* H1 */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground leading-tight mb-6">
            Lancez votre académie en ligne.
            <br />
            <span className="gradient-text">Sans la technique.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Kapsul remplace WordPress, Kajabi et Mailchimp.
            <br />
            Hébergez vos formations, envoyez vos emails et encaissez vos ventes dans une seule interface magnifique.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="lg" variant="gradient" onClick={handleFounderCheckout} disabled={checkoutLoading} className="text-lg px-8 py-6 shadow-xl shadow-[#DD2476]/30 hover:shadow-2xl hover:shadow-[#DD2476]/40 transition-all">
              {checkoutLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Profiter de l'offre Fondateur
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => scrollToSection("demo")}>
              Voir la démo
            </Button>
          </div>

          {/* 3D Browser Mockup */}
          <div className="perspective-3d">
            <div className="mockup-3d bg-card rounded-2xl shadow-2xl border border-border overflow-hidden max-w-4xl mx-auto animate-float">
              {/* Browser Header */}
              <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 border-b border-border">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-background rounded-lg px-4 py-1.5 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                    <span className="text-green-500">🔒</span>
                    <span>https://kapsulapp.io/studio</span>
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 bg-background">
                <div className="grid grid-cols-12 gap-6">
                  {/* Sidebar */}
                  <div className="col-span-3 space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF512F] to-[#DD2476]"></div>
                      <span className="font-semibold text-foreground text-sm">Mon Académie
                    </span>
                    </div>
                    <div className="space-y-2">
                      {["Dashboard", "Formations", "Élèves", "Emails"].map((item, i) => <div key={item} className={`px-3 py-2 rounded-lg text-sm ${i === 0 ? "bg-muted text-foreground font-medium" : "text-muted-foreground"}`}>
                          {item}
                        </div>)}
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="col-span-9 space-y-4">
                    <h2 className="text-lg font-bold text-foreground">Tableau de bord</h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-muted/30 rounded-xl p-4">
                        <p className="text-muted-foreground text-xs mb-1">Revenus ce mois</p>
                        <p className="text-2xl font-bold gradient-text">12 450€</p>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4">
                        <p className="text-muted-foreground text-xs mb-1">Élèves actifs</p>
                        <p className="text-2xl font-bold text-foreground">847</p>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4">
                        <p className="text-muted-foreground text-xs mb-1">Taux complétion</p>
                        <p className="text-2xl font-bold text-foreground">78%</p>
                      </div>
                    </div>
                    {/* Chart placeholder */}
                    <div className="bg-muted/20 rounded-xl p-4 h-32 flex items-end justify-between gap-2">
                      {[40, 65, 45, 80, 60, 90, 75, 95, 85, 100, 88, 110].map((h, i) => <div key={i} className="flex-1 bg-gradient-to-t from-[#FF512F] to-[#DD2476] rounded-t-sm opacity-80" style={{
                      height: `${h}%`
                    }}></div>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION "BYE BYE COMPLEXITÉ" */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-center text-foreground mb-16">
            Arrêtez de bricoler. <span className="gradient-text">Commencez à enseigner.</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-card rounded-3xl p-8 border border-border shadow-card hover:shadow-elevated transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Puzzle className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Fini les Plugins</h3>
              <p className="text-muted-foreground leading-relaxed">
                Plus de mises à jour WordPress qui plantent votre site le dimanche.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-card rounded-3xl p-8 border border-border shadow-card hover:shadow-elevated transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wand2 className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Design Pro Instantané</h3>
              <p className="text-muted-foreground leading-relaxed">
                Vos pages de vente sont générées par l'IA avec un design digne d'une agence.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-card rounded-3xl p-8 border border-border shadow-card hover:shadow-elevated transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Infinity className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Tout Illimité</h3>
              <p className="text-muted-foreground leading-relaxed">
                Pas de limite d'élèves, d'emails ou de stockage. Scaler sans frein.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SCREENSHOT CAROUSEL */}
      <ScreenshotCarousel />

      {/* SECTION FEATURES (Bento Grid) */}
      <section id="features" className="py-24 px-6 bg-[#0F172A]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-center text-white mb-16">
            Votre nouveau <span className="gradient-text">QG.</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Large Card - Email */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 row-span-2">
              <h3 className="text-2xl font-bold text-white mb-4">Emailing Intégré</h3>
              <p className="text-white/70 mb-6">
                Envoyez des séquences automatiques à vos élèves.
              </p>
              {/* Email Mockup */}
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF512F] to-[#DD2476]"></div>
                  <div>
                    <p className="text-white text-sm font-medium">L'Académie des Formateurs</p>
                    <p className="text-white/50 text-xs">noreply@monecole.com</p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white font-semibold mb-2">Bienvenue dans la formation ! 🎉</p>
                  <p className="text-white/60 text-sm">
                    Salut [Prénom], tu as fait le premier pas vers...
                  </p>
                </div>
              </div>
            </div>

            {/* Stripe Card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-3">Paiement Stripe</h3>
              <p className="text-white/70 mb-4">0% de commission plateforme.</p>
              <div className="flex items-center gap-4">
                <div className="bg-[#635BFF] rounded-xl px-6 py-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-white" />
                  <span className="text-white font-medium">Payer</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Webhooks Card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-3">Webhooks & API</h3>
              <p className="text-white/70 mb-4">Connectez vos outils favoris.</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <div className="w-6 h-6 rounded bg-gradient-to-br from-[#FF512F] to-[#DD2476]"></div>
                </div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-[#FF512F] to-[#DD2476]"></div>
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Webhook className="w-6 h-6 text-[#FF4A00]" />
                </div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-[#DD2476] to-[#FF512F]"></div>
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">API</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO VIDEO SECTION */}
      <DemoVideoSection />

      {/* COMPARISON TABLE */}
      <ComparisonTable />

      {/* SECTION EXPÉRIENCE ÉLÈVE */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-8">
                Vos élèves vont devenir <span className="gradient-text">accros.</span>
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
                    <Tv className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">Espace Interactif</h3>
                    <p className="text-muted-foreground">
                      Interface immersive qui donne envie de consommer le contenu.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
                    <PartyPopper className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">Gamification (Confettis)</h3>
                    <p className="text-muted-foreground">
                      Célébrez chaque victoire avec des animations motivantes.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
                    <Bot className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">Support IA 24/7</h3>
                    <p className="text-muted-foreground">
                      Un assistant intelligent répond aux questions de vos élèves.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* iPhone Mockup */}
            <div className="flex justify-center">
              <div className="relative">
                {/* iPhone Frame */}
                <div className="w-[280px] h-[580px] bg-foreground rounded-[50px] p-3 shadow-2xl">
                  <div className="w-full h-full bg-background rounded-[40px] overflow-hidden relative">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-foreground rounded-b-3xl z-10"></div>
                    
                    {/* Screen Content */}
                    <div className="pt-10 px-4 pb-4 h-full">
                      <div className="bg-muted/30 rounded-2xl p-4 mb-4">
                        <p className="text-xs text-muted-foreground mb-1">En cours</p>
                        <p className="font-bold text-foreground text-sm">Module 3 : Scaling</p>
                        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-3/4 bg-gradient-to-r from-[#FF512F] to-[#DD2476] rounded-full"></div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-card rounded-xl p-3 flex items-center gap-3 border border-border">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF512F] to-[#DD2476] flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">Leçon 1</p>
                            <p className="text-xs text-muted-foreground">Complétée</p>
                          </div>
                        </div>
                        <div className="bg-card rounded-xl p-3 flex items-center gap-3 border border-border">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">▶</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">Leçon 2</p>
                            <p className="text-xs text-muted-foreground">12 min</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUALIFICATION SECTION */}
      <QualificationSection />

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-center text-foreground mb-4">
            Rejoignez les <span className="gradient-text">100 premiers fondateurs</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 text-lg">
            Un modèle simple et transparent.
          </p>

          {/* PREMIUM FOUNDER CARD */}
          <div className="max-w-lg mx-auto">
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#FF512F] via-[#F5AF19] to-[#DD2476] rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse"></div>
              
              {/* Card with animated gradient border */}
              <div className="relative rounded-3xl p-[2px] bg-gradient-to-r from-[#F5AF19] via-[#FF512F] to-[#DD2476] overflow-hidden">
                {/* Animated border shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
                
                {/* Inner card - Dark premium background */}
                <div className="relative bg-gradient-to-br from-[#0A0F1C] via-[#111827] to-[#0F172A] rounded-[22px] p-8 overflow-hidden">
                  {/* Subtle radial glow inside */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#DD2476]/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FF512F]/10 rounded-full blur-3xl"></div>
                  
                  <div className="relative z-10">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#F5AF19] to-[#FF512F] text-black text-sm font-bold mb-6">
                      🔥 PLACES LIMITÉES
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-extrabold bg-gradient-to-r from-[#F5AF19] to-[#FF8C00] bg-clip-text text-transparent mb-2">
                      LICENCE FONDATEUR
                    </h3>

                    {/* Price */}
                    <div className="mb-2">
                      <span className="text-6xl font-black text-white">297€</span>
                      <span className="text-xl text-white/60 ml-3">LIFETIME</span>
                    </div>
                    <p className="text-white/50 mb-6">Paiement unique. Accès à vie.</p>

                    {/* Guarantee badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 text-sm font-medium mb-6 text-primary bg-primary-foreground">
                      <Shield className="w-4 h-4" />
                      Garantie 30 Jours Satisfait ou Remboursé
                    </div>

                    <ul className="space-y-3 mb-8">
                      {["Accès PRO à vie (67€/mois value)", "Formations illimitées", "Jusqu'à 1 000 étudiants", "5 000 crédits IA / mois", "Landing pages IA illimitées", "0% commission à vie", "Branding personnalisé", "Support prioritaire", "Badge \"Fondateur\" dans ton profil", "Vote sur la roadmap produit"].map((feature, i) => <li key={i} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span className="text-white/90">{feature}</span>
                        </li>)}
                    </ul>

                    <Button size="lg" variant="gradient" className="w-full text-lg shadow-xl shadow-[#DD2476]/50 hover:shadow-2xl hover:shadow-[#DD2476]/60 transition-all" onClick={handleFounderCheckout} disabled={checkoutLoading}>
                      {checkoutLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                      Devenir fondateur - 297€
                    </Button>

                    {/* Token info */}
                    <p className="text-center text-xs text-white/40 mt-4">
                      Recharges disponibles dans l'app si besoin de plus de crédits.
                    </p>

                    <div className="mt-6 pt-6 border-t border-white/10">
                      <p className="text-center text-sm text-white/60 mb-3">
                        ⏰ Offre limitée aux 100 premiers
                      </p>
                      <div className="[&_*]:text-white">
                        <CountdownTimer targetDate={targetDate} size="normal" />
                      </div>
                      <p className="text-center text-xs text-white/40 mt-3">
                        jusqu'au 31/12/2025
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-muted-foreground mt-8">
            Besoin de plus de crédits ? <span className="font-semibold text-foreground">Recharges disponibles dans l'application.</span>
          </p>
        </div>
      </section>

      {/* GUARANTEE SECTION */}
      <GuaranteeSection />

      {/* FAQ SECTION */}
      <FAQSection />

      {/* FOOTER URGENCY */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white/70 text-lg mb-4">
            ⏰ L'offre fondateur à 297€ disparaît dans :
          </p>
          
          <div className="mb-8 [&_*]:text-white">
            <CountdownTimer targetDate={targetDate} size="large" />
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8 inline-block">
            <p className="text-white/80 mb-4">Après le 31 décembre 2025 :</p>
            <div className="space-y-2 text-left">
              <p className="text-red-400 flex items-center gap-2">
                <X className="w-4 h-4" /> Plus d'offre lifetime à 297€
              </p>
              <p className="text-red-400 flex items-center gap-2">
                <X className="w-4 h-4" /> Plus de badge fondateur exclusif
              </p>
              <p className="text-red-400 flex items-center gap-2">
                <X className="w-4 h-4" /> Plus de garantie 30 jours
              </p>
            </div>
            <p className="text-white/60 mt-4 text-sm">Le prix passera à 67€/mois soit 804€/an après cette date.</p>
          </div>

          <div>
            <Button size="lg" variant="gradient" className="text-lg px-10 shadow-xl shadow-[#DD2476]/30" onClick={handleFounderCheckout} disabled={checkoutLoading}>
              {checkoutLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Je deviens fondateur maintenant
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <KapsulFooter />
    </div>;
};

// SCREENSHOT CAROUSEL COMPONENT
const ScreenshotCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center"
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const screenshots = [{
    title: "Dashboard Analytics",
    caption: "Suivez vos ventes en temps réel",
    content: <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Revenus</p>
              <p className="text-lg font-bold gradient-text">12 450€</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Élèves</p>
              <p className="text-lg font-bold">847</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Taux</p>
              <p className="text-lg font-bold">78%</p>
            </div>
          </div>
          <div className="h-20 flex items-end gap-1">
            {[40, 55, 45, 70, 60, 85, 75, 90].map((h, i) => <div key={i} className="flex-1 bg-gradient-to-t from-[#FF512F] to-[#DD2476] rounded-t" style={{
          height: `${h}%`
        }} />)}
          </div>
        </div>
  }, {
    title: "Éditeur Formation",
    caption: "Créez vos modules en drag & drop",
    content: <div className="p-4 space-y-2">
          {["Module 1 : Introduction", "Module 2 : Les bases", "Module 3 : Avancé"].map((m, i) => <div key={i} className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{m}</span>
              <span className="ml-auto text-xs text-muted-foreground">{3 + i} leçons</span>
            </div>)}
        </div>
  }, {
    title: "Espace Élève Mobile",
    caption: "Expérience mobile parfaite",
    content: <div className="p-4 flex justify-center">
          <div className="w-32 h-56 bg-foreground rounded-2xl p-1.5">
            <div className="w-full h-full bg-background rounded-xl overflow-hidden">
              <div className="bg-muted/50 h-6 flex items-center justify-center">
                <div className="w-12 h-2 bg-foreground/20 rounded-full" />
              </div>
              <div className="p-2 space-y-2">
                <div className="bg-gradient-to-r from-[#FF512F] to-[#DD2476] rounded-lg h-16" />
                <div className="bg-muted/50 rounded h-3 w-3/4" />
                <div className="bg-muted/50 rounded h-3 w-1/2" />
              </div>
            </div>
          </div>
        </div>
  }, {
    title: "Interface Email",
    caption: "Emails automatiques brandés",
    content: <div className="p-4">
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476]" />
              <div>
                <p className="text-xs font-medium">Bienvenue ! 🎉</p>
                <p className="text-xs text-muted-foreground">il y a 2 min</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Salut [Prénom], tu as fait le premier pas...</p>
          </div>
        </div>
  }, {
    title: "Page de Vente",
    caption: "Pages générées par l'IA",
    content: <div className="p-4 space-y-2">
          <div className="bg-gradient-to-r from-[#FF512F] to-[#DD2476] rounded-lg h-12 flex items-center justify-center">
            <span className="text-white text-xs font-bold">Ma Formation</span>
          </div>
          <div className="bg-muted/50 rounded h-2 w-full" />
          <div className="bg-muted/50 rounded h-2 w-3/4" />
          <div className="bg-gradient-to-r from-[#FF512F] to-[#DD2476] rounded-lg h-8 flex items-center justify-center mt-2">
            <span className="text-white text-xs">Acheter maintenant</span>
          </div>
        </div>
  }, {
    title: "Paramètres IA",
    caption: "Votre assistant IA personnel",
    content: <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
            <Bot className="w-4 h-4 text-[#DD2476]" />
            <span className="text-xs">Assistant activé</span>
            <div className="ml-auto w-8 h-4 bg-gradient-to-r from-[#FF512F] to-[#DD2476] rounded-full" />
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Tokens utilisés</p>
            <div className="h-2 bg-muted rounded-full mt-1">
              <div className="h-full w-1/3 bg-gradient-to-r from-[#FF512F] to-[#DD2476] rounded-full" />
            </div>
          </div>
        </div>
  }];
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);
  return <section className="py-24 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-foreground mb-4">
          Une interface pensée pour les <span className="gradient-text">créateurs</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12">pas les développeurs</p>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {screenshots.map((screen, index) => <div key={index} className="flex-[0_0_80%] md:flex-[0_0_45%] min-w-0 px-4">
                  <div className={`bg-card rounded-2xl border border-border shadow-card overflow-hidden transition-all duration-300 ${selectedIndex === index ? "scale-100 opacity-100" : "scale-95 opacity-60"}`}>
                    {/* Browser header */}
                    <div className="bg-muted/50 px-3 py-2 flex items-center gap-2 border-b border-border">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 text-center">
                        <span className="text-xs text-muted-foreground">{screen.title}</span>
                      </div>
                    </div>
                    {/* Content */}
                    <div className="h-48">
                      {screen.content}
                    </div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-4">{screen.caption}</p>
                </div>)}
            </div>
          </div>

          {/* Navigation */}
          <button onClick={scrollPrev} className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={scrollNext} className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {screenshots.map((_, i) => <button key={i} className={`w-2 h-2 rounded-full transition-all ${selectedIndex === i ? "w-6 bg-gradient-to-r from-[#FF512F] to-[#DD2476]" : "bg-muted-foreground/30"}`} />)}
        </div>
      </div>
    </section>;
};

// COMPARISON TABLE COMPONENT
const ComparisonTable = () => {
  const features = [{
    name: "Hébergement formations",
    wp: "warn",
    kajabi: "yes",
    systeme: "yes",
    thrive: "no",
    kapsul: "yes"
  }, {
    name: "Pages de vente",
    wp: "warn",
    kajabi: "yes",
    systeme: "yes",
    thrive: "yes",
    kapsul: "yes"
  }, {
    name: "Email marketing",
    wp: "no",
    kajabi: "yes",
    systeme: "yes",
    thrive: "no",
    kapsul: "yes"
  }, {
    name: "Paiements",
    wp: "no",
    kajabi: "yes",
    systeme: "yes",
    thrive: "yes",
    kapsul: "yes"
  }, {
    name: "Espace élève premium",
    wp: "warn",
    kajabi: "yes",
    systeme: "warn",
    thrive: "no",
    kapsul: "netflix"
  }, {
    name: "IA intégrée",
    wp: "no",
    kajabi: "no",
    systeme: "no",
    thrive: "no",
    kapsul: "yes"
  }, {
    name: "Mise à jour technique",
    wp: "toi",
    kajabi: "eux",
    systeme: "eux",
    thrive: "eux",
    kapsul: "auto"
  }, {
    name: "Prix/mois",
    wp: "50-200€",
    kajabi: "149€+",
    systeme: "27€+",
    thrive: "95€+",
    kapsul: "297€ LIFE"
  }];
  const renderCell = (value: string, isKapsul: boolean = false) => {
    switch (value) {
      case "yes":
        return <Check className={`w-6 h-6 mx-auto ${isKapsul ? "text-green-500" : "text-green-500/70"}`} strokeWidth={2.5} />;
      case "no":
        return <X className="w-6 h-6 text-red-400/70 mx-auto" strokeWidth={2.5} />;
      case "warn":
        return <AlertTriangle className="w-6 h-6 text-yellow-500/70 mx-auto" strokeWidth={2} />;
      case "netflix":
        return <span className="text-sm font-bold bg-gradient-to-r from-[#FF512F] to-[#DD2476] bg-clip-text text-transparent">✅ Interactif</span>;
      case "toi":
        return <span className="text-sm text-muted-foreground">😤 Toi</span>;
      case "eux":
        return <span className="text-sm text-muted-foreground/60">🤷 Eux</span>;
      case "auto":
        return <span className="text-sm font-bold bg-gradient-to-r from-[#FF512F] to-[#DD2476] bg-clip-text text-transparent">🎯 Auto</span>;
      case "297€ LIFE":
        return <span className="text-sm font-extrabold bg-gradient-to-r from-[#FF512F] to-[#DD2476] bg-clip-text text-transparent">297€ LIFE</span>;
      default:
        return <span className="text-sm text-muted-foreground">{value}</span>;
    }
  };
  return <section id="comparison" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-foreground mb-16">
          Kapsul vs les <span className="gradient-text">outils habituels</span>
        </h2>

        <div className="overflow-x-auto">
          <div className="bg-card rounded-3xl border border-border shadow-card overflow-hidden">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-5 px-6 font-semibold text-foreground bg-muted/30">Fonctionnalité</th>
                  <th className="py-5 px-4 font-medium text-muted-foreground text-center bg-muted/30">WordPress</th>
                  <th className="py-5 px-4 font-medium text-muted-foreground text-center bg-muted/30">Kajabi</th>
                  <th className="py-5 px-4 font-medium text-muted-foreground text-center bg-muted/30">Systeme.io</th>
                  <th className="py-5 px-4 font-medium text-muted-foreground text-center bg-muted/30">Thrivecart</th>
                  <th className="py-5 px-4 text-center bg-gradient-to-b from-[#FF512F]/20 to-[#DD2476]/20">
                    <span className="font-bold bg-gradient-to-r from-[#FF512F] to-[#DD2476] bg-clip-text text-transparent text-lg">Kapsul</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, i) => <tr key={i} className={`
                      border-b border-border/30 transition-colors hover:bg-muted/20
                      ${i % 2 === 0 ? "bg-background" : "bg-muted/10"}
                      ${i === features.length - 1 ? "font-bold border-b-0" : ""}
                    `}>
                    <td className="py-5 px-6 text-foreground font-medium">{feature.name}</td>
                    <td className="py-5 px-4 text-center">{renderCell(feature.wp)}</td>
                    <td className="py-5 px-4 text-center">{renderCell(feature.kajabi)}</td>
                    <td className="py-5 px-4 text-center">{renderCell(feature.systeme)}</td>
                    <td className="py-5 px-4 text-center">{renderCell(feature.thrive)}</td>
                    <td className="py-5 px-4 text-center bg-gradient-to-b from-[#FF512F]/15 to-[#DD2476]/15">
                      {renderCell(feature.kapsul, true)}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center mt-10">
          <span className="font-bold text-foreground text-lg">Lifetime à 297€ </span>
          <br />
          <span className="text-lg bg-gradient-to-r from-[#FF512F] to-[#DD2476] bg-clip-text text-transparent font-semibold">Au lieu de 804€ / an à partir du 1er Janvier 2026</span>
        </p>
      </div>
    </section>;
};

// QUALIFICATION SECTION COMPONENT
const QualificationSection = () => {
  const notFor = ["Tu cherches une plateforme gratuite", "Tu veux 100% personnaliser le code", "Tu as déjà une stack technique qui fonctionne parfaitement", "Tu n'as pas encore d'expertise à partager"];
  const forYou = ["Tu veux lancer ton académie cette semaine, pas dans 6 mois", "Tu en as marre de jongler entre 5 outils", "Tu veux une expérience élève premium sans être dev", "Tu veux l'IA comme co-pilote, pas comme corvée"];
  return <section className="py-24 px-6 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-foreground mb-16">
          Kapsul n'est <span className="gradient-text">PAS</span> pour tout le monde
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* NOT FOR */}
          <div className="bg-card rounded-3xl p-8 border-2 border-red-200 shadow-card">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <X className="w-6 h-6 text-red-500" />
              Ce n'est PAS pour toi si :
            </h3>
            <ul className="space-y-4">
              {notFor.map((item, i) => <li key={i} className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{item}</span>
                </li>)}
            </ul>
          </div>

          {/* FOR YOU */}
          <div className="bg-card rounded-3xl p-8 border-2 border-green-200 shadow-card">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Check className="w-6 h-6 text-green-500" />
              C'est POUR toi si :
            </h3>
            <ul className="space-y-4">
              {forYou.map((item, i) => <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{item}</span>
                </li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>;
};

// DEMO VIDEO SECTION COMPONENT
const DemoVideoSection = () => {
  return <section id="demo" className="py-24 px-6 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-foreground mb-4">
          Voyez Kapsul <span className="gradient-text">en action.</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12 text-lg">
          De l'idée à la vente en moins de 5 minutes.
        </p>

        {/* Video Container */}
        <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-border/50 bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
          {/* Video Placeholder / Cover */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] blur-3xl"></div>
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-gradient-to-r from-[#DD2476] to-[#FF512F] blur-3xl"></div>
            </div>
            
            {/* Loom style placeholder text */}
            <div className="absolute top-6 left-6 flex items-center gap-2 text-white/40">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Démo Vidéo</span>
            </div>

            {/* Play Button */}
            <button className="group relative z-10">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#FF512F] to-[#DD2476] rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <Play className="w-10 h-10 text-white ml-1" fill="white" />
              </div>
            </button>

            {/* Duration badge */}
            <div className="absolute bottom-6 right-6 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm text-white/70 text-sm">
              4:32
            </div>
          </div>
        </div>

        <p className="text-center text-muted-foreground mt-6 text-sm">
          Vidéo de présentation complète — Sans son, avec sous-titres
        </p>
      </div>
    </section>;
};

// GUARANTEE SECTION COMPONENT
const GuaranteeSection = () => {
  return <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-foreground mb-16">
          Notre promesse <span className="gradient-text">simple</span>
        </h2>

        {/* Single centered guarantee card */}
        <div className="bg-card rounded-3xl p-10 border border-border shadow-elevated text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF512F] to-[#DD2476] flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-4">Garantie 30 Jours Satisfait ou Remboursé</h3>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Tu as <span className="font-bold text-foreground">30 jours complets</span> pour tester Kapsul à fond et créer ton académie. 
            Si tu n'es pas 100% convaincu, on te rembourse intégralement. Sans question. Sans friction. Sans justification.
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            Un simple email suffit. On traite les remboursements sous 48h.
          </p>
        </div>

        <p className="text-center text-xl font-bold text-foreground mt-12">
          On prend le risque. <span className="gradient-text">Pas toi.</span>
        </p>
      </div>
    </section>;
};

// FAQ SECTION COMPONENT
const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  
  const faqs = [
    {
      question: "Qu'est-ce que l'offre Founder ?",
      answer: "Accès PRO à vie pour 297€ au lieu de 804€/an. Limité aux 100 premiers. Expire le 31 décembre 2024."
    },
    {
      question: "Puis-je être remboursé ?",
      answer: "Oui, remboursement intégral sous 30 jours si Kapsul ne te convient pas. Sans condition."
    },
    {
      question: "Ai-je besoin de compétences techniques ?",
      answer: "Non, Kapsul est conçu pour les non-techniciens. L'IA génère tes landing pages, quiz et outils en quelques clics."
    },
    {
      question: "Comment héberger mes vidéos de formation ?",
      answer: "Kapsul ne stocke pas les vidéos (trop coûteux). Héberge-les gratuitement sur YouTube (non listé) ou Vimeo, puis colle le lien. Un guide est inclus."
    },
    {
      question: "Quels outils pédagogiques sont disponibles ?",
      answer: "Vidéos, quiz interactifs, ressources téléchargeables, et outils IA personnalisés pour engager tes étudiants."
    },
    {
      question: "Combien de formations puis-je créer ?",
      answer: "Illimité. Le plan Founder (= PRO à 67€/mois dès janvier) inclut jusqu'à 1 000 étudiants et 5 000 crédits IA/mois."
    },
    {
      question: "Comment mes étudiants accèdent-ils aux formations ?",
      answer: "Ils reçoivent un email automatique avec leurs identifiants et accèdent à leur espace sur ton domaine personnalisé."
    },
    {
      question: "Puis-je suivre la progression de mes étudiants ?",
      answer: "Oui, tableau de bord complet : progression par module, taux de complétion, statistiques de vente."
    },
    {
      question: "Comment recevoir les paiements ?",
      answer: "Via Stripe Connect. Tu connectes ton compte en 2 clics, les paiements arrivent directement chez toi."
    },
    {
      question: "Y a-t-il des frais de transaction ?",
      answer: "0% de commission Kapsul. Seul Stripe facture ~2,9% + 0,25€ par transaction (standard)."
    }
  ];

  return (
    <section id="faq" className="py-24 px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-foreground mb-4">
          Questions <span className="gradient-text">fréquentes</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12 text-lg">
          Tout ce que tu dois savoir avant de te lancer
        </p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`bg-card rounded-2xl border transition-all overflow-hidden ${
                openIndex === index 
                  ? "border-[#DD2476]/50 shadow-lg shadow-[#DD2476]/10" 
                  : "border-border hover:border-border/80"
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 flex items-center justify-between text-left"
              >
                <span className="text-lg font-semibold text-foreground pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? "rotate-180 text-[#DD2476]" : ""
                  }`}
                />
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? "max-h-40" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-6">
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center mt-10 text-muted-foreground">
          D'autres questions ?{" "}
          <a href="/faq" className="font-semibold text-foreground hover:text-[#DD2476] transition-colors">
            Voir toutes les FAQ →
          </a>
        </p>
      </div>
    </section>
  );
};

export default Index;