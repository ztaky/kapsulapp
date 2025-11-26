import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, User, Mail } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    avatar_url: ""
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        fetchProfile(session.user.id, session.user.email || "");
      }
    });
  }, [navigate]);

  const fetchProfile = async (userId: string, email: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      setProfile({
        full_name: data.full_name || "",
        email: email,
        avatar_url: data.avatar_url || ""
      });
    } else {
      setProfile({ full_name: "", email, avatar_url: "" });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Session expirée");
      navigate("/auth");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: session.user.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        email: profile.email,
        updated_at: new Date().toISOString()
      });

    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success("Profil mis à jour avec succès !");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/50 p-10 border border-slate-100 shadow-premium mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Mon Profil</h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Gérez vos informations personnelles
          </p>
        </div>

        <Card className="shadow-premium border-slate-100">
          <CardHeader>
            <CardTitle className="text-slate-900 tracking-tight">Informations personnelles</CardTitle>
            <CardDescription className="text-slate-600">
              Mettez à jour votre profil et vos préférences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-orange-100">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 text-2xl font-bold">
                  {profile.full_name?.charAt(0).toUpperCase() || <User />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="avatar" className="text-sm font-semibold text-slate-900 mb-2 block">
                  URL de l'avatar
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="avatar"
                    value={profile.avatar_url}
                    onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                    placeholder="https://..."
                    className="rounded-xl border-slate-200"
                  />
                  <Button variant="outline" size="icon" className="rounded-xl shrink-0">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-slate-900">
                Nom complet
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  id="name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Votre nom"
                  className="pl-10 rounded-xl border-slate-200"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-900">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="pl-10 rounded-xl border-slate-200 bg-slate-50"
                />
              </div>
              <p className="text-xs text-slate-500">
                L'email ne peut pas être modifié pour des raisons de sécurité
              </p>
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                variant="gradient"
                className="shadow-lg"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Enregistrer les modifications
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="rounded-xl border-slate-200"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}