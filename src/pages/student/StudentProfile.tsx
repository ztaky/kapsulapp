import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, User } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

const StudentProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    email: "",
    avatar_url: null,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
        toast.error("Erreur lors du chargement du profil");
      } else {
        setProfile(data);
      }
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        })
        .eq("id", user.id);

      if (error) {
        console.error(error);
        toast.error("Erreur lors de la sauvegarde");
      } else {
        toast.success("Profil mis à jour avec succès");
      }
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
          Mon Profil
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          Gérez vos informations personnelles
        </p>
      </div>

      <Card className="shadow-premium border-slate-100">
        <CardHeader>
          <CardTitle className="text-slate-900 tracking-tight">Informations personnelles</CardTitle>
          <CardDescription className="text-slate-600">
            Mettez à jour vos informations de profil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 ring-4 ring-orange-50">
              <AvatarImage src={profile.avatar_url || ""} />
              <AvatarFallback className="bg-orange-100 text-orange-700 text-xl font-bold">
                {profile.full_name?.[0] || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="avatar" className="text-sm font-medium text-slate-700">URL de l'avatar</Label>
              <Input
                id="avatar"
                placeholder="https://example.com/avatar.jpg"
                value={profile.avatar_url || ""}
                onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                className="mt-1.5 border-slate-200 focus:border-orange-300 focus:ring-orange-200"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="name" className="text-sm font-medium text-slate-700">Nom complet</Label>
            <Input
              id="name"
              placeholder="Votre nom complet"
              value={profile.full_name || ""}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="mt-1.5 border-slate-200 focus:border-orange-300 focus:ring-orange-200"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="mt-1.5 bg-slate-50 border-slate-200"
            />
            <p className="text-xs text-slate-500 mt-1.5">L'email ne peut pas être modifié</p>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saving}
            variant="gradient"
            className="w-full shadow-lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder les modifications
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProfile;
