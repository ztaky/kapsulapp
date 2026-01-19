import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Puzzle, Wand2, Infinity, Mail, CreditCard, Webhook, Tv, PartyPopper, Bot, Check, X, AlertTriangle, Shield, Gift, ChevronLeft, ChevronRight, BarChart3, GripVertical, Smartphone, Sparkles, Settings, Play, Loader2, ChevronDown, BookOpen, FileText, Users, Zap, Palette, Award, MessageCircle, LayoutTemplate, TrendingUp, Globe } from "lucide-react";
import { KapsulPublicFooter } from "@/components/shared/KapsulPublicFooter";
import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import kapsulLogo from "@/assets/kapsul-logo.png";
import { toast } from "sonner";
import { useTrackEvent } from "@/components/shared/TrackingScripts";
import { SalesChatWidget } from "@/components/sales/SalesChatWidget";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trackAddToCart, trackInitiateCheckout } = useTrackEvent();

  // Handle payment canceled
  useEffect(() => {
    if (searchParams.get("payment_canceled") === "true") {
      toast.error("Paiement annulé. Vous pouvez réessayer quand vous voulez.");
      // Clean URL
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
              <Button variant="gradient" size="sm" onClick={() => navigate("/coach-signup")} className="shadow-lg shadow-[#DD2476]/25 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                Commencer gratuitement
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
            <span className="text-sm font-medium text-foreground">Votre Assistant Pédagogique IA</span>
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
            <Button size="lg" variant="gradient" onClick={() => navigate("/coach-signup")} className="text-lg px-8 py-6 shadow-xl shadow-[#DD2476]/30 hover:shadow-2xl hover:shadow-[#DD2476]/40 transition-all">
              Commencer gratuitement
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
                      <span className="font-semibold text-foreground text-sm">Mon Académie</span>
                    </div>
                    <div className="space-y-2">
                      {["Dashboard", "Formations", "Élèves", "Emails"].map((item, i) => (
                        <div key={item} className={`px-3 py-2 rounded-lg text-sm ${i === 0 ? "bg-muted text-foreground font-medium" : "text-muted-foreground"}`}>
                          {item}
                        </div>
                      ))}
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
                      {[40, 65, 45, 80, 60, 90, 75, 95, 85, 100, 88, 110].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-[#FF512F] to-[#DD2476] rounded-t-sm opacity-80" style={{ height: `${h}%` }}></div>
                      ))}
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
                <CreditCard className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">0% Commission</h3>
              <p className="text-muted-foreground leading-relaxed">
                Gardez 100% de vos revenus. Seuls les frais Stripe standards s'appliquent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SCREENSHOT CAROUSEL */}
      <ScreenshotCarousel />

      {/* FEATURES HIGHLIGHT GRID */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-center text-foreground mb-4">
            Tout ce dont vous avez besoin. <span className="gradient-text">Rien de plus.</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 text-lg max-w-3xl mx-auto">
            Une plateforme complète pour créer, vendre et gérer vos formations en ligne
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: BookOpen, label: "Formations illimitées", desc: "Créez autant de cours que vous voulez" },
              { icon: Wand2, label: "IA intégrée", desc: "Landing pages, quiz, outils générés" },
              { icon: Mail, label: "Email marketing", desc: "Séquences automatiques brandées" },
              { icon: CreditCard, label: "Paiements Stripe", desc: "0% commission plateforme" },
              { icon: Palette, label: "Branding complet", desc: "Logo, couleurs, domaine perso" },
              { icon: BarChart3, label: "Analytics temps réel", desc: "Ventes, progression, engagement" },
              { icon: Award, label: "Certificats", desc: "Diplômes PDF automatiques" },
              { icon: MessageCircle, label: "Support IA 24/7", desc: "Assistant pour vos élèves" },
            ].map((feature, i) => (
              <div key={i} className="bg-card rounded-2xl p-5 border border-border hover:border-border/80 hover:shadow-card transition-all group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF512F]/10 to-[#DD2476]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-[#DD2476]" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-foreground mb-1">{feature.label}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION FEATURES (Bento Grid) - ENHANCED */}
      <section id="features" className="py-24 px-6 bg-[#0F172A]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-center text-white mb-4">
            Votre nouveau <span className="gradient-text">QG.</span>
          </h2>
          <p className="text-center text-white/60 mb-16 text-lg">
            Découvrez les piliers de votre future académie
          </p>

          {/* Main Feature Cards - Row 1 */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Course Creation Card */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all group">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF512F] to-[#DD2476] flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Créez vos formations</h3>
                  <p className="text-white/60">
                    Éditeur drag & drop intuitif. Vidéos, quiz, outils interactifs générés par l'IA.
                  </p>
                </div>
              </div>
              {/* Course Editor Mockup */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="space-y-2">
                  {["Module 1 : Les fondamentaux", "Module 2 : Stratégies avancées", "Module 3 : Mise en pratique"].map((m, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-3 flex items-center gap-3 group-hover:bg-white/10 transition-colors">
                      <GripVertical className="w-4 h-4 text-white/40" />
                      <span className="text-white/80 text-sm font-medium flex-1">{m}</span>
                      <span className="text-white/40 text-xs">{3 + i} leçons</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Landing Pages AI Card */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all group">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F5AF19] to-[#FF512F] flex items-center justify-center flex-shrink-0">
                  <LayoutTemplate className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Pages de vente IA</h3>
                  <p className="text-white/60">
                    Votre page de vente complète générée en 2 minutes. Design pro, copywriting inclus.
                  </p>
                </div>
              </div>
              {/* Landing Page Mockup */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 overflow-hidden">
                <div className="bg-gradient-to-r from-[#FF512F] to-[#DD2476] rounded-xl h-16 flex items-center justify-center mb-3">
                  <span className="text-white font-bold">Ma Formation Premium</span>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="bg-white/10 rounded h-2 w-full" />
                  <div className="bg-white/10 rounded h-2 w-4/5" />
                  <div className="bg-white/10 rounded h-2 w-3/5" />
                </div>
                <div className="bg-gradient-to-r from-[#FF512F] to-[#DD2476] rounded-xl py-2 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">Acheter maintenant - 297€</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Feature Cards - Row 2 */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Email Marketing Card */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DD2476] to-[#FF512F] flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Email Marketing</h3>
              <p className="text-white/60 text-sm mb-4">Séquences automatiques et emails transactionnels brandés.</p>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF512F] to-[#DD2476]" />
                  <span className="text-white/80 text-xs font-medium">Bienvenue ! 🎉</span>
                </div>
                <p className="text-white/50 text-xs">Salut [Prénom], tu as fait le premier pas...</p>
              </div>
            </div>

            {/* Stripe Card */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#635BFF] flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Paiements Stripe</h3>
              <p className="text-white/60 text-sm mb-4">0% de commission. Argent direct sur votre compte.</p>
              <div className="flex items-center gap-3">
                <div className="bg-[#635BFF] rounded-lg px-4 py-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium">Payer</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            {/* AI Co-pilot Card */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5AF19] to-[#FF512F] flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">IA Co-pilote</h3>
              <p className="text-white/60 text-sm mb-4">Assistant coach + tuteur élèves + quiz automatiques.</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-gradient-to-r from-[#FF512F] to-[#DD2476] rounded-full" />
                </div>
                <span className="text-white/50 text-xs">1 650 / 5 000 crédits</span>
              </div>
            </div>
          </div>

          {/* Bottom Row - Analytics & Branding */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Analytics Card */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DD2476] to-[#FF512F] flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Analytics en temps réel</h3>
                  <p className="text-white/60 text-sm">Ventes, progression élèves, engagement</p>
                </div>
              </div>
              <div className="h-20 flex items-end gap-1">
                {[40, 55, 45, 70, 60, 85, 75, 90, 80, 95, 88, 100].map((h, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-[#FF512F] to-[#DD2476] rounded-t opacity-80" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>

            {/* Branding & Customization Card */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5AF19] to-[#FF512F] flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Votre marque, partout</h3>
                  <p className="text-white/60 text-sm">Domaine personnalisé, logo, couleurs</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white/5 rounded-xl p-3 flex items-center gap-2 border border-white/10">
                  <span className="text-green-400">🔒</span>
                  <span className="text-white/70 text-sm">https://</span>
                  <span className="text-white font-medium text-sm">mon-academie.com</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-6 h-6 rounded-full bg-[#FF512F]" />
                  <div className="w-6 h-6 rounded-full bg-[#DD2476]" />
                  <div className="w-6 h-6 rounded-full bg-[#F5AF19]" />
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
      <PricingSection />

      {/* GUARANTEE SECTION */}
      <GuaranteeSection />

      {/* FAQ SECTION */}
      <FAQSection />

      {/* FOOTER CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Prêt à lancer votre académie ?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Commencez gratuitement, sans engagement. Passez à un plan payant quand vous êtes prêt.
          </p>
          <Button size="lg" variant="gradient" className="text-lg px-10 shadow-xl shadow-[#DD2476]/30" onClick={() => navigate("/coach-signup")}>
            Commencer gratuitement
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <KapsulPublicFooter />

      {/* Sales Chatbot */}
      <SalesChatWidget />
    </div>
  );
};

// PRICING SECTION COMPONENT
const PricingSection = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Gratuit",
      price: 0,
      description: "Pour découvrir Kapsul",
      badge: null,
      features: [
        "1 formation",
        "1 landing page",
        "100 étudiants max",
        "100 crédits IA / mois",
        "100 emails / mois",
        "8% commission sur ventes",
      ],
      cta: "Commencer gratuitement",
      ctaVariant: "outline" as const,
      highlighted: false,
    },
    {
      name: "Pro",
      price: 79,
      description: "Pour les coachs actifs",
      badge: "POPULAIRE",
      features: [
        "3 formations",
        "3 landing pages",
        "1 000 étudiants",
        "500 crédits IA / mois",
        "2 000 emails / mois",
        "0% commission",
        "Support prioritaire",
      ],
      cta: "Choisir Pro",
      ctaVariant: "gradient" as const,
      highlighted: true,
    },
    {
      name: "Business",
      price: 179,
      description: "Pour les académies établies",
      badge: null,
      features: [
        "Formations illimitées",
        "Landing pages illimitées",
        "Étudiants illimités",
        "2 000 crédits IA / mois",
        "5 000 emails / mois",
        "0% commission",
        "Support prioritaire",
        "Domaine personnalisé",
      ],
      cta: "Choisir Business",
      ctaVariant: "outline" as const,
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-foreground mb-4">
          Un pricing <span className="gradient-text">simple et transparent</span>
        </h2>
        <p className="text-center text-muted-foreground mb-16 text-lg">
          Commencez gratuitement, évoluez à votre rythme
        </p>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-8 transition-all ${
                plan.highlighted
                  ? "bg-gradient-to-br from-[#0A0F1C] via-[#111827] to-[#0F172A] border-2 border-[#DD2476] shadow-2xl shadow-[#DD2476]/20 scale-105"
                  : "bg-card border border-border hover:border-border/80 hover:shadow-card"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] text-white text-xs font-bold shadow-lg">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? "text-white" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? "text-white/60" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-5xl font-extrabold ${plan.highlighted ? "text-white" : "text-foreground"}`}>
                    {plan.price}€
                  </span>
                  {plan.price > 0 && (
                    <span className={`text-lg ${plan.highlighted ? "text-white/60" : "text-muted-foreground"}`}>
                      /mois
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 ${plan.highlighted ? "text-green-400" : "text-green-500"}`} />
                    <span className={`text-sm ${plan.highlighted ? "text-white/90" : "text-foreground"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                variant={plan.ctaVariant}
                className={`w-full ${
                  plan.highlighted
                    ? "shadow-xl shadow-[#DD2476]/50"
                    : ""
                }`}
                onClick={() => navigate("/coach-signup")}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground mt-8 text-sm">
          Tous les plans incluent : hébergement sécurisé, mises à jour automatiques, et support client.
        </p>
      </div>
    </section>
  );
};

// SCREENSHOT CAROUSEL COMPONENT
const ScreenshotCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center"
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const screenshots = [
    {
      title: "Dashboard Analytics",
      caption: "Suivez vos ventes en temps réel",
      content: (
        <div className="p-4 space-y-3">
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
            {[40, 55, 45, 70, 60, 85, 75, 90].map((h, i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-[#FF512F] to-[#DD2476] rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Éditeur Formation",
      caption: "Créez vos modules en drag & drop",
      content: (
        <div className="p-4 space-y-2">
          {["Module 1 : Introduction", "Module 2 : Les bases", "Module 3 : Avancé"].map((m, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{m}</span>
              <span className="ml-auto text-xs text-muted-foreground">{3 + i} leçons</span>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Espace Élève Mobile",
      caption: "Expérience mobile parfaite",
      content: (
        <div className="p-4 flex justify-center">
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
      )
    },
    {
      title: "Interface Email",
      caption: "Emails automatiques brandés",
      content: (
        <div className="p-4">
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
      )
    },
    {
      title: "Page de Vente",
      caption: "Pages générées par l'IA",
      content: (
        <div className="p-4 space-y-2">
          <div className="bg-gradient-to-r from-[#FF512F] to-[#DD2476] rounded-lg h-12 flex items-center justify-center">
            <span className="text-white text-xs font-bold">Ma Formation</span>
          </div>
          <div className="bg-muted/50 rounded h-2 w-full" />
          <div className="bg-muted/50 rounded h-2 w-3/4" />
          <div className="bg-gradient-to-r from-[#FF512F] to-[#DD2476] rounded-lg h-8 flex items-center justify-center mt-2">
            <span className="text-white text-xs">Acheter maintenant</span>
          </div>
        </div>
      )
    },
    {
      title: "Paramètres IA",
      caption: "Votre assistant IA personnel",
      content: (
        <div className="p-4 space-y-2">
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
      )
    }
  ];

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

  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-foreground mb-4">
          Une interface pensée pour les <span className="gradient-text">créateurs</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12">pas les développeurs</p>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {screenshots.map((screen, index) => (
                <div key={index} className="flex-[0_0_80%] md:flex-[0_0_45%] min-w-0 px-4">
                  <div className={`bg-card rounded-2xl border border-border shadow-card overflow-hidden transition-all duration-300 ${selectedIndex === index ? "scale-100 opacity-100" : "scale-95 opacity-60"}`}>
                    {/* Browser header */}
                    <div className="bg-muted/50 px-3 py-2 flex items-center gap-2 border-b border-border">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      </div>
                      <div className="text-xs text-muted-foreground truncate ml-2">{screen.title}</div>
                    </div>
                    {/* Screen content */}
                    <div className="min-h-[200px]">{screen.content}</div>
                    <div className="px-4 py-3 bg-muted/30 border-t border-border">
                      <p className="text-sm text-muted-foreground text-center">{screen.caption}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <button onClick={scrollPrev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={scrollNext} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {screenshots.map((_, i) => (
            <button
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${selectedIndex === i ? "bg-[#DD2476] w-6" : "bg-muted-foreground/30"}`}
              onClick={() => emblaApi?.scrollTo(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// COMPARISON TABLE COMPONENT
const ComparisonTable = () => {
  const features = [
    { name: "Hébergement formations", kapsul: true, wordpress: "Plugin", kajabi: true, systeme: true, thrivecart: false },
    { name: "Pages de vente IA", kapsul: true, wordpress: false, kajabi: false, systeme: false, thrivecart: false },
    { name: "Email marketing inclus", kapsul: true, wordpress: "Plugin", kajabi: true, systeme: true, thrivecart: false },
    { name: "Paiements 0% commission", kapsul: true, wordpress: true, kajabi: false, systeme: false, thrivecart: true },
    { name: "Quiz & outils IA", kapsul: true, wordpress: "Plugin", kajabi: false, systeme: false, thrivecart: false },
    { name: "Support IA élèves", kapsul: true, wordpress: false, kajabi: false, systeme: false, thrivecart: false },
    { name: "Certificats automatiques", kapsul: true, wordpress: "Plugin", kajabi: true, systeme: true, thrivecart: false },
    { name: "Prix mensuel", kapsul: "Dès 0€", wordpress: "~50€+", kajabi: "149$", systeme: "27€", thrivecart: "495$ one-time" },
  ];

  return (
    <section id="comparison" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-foreground mb-4">
          Pourquoi <span className="gradient-text">Kapsul</span> ?
        </h2>
        <p className="text-center text-muted-foreground mb-16 text-lg">Comparez avec les alternatives populaires</p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 font-medium text-muted-foreground">Fonctionnalité</th>
                <th className="py-4 px-4 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] text-white font-bold">
                    Kapsul
                  </div>
                </th>
                <th className="py-4 px-4 text-center font-medium text-foreground">WordPress</th>
                <th className="py-4 px-4 text-center font-medium text-foreground">Kajabi</th>
                <th className="py-4 px-4 text-center font-medium text-foreground">Systeme.io</th>
                <th className="py-4 px-4 text-center font-medium text-foreground">ThriveCart</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4 font-medium text-foreground">{feature.name}</td>
                  <td className="py-4 px-4 text-center">
                    {typeof feature.kapsul === "boolean" ? (
                      feature.kapsul ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-400 mx-auto" />
                    ) : (
                      <span className="text-sm font-medium text-[#DD2476]">{feature.kapsul}</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {typeof feature.wordpress === "boolean" ? (
                      feature.wordpress ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-400 mx-auto" />
                    ) : (
                      <span className="text-sm text-muted-foreground">{feature.wordpress}</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {typeof feature.kajabi === "boolean" ? (
                      feature.kajabi ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-400 mx-auto" />
                    ) : (
                      <span className="text-sm text-muted-foreground">{feature.kajabi}</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {typeof feature.systeme === "boolean" ? (
                      feature.systeme ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-400 mx-auto" />
                    ) : (
                      <span className="text-sm text-muted-foreground">{feature.systeme}</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {typeof feature.thrivecart === "boolean" ? (
                      feature.thrivecart ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-400 mx-auto" />
                    ) : (
                      <span className="text-sm text-muted-foreground">{feature.thrivecart}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

// DEMO VIDEO SECTION
const DemoVideoSection = () => {
  return (
    <section id="demo" className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
          Voyez Kapsul <span className="gradient-text">en action</span>
        </h2>
        <p className="text-muted-foreground mb-12 text-lg">
          2 minutes pour comprendre comment lancer votre académie
        </p>

        <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden border border-border shadow-2xl">
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#FF512F]/10 to-[#DD2476]/10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-xl">
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3">
            <div className="flex-1 h-1 bg-white/30 rounded-full">
              <div className="w-0 h-full bg-white rounded-full" />
            </div>
            <span className="text-white text-xs">0:00 / 2:15</span>
          </div>
        </div>
      </div>
    </section>
  );
};

// QUALIFICATION SECTION
const QualificationSection = () => {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-foreground mb-16">
          Kapsul est <span className="gradient-text">fait pour vous</span> si...
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Pour vous */}
          <div className="bg-card rounded-3xl p-8 border border-border shadow-card">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-6">Vous êtes au bon endroit</h3>
            <ul className="space-y-4">
              {[
                "Vous êtes coach, formateur ou expert dans votre domaine",
                "Vous voulez vendre vos formations en ligne",
                "Vous en avez marre de la technique (WordPress, plugins...)",
                "Vous voulez une solution tout-en-un moderne",
                "Vous valorisez votre temps plus que l'argent",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pas pour vous */}
          <div className="bg-card rounded-3xl p-8 border border-border shadow-card">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-6">Ce n'est pas pour vous</h3>
            <ul className="space-y-4">
              {[
                "Vous cherchez une solution 100% gratuite pour toujours",
                "Vous voulez tout contrôler techniquement (serveurs, code...)",
                "Vous avez déjà une équipe tech dédiée",
                "Vous ne vendez pas de formations ou de coaching",
                "Vous n'êtes pas prêt à investir dans votre business",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

// GUARANTEE SECTION
const GuaranteeSection = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 mb-8">
          <Shield className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6">
          Satisfait ou <span className="gradient-text">remboursé</span>
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Testez Kapsul pendant 30 jours. Si vous n'êtes pas 100% satisfait, on vous rembourse intégralement. Sans conditions, sans questions.
        </p>
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 font-medium">
          <Shield className="w-5 h-5" />
          Garantie 30 jours - Remboursement intégral
        </div>
      </div>
    </section>
  );
};

// FAQ SECTION
const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Qu'est-ce que Kapsul exactement ?",
      answer: "Kapsul est une plateforme tout-en-un pour créer, héberger et vendre vos formations en ligne. Elle remplace WordPress, Kajabi, et Mailchimp en une seule solution simple et moderne, avec de l'IA intégrée pour vous aider à créer vos contenus."
    },
    {
      question: "Est-ce que je peux commencer gratuitement ?",
      answer: "Oui ! Le plan Gratuit vous permet de créer 1 formation, 1 landing page, et d'avoir jusqu'à 100 étudiants. C'est parfait pour tester la plateforme et lancer votre premier cours."
    },
    {
      question: "Comment fonctionne la commission sur les ventes ?",
      answer: "Avec le plan Gratuit, nous prélevons 8% sur chaque vente. Avec les plans Pro et Business, c'est 0% de commission Kapsul - vous ne payez que les frais Stripe standards (~2.9% + 0.30€)."
    },
    {
      question: "Puis-je utiliser mon propre nom de domaine ?",
      answer: "Oui, avec le plan Business vous pouvez connecter votre propre domaine personnalisé (ex: formations.votresite.com). Avec les autres plans, vous utilisez un sous-domaine Kapsul."
    },
    {
      question: "Comment fonctionne l'IA intégrée ?",
      answer: "Kapsul utilise l'IA pour vous aider à créer des landing pages, générer des quiz, créer des outils interactifs et même répondre aux questions de vos élèves. Vous avez un quota de crédits IA par mois selon votre plan."
    },
    {
      question: "Puis-je migrer depuis une autre plateforme ?",
      answer: "Oui ! Nous pouvons vous aider à migrer vos contenus depuis WordPress, Kajabi, Teachable ou toute autre plateforme. Contactez notre support pour un accompagnement personnalisé."
    },
    {
      question: "Y a-t-il un engagement ?",
      answer: "Non, tous nos abonnements sont sans engagement. Vous pouvez annuler à tout moment. De plus, nous offrons une garantie satisfait ou remboursé de 30 jours sur les plans payants."
    },
  ];

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-foreground mb-16">
          Questions <span className="gradient-text">fréquentes</span>
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-foreground pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Index;
