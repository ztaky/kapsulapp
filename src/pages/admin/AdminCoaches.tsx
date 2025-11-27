import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Coach {
  id: string;
  user_id: string;
  created_at: string;
  profile: {
    email: string;
    full_name: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  courses_count: number;
}

const AdminCoaches = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("organization_members")
      .select(`
        id,
        user_id,
        created_at,
        profiles!inner(email, full_name),
        organizations!inner(id, name, slug, courses(id))
      `)
      .eq("role", "coach");

    if (error) {
      console.error("Error fetching coaches:", error);
      toast.error("Erreur lors du chargement des coachs");
    }

    const processed = data?.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      created_at: item.created_at,
      profile: {
        email: item.profiles.email,
        full_name: item.profiles.full_name,
      },
      organization: {
        id: item.organizations.id,
        name: item.organizations.name,
        slug: item.organizations.slug,
      },
      courses_count: item.organizations.courses?.length || 0,
    })) || [];

    setCoaches(processed);
    setLoading(false);
  };

  const filteredCoaches = coaches.filter(coach =>
    coach.profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (coach.profile.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    coach.organization.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Coachs</h1>
        <p className="text-slate-400">Tous les formateurs de la plateforme</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Rechercher un coach..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 bg-slate-800 mb-2" />
                <Skeleton className="h-4 w-32 bg-slate-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-500" />
              {filteredCoaches.length} coach{filteredCoaches.length !== 1 && "s"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-sm text-slate-500">
                    <th className="pb-3 font-medium">Coach</th>
                    <th className="pb-3 font-medium">Académie</th>
                    <th className="pb-3 font-medium">Formations</th>
                    <th className="pb-3 font-medium">Inscrit le</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoaches.map((coach) => (
                    <tr key={coach.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {coach.profile.full_name?.charAt(0).toUpperCase() || coach.profile.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-white">{coach.profile.full_name || "Sans nom"}</p>
                            <p className="text-sm text-slate-500">{coach.profile.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                          {coach.organization.name}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-white font-semibold">{coach.courses_count}</span>
                        <span className="text-slate-500 ml-1">cours</span>
                      </td>
                      <td className="py-4 text-sm text-slate-400">
                        {new Date(coach.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/school/${coach.organization.slug}/studio`)}
                          className="text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Studio
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredCoaches.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Aucun coach trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminCoaches;
