import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, Search, RefreshCw, Filter, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  profile?: {
    email: string;
    full_name: string | null;
  };
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  course_created: { label: "Formation créée", color: "bg-green-500/20 text-green-400" },
  course_updated: { label: "Formation modifiée", color: "bg-blue-500/20 text-blue-400" },
  course_published: { label: "Formation publiée", color: "bg-purple-500/20 text-purple-400" },
  course_deleted: { label: "Formation supprimée", color: "bg-red-500/20 text-red-400" },
  organization_created: { label: "Académie créée", color: "bg-green-500/20 text-green-400" },
  organization_updated: { label: "Académie modifiée", color: "bg-blue-500/20 text-blue-400" },
  purchase_completed: { label: "Achat effectué", color: "bg-orange-500/20 text-orange-400" },
  member_joined: { label: "Membre rejoint", color: "bg-cyan-500/20 text-cyan-400" },
  member_left: { label: "Membre parti", color: "bg-slate-500/20 text-slate-400" },
  landing_page_created: { label: "Landing page créée", color: "bg-green-500/20 text-green-400" },
  landing_page_updated: { label: "Landing page modifiée", color: "bg-blue-500/20 text-blue-400" },
  landing_page_published: { label: "Landing page publiée", color: "bg-purple-500/20 text-purple-400" },
  role_granted: { label: "Rôle attribué", color: "bg-yellow-500/20 text-yellow-400" },
  role_revoked: { label: "Rôle révoqué", color: "bg-red-500/20 text-red-400" },
  user_login: { label: "Connexion", color: "bg-green-500/20 text-green-400" },
  user_signup: { label: "Inscription", color: "bg-cyan-500/20 text-cyan-400" },
};

const ENTITY_LABELS: Record<string, string> = {
  course: "Formation",
  organization: "Académie",
  purchase: "Achat",
  organization_member: "Membre",
  landing_page: "Landing Page",
  user_role: "Rôle",
  user: "Utilisateur",
};

const AdminLogs = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 50;

  useEffect(() => {
    fetchLogs(true);
  }, [actionFilter, entityFilter]);

  const fetchLogs = async (reset = false) => {
    if (reset) {
      setPage(0);
      setLogs([]);
    }
    
    setLoading(true);

    let query = supabase
      .from("activity_logs")
      .select(`
        id,
        user_id,
        action,
        entity_type,
        entity_id,
        metadata,
        created_at,
        profiles(email, full_name)
      `)
      .order("created_at", { ascending: false })
      .range(reset ? 0 : page * pageSize, (reset ? 0 : page) * pageSize + pageSize - 1);

    if (actionFilter !== "all") {
      query = query.eq("action", actionFilter);
    }

    if (entityFilter !== "all") {
      query = query.eq("entity_type", entityFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching logs:", error);
      toast.error("Erreur lors du chargement des logs");
    }

    const processed = data?.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      action: item.action,
      entity_type: item.entity_type,
      entity_id: item.entity_id,
      metadata: item.metadata || {},
      created_at: item.created_at,
      profile: item.profiles ? {
        email: item.profiles.email,
        full_name: item.profiles.full_name,
      } : undefined,
    })) || [];

    if (reset) {
      setLogs(processed);
    } else {
      setLogs(prev => [...prev, ...processed]);
    }
    
    setHasMore(processed.length === pageSize);
    setLoading(false);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
    fetchLogs(false);
  };

  const getActionInfo = (action: string) => {
    return ACTION_LABELS[action] || { label: action, color: "bg-slate-500/20 text-slate-400" };
  };

  const formatMetadata = (metadata: Record<string, any>) => {
    const entries = Object.entries(metadata).filter(([key]) => !key.startsWith("_"));
    if (entries.length === 0) return null;
    
    return entries.map(([key, value]) => {
      if (key === "amount") return `${value}€`;
      if (key === "role") return value === "super_admin" ? "Super Admin" : value === "coach" ? "Coach" : "Étudiant";
      return String(value);
    }).join(" • ");
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.profile?.email?.toLowerCase().includes(search) ||
      log.profile?.full_name?.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      JSON.stringify(log.metadata).toLowerCase().includes(search)
    );
  });

  const uniqueActions = [...new Set(logs.map(l => l.action))];
  const uniqueEntities = [...new Set(logs.map(l => l.entity_type).filter(Boolean))];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Logs d'activité</h1>
          <p className="text-slate-400">Historique de toutes les actions sur la plateforme</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchLogs(true)}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
            disabled
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Analyser avec l'IA
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Rechercher dans les logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
          />
        </div>
        
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48 bg-slate-900 border-slate-800 text-white">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all" className="text-white hover:bg-slate-800">Toutes les actions</SelectItem>
            {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
              <SelectItem key={key} value={key} className="text-white hover:bg-slate-800">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-48 bg-slate-900 border-slate-800 text-white">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all" className="text-white hover:bg-slate-800">Tous les types</SelectItem>
            {Object.entries(ENTITY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key} className="text-white hover:bg-slate-800">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Logs list */}
      {loading && logs.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48 bg-slate-800" />
                  <Skeleton className="h-3 w-32 bg-slate-800" />
                </div>
                <Skeleton className="h-6 w-24 bg-slate-800" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-orange-500" />
              {filteredLogs.length} événement{filteredLogs.length !== 1 && "s"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-800">
              {filteredLogs.map((log) => {
                const actionInfo = getActionInfo(log.action);
                const metadataStr = formatMetadata(log.metadata);
                
                return (
                  <div key={log.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">
                          {log.profile?.full_name?.charAt(0).toUpperCase() || 
                           log.profile?.email?.charAt(0).toUpperCase() || 
                           "?"}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-white">
                            {log.profile?.full_name || log.profile?.email || "Système"}
                          </span>
                          <Badge className={`${actionInfo.color} border-0`}>
                            {actionInfo.label}
                          </Badge>
                          {log.entity_type && (
                            <span className="text-slate-500 text-sm">
                              {ENTITY_LABELS[log.entity_type] || log.entity_type}
                            </span>
                          )}
                        </div>
                        
                        {metadataStr && (
                          <p className="text-slate-400 text-sm mt-1 truncate">
                            {metadataStr}
                          </p>
                        )}
                        
                        {log.profile?.email && log.profile?.full_name && (
                          <p className="text-slate-500 text-xs mt-1">
                            {log.profile.email}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className="text-slate-400 text-sm">
                          {format(new Date(log.created_at), "dd MMM yyyy", { locale: fr })}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {format(new Date(log.created_at), "HH:mm:ss", { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredLogs.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  Aucun log trouvé
                </div>
              )}
            </div>
            
            {hasMore && filteredLogs.length > 0 && (
              <div className="p-4 border-t border-slate-800">
                <Button
                  variant="ghost"
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  {loading ? "Chargement..." : "Charger plus"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminLogs;
