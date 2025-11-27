import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import kapsulLogo from "@/assets/kapsul-logo.png";

export default function CoachSignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    academyName: "",
    fullName: "",
    email: "",
    password: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Échec de création du compte");

      // 2. Generate unique slug
      const slug = await generateUniqueSlug(formData.academyName);

      // 3. Call edge function to create organization
      const { data: orgData, error: orgError } = await supabase.functions.invoke(
        "create-coach-academy",
        {
          body: {
            academyName: formData.academyName,
            slug,
            userId: authData.user.id,
          },
        }
      );

      if (orgError) throw orgError;

      toast.success("🎉 Votre académie a été créée avec succès !");
      navigate(`/school/${slug}/studio`);
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Une erreur est survenue lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 mx-auto mb-2">
            <span className="text-3xl">🚀</span>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Lancez votre académie en ligne
          </CardTitle>
          <CardDescription className="text-base text-slate-600">
            Créez, vendez et enseignez vos formations en 5 minutes
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
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
                disabled={loading}
                className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
              />
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
                disabled={loading}
                className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                disabled={loading}
                className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
              />
              <p className="text-xs text-slate-500">Minimum 8 caractères</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Création en cours...
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
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <span className="text-green-600">✓</span> Gratuit
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <span className="text-green-600">✓</span> Sans CB
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <span className="text-green-600">✓</span> En 2 minutes
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-sm text-slate-500 mt-8 text-center max-w-md">
        En créant votre académie, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
      </p>
    </div>
  );
}
