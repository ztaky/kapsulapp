import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Student {
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
  purchases_count: number;
}

interface Organization {
  id: string;
  name: string;
}

const AdminStudents = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch organizations for filter
    const { data: orgsData } = await supabase
      .from("organizations")
      .select("id, name")
      .order("name");

    setOrganizations(orgsData || []);

    // Fetch students
    const { data, error } = await supabase
      .from("organization_members")
      .select(`
        id,
        user_id,
        created_at,
        profiles!inner(email, full_name),
        organizations!inner(id, name, slug)
      `)
      .eq("role", "student");

    if (error) {
      console.error("Error fetching students:", error);
      toast.error("Erreur lors du chargement des étudiants");
    }

    // Fetch purchases count per user
    const userIds = data?.map((item: any) => item.user_id) || [];
    const { data: purchasesData } = await supabase
      .from("purchases")
      .select("user_id")
      .in("user_id", userIds);

    const purchasesCount: Record<string, number> = {};
    purchasesData?.forEach((p: any) => {
      purchasesCount[p.user_id] = (purchasesCount[p.user_id] || 0) + 1;
    });

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
      purchases_count: purchasesCount[item.user_id] || 0,
    })) || [];

    setStudents(processed);
    setLoading(false);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.profile.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    const matchesOrg = selectedOrg === "all" || student.organization.id === selectedOrg;
    
    return matchesSearch && matchesOrg;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Étudiants</h1>
        <p className="text-slate-400">Tous les apprenants de la plateforme</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Rechercher un étudiant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={selectedOrg} onValueChange={setSelectedOrg}>
          <SelectTrigger className="w-64 bg-slate-900 border-slate-800 text-white">
            <SelectValue placeholder="Filtrer par académie" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all" className="text-white hover:bg-slate-800">Toutes les académies</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id} className="text-white hover:bg-slate-800">
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
              <Users className="h-5 w-5 text-cyan-500" />
              {filteredStudents.length} étudiant{filteredStudents.length !== 1 && "s"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-sm text-slate-500">
                    <th className="pb-3 font-medium">Étudiant</th>
                    <th className="pb-3 font-medium">Académie</th>
                    <th className="pb-3 font-medium">Formations achetées</th>
                    <th className="pb-3 font-medium">Inscrit le</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {student.profile.full_name?.charAt(0).toUpperCase() || student.profile.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-white">{student.profile.full_name || "Sans nom"}</p>
                            <p className="text-sm text-slate-500">{student.profile.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                          {student.organization.name}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-white font-semibold">{student.purchases_count}</span>
                        <span className="text-slate-500 ml-1">formation{student.purchases_count !== 1 && "s"}</span>
                      </td>
                      <td className="py-4 text-sm text-slate-400">
                        {new Date(student.created_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        Aucun étudiant trouvé
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

export default AdminStudents;
