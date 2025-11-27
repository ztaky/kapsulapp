import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, ThumbsUp, HelpCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  views_count: number;
  helpful_count: number;
}

const categoryLabels: Record<string, string> = {
  technique: "Technique",
  facturation: "Facturation",
  compte: "Compte",
  formation: "Formation",
  autre: "Autre",
};

const categoryColors: Record<string, string> = {
  technique: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  facturation: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  compte: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  formation: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  autre: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
};

export default function FAQ() {
  const [faqEntries, setFaqEntries] = useState<FAQEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [helpfulClicked, setHelpfulClicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFAQ();
  }, []);

  const fetchFAQ = async () => {
    try {
      const { data, error } = await supabase
        .from("faq_entries")
        .select("id, question, answer, category, views_count, helpful_count")
        .eq("is_published", true)
        .order("helpful_count", { ascending: false });

      if (error) throw error;
      setFaqEntries(data || []);
    } catch (error) {
      console.error("Error fetching FAQ:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id: string) => {
    try {
      await supabase.rpc("increment_faq_views", { faq_id: id });
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  const handleHelpful = async (id: string) => {
    if (helpfulClicked.has(id)) return;

    try {
      await supabase.rpc("increment_faq_helpful", { faq_id: id });
      setHelpfulClicked((prev) => new Set(prev).add(id));
      setFaqEntries((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, helpful_count: e.helpful_count + 1 } : e
        )
      );
      toast.success("Merci pour votre retour !");
    } catch (error) {
      console.error("Error incrementing helpful:", error);
    }
  };

  const filteredEntries = faqEntries.filter((entry) => {
    const matchesSearch =
      entry.question.toLowerCase().includes(search.toLowerCase()) ||
      entry.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      !selectedCategory || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(faqEntries.map((e) => e.category).filter(Boolean))];

  // Group by category
  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    const cat = entry.category || "autre";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(entry);
    return acc;
  }, {} as Record<string, FAQEntry[]>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Centre d'aide</h1>
              <p className="text-muted-foreground">
                Trouvez des réponses à vos questions
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher une question..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 text-lg"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Toutes
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
            >
              {categoryLabels[cat!] || cat}
            </Button>
          ))}
        </div>

        {/* FAQ Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun résultat</h3>
              <p className="text-muted-foreground">
                Essayez avec d'autres mots-clés ou consultez toutes les catégories
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedEntries).map(([category, entries]) => (
              <div key={category}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Badge className={categoryColors[category] || categoryColors.autre}>
                    {categoryLabels[category] || category}
                  </Badge>
                  <span className="text-muted-foreground text-sm font-normal">
                    ({entries.length})
                  </span>
                </h2>
                <Card>
                  <Accordion type="single" collapsible className="w-full">
                    {entries.map((entry, index) => (
                      <AccordionItem
                        key={entry.id}
                        value={entry.id}
                        className={index === entries.length - 1 ? "border-b-0" : ""}
                      >
                        <AccordionTrigger
                          onClick={() => handleView(entry.id)}
                          className="px-6 text-left hover:no-underline"
                        >
                          <span className="font-medium">{entry.question}</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                          <p className="text-muted-foreground whitespace-pre-wrap mb-4">
                            {entry.answer}
                          </p>
                          <div className="flex items-center justify-between pt-4 border-t">
                            <span className="text-sm text-muted-foreground">
                              Cette réponse vous a-t-elle été utile ?
                            </span>
                            <Button
                              variant={helpfulClicked.has(entry.id) ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleHelpful(entry.id)}
                              disabled={helpfulClicked.has(entry.id)}
                            >
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              Utile ({entry.helpful_count})
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Contact CTA */}
        <Card className="mt-12 bg-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">
              Vous n'avez pas trouvé votre réponse ?
            </h3>
            <p className="text-muted-foreground mb-4">
              Notre équipe de support est là pour vous aider
            </p>
            <Link to="/auth">
              <Button>Contacter le support</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
