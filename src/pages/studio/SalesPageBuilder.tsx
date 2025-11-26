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
    <div className="space-y-8 animate-fade-in">
      {/* Header - Premium Style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/50 p-10 border border-slate-100 shadow-premium">
        <div className="relative z-10 flex items-center gap-4">
          <div className="rounded-2xl bg-orange-100 text-orange-600 p-3 w-14 h-14 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight mb-1">
              Générateur de Page de Vente IA
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              Créez des pages de vente persuasives en quelques secondes avec l'IA
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="bg-white border border-slate-100 rounded-3xl shadow-premium">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#1e293b] tracking-tight">
              Informations du cours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="courseName" className="text-slate-900 font-medium text-sm">
                Nom du cours
              </Label>
              <Input
                id="courseName"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Ex: Maîtriser le Marketing Digital"
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience" className="text-slate-900 font-medium text-sm">
                Public cible
              </Label>
              <Input
                id="targetAudience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Ex: Entrepreneurs et freelances débutants"
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits" className="text-slate-900 font-medium text-sm">
                Bénéfices clés
              </Label>
              <Textarea
                id="benefits"
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                placeholder="Ex: Augmenter sa visibilité en ligne, générer plus de leads, maîtriser les réseaux sociaux..."
                rows={5}
                className="rounded-xl border-slate-200"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              variant="gradient"
              className="w-full shadow-lg"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
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
              <Card className="bg-white border border-slate-100 rounded-3xl shadow-premium">
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle className="text-lg font-bold text-[#1e293b] tracking-tight">
                    Titre et Sous-titre
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full hover:bg-slate-50"
                    onClick={() =>
                      copyToClipboard(
                        `${generatedContent.title}\n${generatedContent.subtitle}`,
                        "header"
                      )
                    }
                  >
                    {copiedSection === "header" ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-pink-50 border border-orange-100">
                    <h2 className="text-3xl font-bold mb-3 text-[#1e293b] tracking-tight leading-tight">
                      {generatedContent.title}
                    </h2>
                    <p className="text-lg text-slate-700 leading-relaxed">
                      {generatedContent.subtitle}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-100 rounded-3xl shadow-premium">
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle className="text-lg font-bold text-[#1e293b] tracking-tight">
                    Description
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full hover:bg-slate-50"
                    onClick={() =>
                      copyToClipboard(generatedContent.description, "description")
                    }
                  >
                    {copiedSection === "description" ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                    {generatedContent.description}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-100 rounded-3xl shadow-premium">
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle className="text-lg font-bold text-[#1e293b] tracking-tight">
                    Bénéfices
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full hover:bg-slate-50"
                    onClick={() =>
                      copyToClipboard(
                        generatedContent.benefits.map((b) => `${b.icon} ${b.text}`).join("\n"),
                        "benefits"
                      )
                    }
                  >
                    {copiedSection === "benefits" ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {generatedContent.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-4">
                        <div className="rounded-xl bg-orange-100 text-orange-600 p-2 w-10 h-10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">{benefit.icon}</span>
                        </div>
                        <span className="text-slate-700 leading-relaxed pt-1.5">{benefit.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-100 rounded-3xl shadow-premium">
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle className="text-lg font-bold text-[#1e293b] tracking-tight">
                    Témoignages
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full hover:bg-slate-50"
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
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedContent.testimonials.map((testimonial, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
                      <p className="italic mb-3 text-slate-700 leading-relaxed">"{testimonial.text}"</p>
                      <p className="text-sm font-semibold text-slate-900">
                        - {testimonial.name}, {testimonial.role}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 rounded-3xl shadow-premium">
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle className="text-lg font-bold text-[#1e293b] tracking-tight">
                    Call-to-Action
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full hover:bg-white/50"
                    onClick={() => copyToClipboard(generatedContent.cta, "cta")}
                  >
                    {copiedSection === "cta" ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <Button variant="gradient" size="lg" className="w-full shadow-lg">
                    {generatedContent.cta}
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="flex items-center justify-center h-full min-h-[500px] bg-white border border-slate-100 rounded-3xl shadow-premium">
              <CardContent className="text-center py-16">
                <div className="rounded-2xl bg-orange-100 text-orange-600 p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8" />
                </div>
                <p className="text-lg font-semibold text-slate-900 mb-2 tracking-tight">
                  Prêt à créer votre page de vente ?
                </p>
                <p className="text-slate-600 leading-relaxed max-w-md">
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
