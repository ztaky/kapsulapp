import { useParams } from "react-router-dom";
import { useUserOrganizations } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function StudioStudents() {
  const { slug } = useParams<{ slug: string }>();
  const { organizations } = useUserOrganizations();
  const currentOrg = organizations.find((org) => org.slug === slug);

  const { data: students } = useQuery({
    queryKey: ["studio-students", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      const { data, error } = await supabase
        .from("organization_members")
        .select(`
          *,
          profiles(*)
        `)
        .eq("organization_id", currentOrg.id)
        .eq("role", "student");

      if (error) throw error;
      return data;
    },
    enabled: !!currentOrg?.id,
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header - Premium Style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/50 p-10 border border-slate-100 shadow-premium">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight mb-2">
            Communauté
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Gérez les apprenants de votre académie
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 shadow-premium bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Étudiant</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Inscription</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students?.map((member: any) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.profiles?.avatar_url} />
                      <AvatarFallback>
                        {member.profiles?.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{member.profiles?.full_name || "Sans nom"}</span>
                  </div>
                </TableCell>
                <TableCell>{member.profiles?.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">Actif</Badge>
                </TableCell>
                <TableCell>
                  {new Date(member.created_at).toLocaleDateString("fr-FR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {students?.length === 0 && (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 border-dashed bg-white/50">
          <div className="text-center">
            <p className="text-lg font-medium text-slate-900">Aucun étudiant</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Les étudiants apparaîtront ici après inscription
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
