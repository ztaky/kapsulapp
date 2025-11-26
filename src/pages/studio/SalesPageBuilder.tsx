import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";

type SalesPageContent = {
  title: string;
  subtitle: string;
  description: string;
  benefits: Array<{ icon: string; text: string }>;
  cta: string;
  testimonials: Array<{ name: string; role: string; text: string }>;
};

export default function SalesPageBuilder() {
  const { slug, courseId } = useParams();
  const navigate = useNavigate();
  const [courseName, setCourseName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [benefits, setBenefits] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<SalesPageContent | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const handleGenerate = async () => {
    if (!courseName.trim() || !targetAudience.trim() || !benefits.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sales-page`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            courseName,
            targetAudience,
            benefits,
            currentDescription: course?.description || "",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la génération");
      }

      const content = await response.json();
      setGeneratedContent(content);
      toast.success("Page de vente générée avec succès !");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de la génération de la page");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast.success("Copié dans le presse-papier");
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Générateur de Page de Vente IA</h1>
        </div>
        <p className="text-muted-foreground">
          Créez des pages de vente persuasives en quelques secondes avec l'IA
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du cours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="courseName">Nom du cours</Label>
              <Input
                id="courseName"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Ex: Maîtriser le Marketing Digital"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">Public cible</Label>
              <Input
                id="targetAudience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Ex: Entrepreneurs et freelances débutants"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits">Bénéfices clés</Label>
              <Textarea
                id="benefits"
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                placeholder="Ex: Augmenter sa visibilité en ligne, générer plus de leads, maîtriser les réseaux sociaux..."
                rows={4}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Générer la page de vente
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="space-y-6">
          {generatedContent ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle>Titre et Sous-titre</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        `${generatedContent.title}\n${generatedContent.subtitle}`,
                        "header"
                      )
                    }
                  >
                    {copiedSection === "header" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <h2 className="text-3xl font-bold mb-2">{generatedContent.title}</h2>
                  <p className="text-xl text-muted-foreground">
                    {generatedContent.subtitle}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle>Description</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(generatedContent.description, "description")
                    }
                  >
                    {copiedSection === "description" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{generatedContent.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle>Bénéfices</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        generatedContent.benefits.map((b) => `${b.icon} ${b.text}`).join("\n"),
                        "benefits"
                      )
                    }
                  >
                    {copiedSection === "benefits" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {generatedContent.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-2xl">{benefit.icon}</span>
                        <span>{benefit.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle>Témoignages</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        generatedContent.testimonials
                          .map((t) => `"${t.text}" - ${t.name}, ${t.role}`)
                          .join("\n\n"),
                        "testimonials"
                      )
                    }
                  >
                    {copiedSection === "testimonials" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedContent.testimonials.map((testimonial, idx) => (
                    <div key={idx} className="p-4 bg-muted rounded-lg">
                      <p className="italic mb-2">"{testimonial.text}"</p>
                      <p className="text-sm font-medium">
                        - {testimonial.name}, {testimonial.role}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle>Call-to-Action</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedContent.cta, "cta")}
                  >
                    {copiedSection === "cta" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <Button size="lg" className="w-full">
                    {generatedContent.cta}
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="flex items-center justify-center h-full min-h-[400px]">
              <CardContent className="text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Remplissez le formulaire et cliquez sur "Générer" pour créer votre page
                  de vente
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
