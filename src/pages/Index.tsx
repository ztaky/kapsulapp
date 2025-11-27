import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { BookOpen, CheckCircle, Star, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-block mb-4">
              <span className="text-sm font-bold tracking-wider uppercase bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                Kapsul - Plateforme de formations
              </span>
            </div>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Apprenez à votre rythme,{" "}
              <span className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                progressez sans limite
              </span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Découvrez des formations de qualité adaptées à vos besoins. 
              Progressez grâce à nos outils interactifs et notre suivi personnalisé.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white font-semibold px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all text-lg"
                onClick={() => navigate("/auth")}
              >
                Je suis étudiant - Commencer
              </Button>
              <Button 
                size="lg"
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all text-lg"
                onClick={() => navigate("/start")}
              >
                🎯 Je suis formateur - Lancer mon académie
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-orange-200/20 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-pink-200/20 blur-3xl" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Pourquoi choisir notre plateforme ?</h2>
            <p className="text-muted-foreground">
              Une expérience d'apprentissage moderne et efficace
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: BookOpen,
                title: "Contenu de qualité",
                description: "Des cours structurés et progressifs pour un apprentissage optimal",
              },
              {
                icon: CheckCircle,
                title: "Suivi de progression",
                description: "Visualisez votre avancement et marquez vos leçons terminées",
              },
              {
                icon: Star,
                title: "Outils interactifs",
                description: "Accédez à des outils personnalisés pour mettre en pratique",
              },
              {
                icon: Users,
                title: "Accès illimité",
                description: "Formations accessibles 24/7 à votre rythme",
              },
            ].map((feature, i) => (
              <div key={i} className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-navy">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold mb-4 text-navy-foreground">
              Prêt à commencer votre formation ?
            </h2>
            <p className="text-navy-foreground/80 mb-8">
              Rejoignez des centaines d'apprenants et développez vos compétences dès aujourd'hui
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-primary to-[hsl(340,85%,55%)] hover:opacity-90 transition-opacity shadow-soft"
              onClick={() => navigate("/auth")}
            >
              S'inscrire gratuitement
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-background">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Kapsul. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
