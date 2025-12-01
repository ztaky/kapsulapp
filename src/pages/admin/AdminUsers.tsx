import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Search,
  GraduationCap,
  UserCheck,
  Crown,
  Mail,
  Ban,
  Trash2,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface UnifiedUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: "coach" | "student" | "super_admin";
  organization_name: string | null;
  organization_id: string | null;
  created_at: string;
  courses_count: number;
}

const AdminUsers = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setLoading(true);

    try {
      // Fetch coaches and students from organization_members
      const { data: orgMembers, error: orgError } = await supabase
        .from("organization_members")
        .select(`
          id,
          user_id,
          role,
          created_at,
          profiles!inner(email, full_name),
          organizations!inner(id, name, courses(id))
        `);

      if (orgError) throw orgError;

      // Fetch super admins from user_roles
      const { data: superAdmins, error: adminError } = await supabase
        .from("user_roles")
        .select(`
          id,
          user_id,
          created_at,
          profiles:user_id(email, full_name)
        `)
        .eq("role", "super_admin");

      if (adminError) throw adminError;

      // Process organization members
      const membersProcessed: UnifiedUser[] = (orgMembers || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        email: item.profiles.email,
        full_name: item.profiles.full_name,
        role: item.role as "coach" | "student",
        organization_name: item.organizations.name,
        organization_id: item.organizations.id,
        created_at: item.created_at,
        courses_count: item.organizations.courses?.length || 0,
      }));

      // Process super admins
      const adminsProcessed: UnifiedUser[] = (superAdmins || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        email: item.profiles?.email || "N/A",
        full_name: item.profiles?.full_name || null,
        role: "super_admin" as const,
        organization_name: null,
        organization_id: null,
        created_at: item.created_at,
        courses_count: 0,
      }));

      // Combine and dedupe by user_id (prefer organization member over super_admin if both exist)
      const allUsers = [...membersProcessed, ...adminsProcessed];
      const uniqueUsers = allUsers.reduce((acc, user) => {
        const existing = acc.find((u) => u.user_id === user.user_id && u.role === user.role);
        if (!existing) acc.push(user);
        return acc;
      }, [] as UnifiedUser[]);

      // Sort by created_at desc
      uniqueUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setUsers(uniqueUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.organization_name?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    coaches: users.filter((u) => u.role === "coach").length,
    students: users.filter((u) => u.role === "student").length,
    admins: users.filter((u) => u.role === "super_admin").length,
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleBulkEmail = () => {
    toast.info(`Envoi d'email à ${selectedUsers.size} utilisateur(s) - Fonctionnalité à venir`);
  };

  const handleBulkSuspend = () => {
    toast.info(`Suspension de ${selectedUsers.size} utilisateur(s) - Fonctionnalité à venir`);
  };

  const handleBulkDelete = () => {
    toast.info(`Suppression de ${selectedUsers.size} utilisateur(s) - Fonctionnalité à venir`);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "coach":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <GraduationCap className="w-3 h-3 mr-1" />
            Coach
          </Badge>
        );
      case "student":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <UserCheck className="w-3 h-3 mr-1" />
            Étudiant
          </Badge>
        );
      case "super_admin":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <Crown className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      default:
        return null;
    }
  };

  const getAvatarGradient = (role: string) => {
    switch (role) {
      case "coach":
        return "from-emerald-600 to-green-600";
      case "student":
        return "from-blue-600 to-cyan-600";
      case "super_admin":
        return "from-amber-500 to-orange-600";
      default:
        return "from-slate-600 to-slate-700";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Utilisateurs</h1>
        <p className="text-slate-500">Vue unifiée de tous les utilisateurs de la plateforme</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.coaches}</p>
                <p className="text-xs text-slate-500">Coachs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.students}</p>
                <p className="text-xs text-slate-500">Étudiants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.admins}</p>
                <p className="text-xs text-slate-500">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher par nom, email ou académie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px] bg-white border-slate-200 text-slate-800">
            <SelectValue placeholder="Filtrer par rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="coach">Coachs</SelectItem>
            <SelectItem value="student">Étudiants</SelectItem>
            <SelectItem value="super_admin">Super Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-medium text-slate-700">
            {selectedUsers.size} utilisateur(s) sélectionné(s)
          </span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={handleBulkEmail} className="gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Button>
            <Button size="sm" variant="outline" onClick={handleBulkSuspend} className="gap-2 text-amber-600 hover:text-amber-700">
              <Ban className="w-4 h-4" />
              Suspendre
            </Button>
            <Button size="sm" variant="outline" onClick={handleBulkDelete} className="gap-2 text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
              Supprimer
            </Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-800 flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              {filteredUsers.length} utilisateur{filteredUsers.length !== 1 && "s"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                    <th className="pb-3 pr-4 w-10">
                      <Checkbox
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={toggleAllSelection}
                      />
                    </th>
                    <th className="pb-3 font-medium">Utilisateur</th>
                    <th className="pb-3 font-medium">Rôle</th>
                    <th className="pb-3 font-medium">Académie</th>
                    <th className="pb-3 font-medium">Inscrit le</th>
                    <th className="pb-3 font-medium w-10">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 pr-4">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(
                              user.role
                            )} flex items-center justify-center`}
                          >
                            <span className="text-white font-semibold text-sm">
                              {user.full_name?.charAt(0).toUpperCase() ||
                                user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">
                              {user.full_name || "Sans nom"}
                            </p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">{getRoleBadge(user.role)}</td>
                      <td className="py-4">
                        {user.organization_name ? (
                          <span className="text-sm text-slate-600">{user.organization_name}</span>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-4 text-sm text-slate-500">
                        {new Date(user.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <Eye className="w-4 h-4" />
                              Voir le profil
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Mail className="w-4 h-4" />
                              Envoyer un email
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-amber-600">
                              <Ban className="w-4 h-4" />
                              Suspendre
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-red-600">
                              <Trash2 className="w-4 h-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        Aucun utilisateur trouvé
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

export default AdminUsers;
