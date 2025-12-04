import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, GraduationCap, Users, FileText, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  type: "course" | "student" | "landing_page";
  subtitle?: string;
}

interface GlobalSearchProps {
  organizationId: string;
}

export function GlobalSearch({ organizationId }: GlobalSearchProps) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data: results, isLoading } = useQuery({
    queryKey: ["global-search", organizationId, query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const searchTerm = `%${query}%`;
      const results: SearchResult[] = [];

      // Search courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, description")
        .eq("organization_id", organizationId)
        .ilike("title", searchTerm)
        .limit(5);

      if (courses) {
        results.push(
          ...courses.map((c) => ({
            id: c.id,
            title: c.title,
            type: "course" as const,
            subtitle: c.description?.substring(0, 50),
          }))
        );
      }

      // Search students
      const { data: members } = await supabase
        .from("organization_members")
        .select("user_id, profiles!inner(id, email, full_name)")
        .eq("organization_id", organizationId)
        .eq("role", "student")
        .limit(5);

      if (members) {
        const studentResults = members
          .filter((m: any) => {
            const profile = m.profiles;
            return (
              profile?.email?.toLowerCase().includes(query.toLowerCase()) ||
              profile?.full_name?.toLowerCase().includes(query.toLowerCase())
            );
          })
          .map((m: any) => ({
            id: m.user_id,
            title: m.profiles?.full_name || m.profiles?.email || "Étudiant",
            type: "student" as const,
            subtitle: m.profiles?.email,
          }));
        results.push(...studentResults);
      }

      // Search landing pages
      const { data: landingPages } = await supabase
        .from("landing_pages")
        .select("id, name, slug")
        .eq("organization_id", organizationId)
        .ilike("name", searchTerm)
        .limit(5);

      if (landingPages) {
        results.push(
          ...landingPages.map((lp) => ({
            id: lp.id,
            title: lp.name,
            type: "landing_page" as const,
            subtitle: `/${lp.slug}`,
          }))
        );
      }

      return results;
    },
    enabled: query.length >= 2,
  });

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      setQuery("");
      
      switch (result.type) {
        case "course":
          navigate(`/school/${slug}/studio/courses/${result.id}`);
          break;
        case "student":
          navigate(`/school/${slug}/studio/students`);
          break;
        case "landing_page":
          navigate(`/school/${slug}/studio/landing-pages/${result.id}/edit`);
          break;
      }
    },
    [navigate, slug]
  );

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "course":
        return <GraduationCap className="h-4 w-4" />;
      case "student":
        return <Users className="h-4 w-4" />;
      case "landing_page":
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "course":
        return "Formation";
      case "student":
        return "Étudiant";
      case "landing_page":
        return "Page de vente";
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg border border-border transition-colors w-full max-w-sm"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Rechercher...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher formations, étudiants, pages..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className="p-1">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto p-2">
            {isLoading && query.length >= 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Recherche en cours...
              </div>
            )}

            {!isLoading && query.length >= 2 && results?.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Aucun résultat pour "{query}"
              </div>
            )}

            {query.length < 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Tapez au moins 2 caractères pour rechercher
              </div>
            )}

            {results && results.length > 0 && (
              <div className="space-y-1">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left",
                      "hover:bg-accent transition-colors"
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {getTypeLabel(result.type)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
