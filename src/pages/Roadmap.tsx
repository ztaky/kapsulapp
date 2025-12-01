import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, CheckCircle2, Clock, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KapsulFooter } from "@/components/landing/KapsulFooter";
import kapsulLogo from "@/assets/kapsul-logo.png";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  status: "planned" | "in_progress" | "completed";
  category: string | null;
  votes_count: number;
  release_date: string | null;
  position: number;
}

const statusConfig = {
  planned: {
    label: "À venir",
    icon: Clock,
    color: "bg-muted text-muted-foreground",
    columnColor: "border-muted-foreground/30",
  },
  in_progress: {
    label: "En cours",
    icon: Rocket,
    color: "bg-amber-100 text-amber-700",
    columnColor: "border-amber-500",
  },
  completed: {
    label: "Terminé",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700",
    columnColor: "border-green-500",
  },
};

export default function Roadmap() {
  const { data: items, isLoading } = useQuery({
    queryKey: ["public-roadmap"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roadmap_items")
        .select("*")
        .eq("is_visible", true)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as RoadmapItem[];
    },
  });

  const groupedItems = {
    planned: items?.filter((i) => i.status === "planned") || [],
    in_progress: items?.filter((i) => i.status === "in_progress") || [],
    completed: items?.filter((i) => i.status === "completed") || [],
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={kapsulLogo} alt="Kapsul" className="h-8 w-8" />
              <span className="text-lg font-bold text-foreground">KAPSUL</span>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Roadmap <span className="gradient-text">Kapsul</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez les fonctionnalités sur lesquelles nous travaillons et ce qui arrive bientôt.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          /* Kanban Board */
          <div className="grid md:grid-cols-3 gap-6">
            {(["planned", "in_progress", "completed"] as const).map((status) => {
              const config = statusConfig[status];
              const StatusIcon = config.icon;
              const columnItems = groupedItems[status];

              return (
                <div key={status} className="space-y-4">
                  {/* Column Header */}
                  <div className={`flex items-center gap-2 pb-3 border-b-2 ${config.columnColor}`}>
                    <StatusIcon className="w-5 h-5" />
                    <h2 className="font-semibold text-foreground">{config.label}</h2>
                    <Badge variant="secondary" className="ml-auto">
                      {columnItems.length}
                    </Badge>
                  </div>

                  {/* Items */}
                  <div className="space-y-3">
                    {columnItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Aucun élément
                      </p>
                    ) : (
                      columnItems.map((item) => (
                        <Card key={item.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base">{item.title}</CardTitle>
                              {item.category && (
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {item.category}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          {(item.description || item.release_date) && (
                            <CardContent className="pt-0">
                              {item.description && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {item.description}
                                </p>
                              )}
                              {item.release_date && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {format(new Date(item.release_date), "MMMM yyyy", { locale: fr })}
                                </div>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <KapsulFooter />
    </div>
  );
}
