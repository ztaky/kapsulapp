import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  Play, 
  Puzzle, 
  Wand2, 
  Infinity, 
  Mail, 
  CreditCard, 
  Webhook,
  Smartphone,
  Sparkles,
  PartyPopper,
  Bot,
  Shield
} from "lucide-react";
import kapsulLogo from "@/assets/kapsul-logo.png";

const Index = () => {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* NAVBAR - Sticky & Glass */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src={kapsulLogo} alt="Kapsul" className="h-8 w-8" />
              <span className="font-jakarta font-extrabold text-xl text-foreground">KAPSUL</span>
            </div>

            {/* Menu - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => scrollToSection("features")} 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Fonctionnalités
              </button>
              <button 
                onClick={() => scrollToSection("experience")} 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Témoignages
              </button>
              <button 
                onClick={() => scrollToSection("pricing")} 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </button>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                className="hidden sm:inline-flex text-sm font-medium"
                onClick={() => navigate("/auth")}
              >
                Connexion
              </Button>
              <Button 
                className="bg-gradient-to-r from-[#FF512F] to-[#DD2476] hover:opacity-90 text-white font-semibold px-5 py-2 rounded-full shadow-lg text-sm"
                onClick={() => navigate("/start")}
              >
                Essayer Kapsul
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 md:pt-40 pb-20 md:pb-32 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex mb-6">
              <div className="gradient-border px-4 py-2">
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#FF512F]" />
                  La nouvelle norme pour les formateurs en ligne
                </span>
              </div>
            </div>

            {/* H1 */}
            <h1 className="font-jakarta font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight mb-6">
              Lancez votre académie en ligne.
              <br />
              <span className="gradient-text">Sans la technique.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Kapsul remplace WordPress, Kajabi et Mailchimp. Hébergez vos formations, 
              envoyez vos emails et encaissez vos ventes dans une seule interface magnifique.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-[#FF512F] to-[#DD2476] hover:opacity-90 text-white font-bold px-8 py-6 rounded-full text-lg shadow-xl animate-pulse-glow"
                onClick={() => navigate("/start")}
              >
                Créer mon école (Essai Gratuit)
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="font-semibold px-8 py-6 rounded-full text-lg border-2 bg-white/50"
                onClick={() => scrollToSection("features")}
              >
                <Play className="h-5 w-5 mr-2" />
                Voir la démo
              </Button>
            </div>
          </div>

          {/* HERO MOCKUP - 3D Browser Window */}
          <div className="mt-16 md:mt-24 perspective-3d">
            <div className="max-w-5xl mx-auto mockup-3d animate-float">
              <div className="bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
                {/* Browser Chrome */}
                <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-border">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white rounded-full px-4 py-1.5 text-xs text-muted-foreground text-center max-w-md mx-auto">
                      app.kapsul.io/studio
                    </div>
                  </div>
                </div>
                
                {/* Dashboard Content */}
                <div className="flex">
                  {/* Sidebar */}
                  <div className="w-16 md:w-56 bg-slate-50 border-r border-border p-4 hidden sm:block">
                    <div className="space-y-2">
                      <div className="h-8 bg-gradient-to-r from-[#FF512F] to-[#DD2476] rounded-lg opacity-20" />
                      <div className="h-8 bg-slate-200 rounded-lg" />
                      <div className="h-8 bg-slate-200 rounded-lg" />
                      <div className="h-8 bg-slate-200 rounded-lg" />
                    </div>
                  </div>
                  
                  {/* Main Content */}
                  <div className="flex-1 p-4 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                      {/* Revenue Card */}
                      <div className="bg-gradient-to-br from-[#FF512F] to-[#DD2476] rounded-xl p-4 md:p-6 text-white">
                        <p className="text-white/80 text-sm font-medium">Revenus ce mois</p>
                        <p className="text-2xl md:text-4xl font-bold mt-2">12 450€</p>
                        <p className="text-white/70 text-sm mt-2">+23% vs mois dernier</p>
                      </div>
                      
                      {/* Students Card */}
                      <div className="bg-white rounded-xl p-4 md:p-6 border border-border shadow-sm">
                        <p className="text-muted-foreground text-sm font-medium">Étudiants actifs</p>
                        <p className="text-2xl md:text-4xl font-bold text-foreground mt-2">847</p>
                        <p className="text-green-500 text-sm mt-2">+12 cette semaine</p>
                      </div>
                      
                      {/* Courses Card */}
                      <div className="bg-white rounded-xl p-4 md:p-6 border border-border shadow-sm">
                        <p className="text-muted-foreground text-sm font-medium">Formations</p>
                        <p className="text-2xl md:text-4xl font-bold text-foreground mt-2">6</p>
                        <p className="text-muted-foreground text-sm mt-2">publiées</p>
                      </div>
                    </div>
                    
                    {/* Chart placeholder */}
                    <div className="mt-6 bg-white rounded-xl p-4 md:p-6 border border-border">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold text-foreground">Évolution des ventes</span>
                        <span className="text-sm text-muted-foreground">30 derniers jours</span>
                      </div>
                      <div className="h-32 md:h-48 flex items-end gap-1 md:gap-2">
                        {[40, 55, 45, 60, 75, 65, 80, 70, 85, 90, 75, 95].map((h, i) => (
                          <div 
                            key={i} 
                            className="flex-1 bg-gradient-to-t from-[#FF512F] to-[#DD2476] rounded-t opacity-70"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION "BYE BYE COMPLEXITÉ" */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="font-jakarta font-extrabold text-3xl md:text-5xl text-foreground mb-4">
              Arrêtez de bricoler. Commencez à enseigner.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              On a éliminé tout ce qui vous ralentit.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-5xl mx-auto">
            {/* Col 1 - Fini les Plugins */}
            <div className="text-center group">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-slate-50 border border-border flex items-center justify-center group-hover:scale-105 transition-transform">
                <Puzzle className="h-12 w-12 text-foreground stroke-[1]" />
              </div>
              <h3 className="font-jakarta font-bold text-xl mb-3 text-foreground">Fini les Plugins</h3>
              <p className="text-muted-foreground leading-relaxed">
                Plus de mises à jour WordPress qui plantent votre site le dimanche.
              </p>
            </div>

            {/* Col 2 - Design Pro */}
            <div className="text-center group">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-slate-50 border border-border flex items-center justify-center group-hover:scale-105 transition-transform">
                <Wand2 className="h-12 w-12 text-foreground stroke-[1]" />
              </div>
              <h3 className="font-jakarta font-bold text-xl mb-3 text-foreground">Design Pro Instantané</h3>
              <p className="text-muted-foreground leading-relaxed">
                Vos pages de vente sont générées par l'IA avec un design digne d'une agence.
              </p>
            </div>

            {/* Col 3 - Tout Illimité */}
            <div className="text-center group">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-slate-50 border border-border flex items-center justify-center group-hover:scale-105 transition-transform">
                <Infinity className="h-12 w-12 text-foreground stroke-[1]" />
              </div>
              <h3 className="font-jakarta font-bold text-xl mb-3 text-foreground">Tout Illimité</h3>
              <p className="text-muted-foreground leading-relaxed">
                Pas de limite d'élèves, d'emails ou de stockage. Scalez sans frein.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION FEATURES - Bento Grid */}
      <section id="features" className="py-20 md:py-32 bg-[#0F172A]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="font-jakarta font-extrabold text-3xl md:text-5xl text-white mb-4">
              Votre nouveau QG.
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour gérer votre business de formation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Card 1 - Emailing (Large) */}
            <div className="md:row-span-2 bg-slate-800/50 rounded-3xl p-8 border border-slate-700/50 hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-r from-[#FF512F] to-[#DD2476]">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-jakarta font-bold text-2xl text-white">Emailing Intégré</h3>
              </div>
              <p className="text-slate-400 mb-8">
                Envoyez des séquences automatiques à vos élèves. Bienvenue, rappels, promotions...
              </p>
              
              {/* Email Mockup */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476]" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">Mon Académie</p>
                    <p className="text-xs text-muted-foreground">contact@mon-academie.com</p>
                  </div>
                </div>
                <p className="font-semibold text-foreground mb-2">Bienvenue dans la formation ! 🎉</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Félicitations ! Vous avez maintenant accès à tous les modules. 
                  Commencez dès maintenant...
                </p>
              </div>
            </div>

            {/* Card 2 - Paiement Stripe */}
            <div className="bg-slate-800/50 rounded-3xl p-8 border border-slate-700/50 hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-[#635BFF]">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-jakarta font-bold text-xl text-white">Paiement Stripe</h3>
              </div>
              <p className="text-slate-400 mb-6">
                0% de commission plateforme. Gardez tous vos revenus.
              </p>
              
              {/* Stripe Button Mockup */}
              <div className="flex items-center justify-center">
                <div className="bg-[#635BFF] rounded-lg px-8 py-4 flex items-center gap-3">
                  <span className="text-white font-semibold">Payer 297€</span>
                  <Check className="h-5 w-5 text-green-400" />
                </div>
              </div>
            </div>

            {/* Card 3 - Webhooks */}
            <div className="bg-slate-800/50 rounded-3xl p-8 border border-slate-700/50 hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-orange-500">
                  <Webhook className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-jakarta font-bold text-xl text-white">Webhooks & API</h3>
              </div>
              <p className="text-slate-400 mb-6">
                Connectez vos outils favoris : Zapier, Make, n8n...
              </p>
              
              {/* Connections Mockup */}
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#FF512F] to-[#DD2476] flex items-center justify-center text-white font-bold text-lg">K</div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-[#FF512F] to-orange-400 max-w-16" />
                <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-lg">Z</div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-orange-400 to-purple-500 max-w-16" />
                <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center text-white font-bold text-lg">M</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION EXPÉRIENCE ÉLÈVE */}
      <section id="experience" className="py-20 md:py-32 bg-[#FDFBF7]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
            {/* Text Content */}
            <div>
              <h2 className="font-jakarta font-extrabold text-3xl md:text-5xl text-foreground mb-6">
                Vos élèves vont devenir accros.
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Une expérience d'apprentissage moderne qui donne envie de revenir.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Smartphone className="h-6 w-6 text-[#FF512F]" />
                  </div>
                  <div>
                    <h3 className="font-jakarta font-bold text-lg text-foreground mb-1">Espace Netflix-style</h3>
                    <p className="text-muted-foreground">Interface fluide et intuitive sur tous les écrans.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-secondary">
                    <PartyPopper className="h-6 w-6 text-[#FF512F]" />
                  </div>
                  <div>
                    <h3 className="font-jakarta font-bold text-lg text-foreground mb-1">Gamification</h3>
                    <p className="text-muted-foreground">Confettis, badges et progression visuelle motivante.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Bot className="h-6 w-6 text-[#FF512F]" />
                  </div>
                  <div>
                    <h3 className="font-jakarta font-bold text-lg text-foreground mb-1">Support IA 24/7</h3>
                    <p className="text-muted-foreground">Un assistant intelligent répond aux questions de vos élèves.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* iPhone Mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                {/* iPhone Frame */}
                <div className="w-[280px] h-[580px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl">
                  <div className="w-full h-full bg-[#FDFBF7] rounded-[2.5rem] overflow-hidden relative">
                    {/* Dynamic Island */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-7 bg-slate-900 rounded-full" />
                    
                    {/* Content */}
                    <div className="pt-14 px-4 pb-4 h-full overflow-hidden">
                      <p className="text-xs text-muted-foreground mb-1">Module 3</p>
                      <h4 className="font-jakarta font-bold text-lg text-foreground mb-4">Les bases du marketing</h4>
                      
                      {/* Video placeholder */}
                      <div className="aspect-video bg-gradient-to-br from-[#FF512F] to-[#DD2476] rounded-xl mb-4 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <Play className="h-6 w-6 text-white fill-white" />
                        </div>
                      </div>
                      
                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progression</span>
                          <span className="font-semibold text-foreground">67%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full w-2/3 bg-gradient-to-r from-[#FF512F] to-[#DD2476] rounded-full" />
                        </div>
                      </div>
                      
                      {/* Lessons */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-border">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-foreground">Introduction</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-border">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-foreground">Les fondamentaux</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-[#FF512F]/10 to-[#DD2476]/10 rounded-lg border-2 border-[#FF512F]">
                          <div className="w-4 h-4 rounded-full border-2 border-[#FF512F]" />
                          <span className="text-sm font-medium text-foreground">Le funnel parfait</span>
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

      {/* SECTION PRICING */}
      <section id="pricing" className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="font-jakarta font-extrabold text-3xl md:text-5xl text-foreground mb-4">
              Un modèle simple et transparent.
            </h2>
            <p className="text-lg text-muted-foreground">
              Pas d'abonnement mensuel qui vous saigne.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="max-w-lg mx-auto">
            <div className="relative bg-white rounded-3xl p-8 md:p-10 shadow-2xl border-2 border-transparent" style={{ background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, #FF512F, #DD2476) border-box' }}>
              {/* Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-gradient-to-r from-[#FF512F] to-[#DD2476] text-white text-sm font-bold px-6 py-2 rounded-full">
                  OFFRE DE LANCEMENT
                </div>
              </div>

              <div className="text-center pt-4">
                {/* Price */}
                <div className="mb-6">
                  <span className="font-jakarta font-extrabold text-6xl md:text-7xl text-foreground">297€</span>
                </div>
                <p className="text-lg font-semibold text-foreground mb-2">Paiement unique à vie</p>
                <p className="text-muted-foreground mb-8">Accès Lifetime. Pas d'abonnement mensuel.</p>

                {/* Features */}
                <div className="space-y-4 text-left mb-10">
                  {[
                    "Logiciel Kapsul complet à vie",
                    "Hébergement Vidéo & Emailing illimité",
                    "5 000 Crédits IA / mois",
                    "Mises à jour futures incluses",
                    "Support prioritaire"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button 
                  size="lg"
                  className="w-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] hover:opacity-90 text-white font-bold py-6 rounded-full text-lg shadow-xl"
                  onClick={() => navigate("/start")}
                >
                  Sécuriser ma licence à vie
                </Button>

                {/* Guarantee */}
                <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Garantie 30 jours satisfait ou remboursé</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-[#0F172A]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src={kapsulLogo} alt="Kapsul" className="h-8 w-8" />
              <span className="font-jakarta font-bold text-xl text-white">KAPSUL</span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2024 Kapsul. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">CGV</a>
              <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Confidentialité</a>
              <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
