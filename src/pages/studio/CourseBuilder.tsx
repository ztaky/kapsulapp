import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { ArrowLeft, Plus, Save, Sparkles, X } from "lucide-react";
import { ModuleAccordion } from "@/components/studio/ModuleAccordion";
import { CourseInfoCard } from "@/components/studio/CourseInfoCard";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Switch } from "@/components/ui/switch";

export default function CourseBuilder() {
  const { slug, courseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState("");
  const [marketingContent, setMarketingContent] = useState<any>({
    headline: "",
    subheadline: "",
    video_url: "",
    pain_points: [],
    benefits: [],
    author_bio: "",
    faq: [],
  });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (error) throw error;
      
      // Initialize states from DB
      if (data.payment_link_url) {
        setPaymentLinkUrl(data.payment_link_url);
      }
      if (data.marketing_content) {
        const mc = data.marketing_content as any;
        setMarketingContent({
          headline: mc.headline || "",
          subheadline: mc.subheadline || "",
          video_url: mc.video_url || "",
          pain_points: mc.pain_points || [],
          benefits: mc.benefits || [],
          author_bio: mc.author_bio || "",
          faq: mc.faq || [],
        });
      }
      
      return data;
    },
  });

  // Fetch modules with lessons
  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ["course-modules", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select(`
          *,
          lessons (*)
        `)
        .eq("course_id", courseId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (title: string) => {
      const position = modules ? modules.length : 0;
      const { data, error } = await supabase
        .from("modules")
        .insert({
          course_id: courseId,
          title,
          position,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
      toast.success("Module créé avec succès");
      setNewModuleTitle("");
      setIsModuleDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Update module positions mutation
  const updateModulePositionsMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; position: number }>) => {
      const promises = updates.map(({ id: moduleId, position }) =>
        supabase.from("modules").update({ position }).eq("id", moduleId)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
      toast.success("Ordre des modules mis à jour");
    },
  });

  // Toggle publish mutation
  const togglePublishMutation = useMutation({
    mutationFn: async (isPublished: boolean) => {
      const { error } = await supabase
        .from("courses")
        .update({ is_published: isPublished })
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      toast.success(course?.is_published ? "Cours dépublié" : "Cours publié");
    },
  });

  // Update payment link mutation
  const updatePaymentLinkMutation = useMutation({
    mutationFn: async (url: string) => {
      const { error } = await supabase
        .from("courses")
        .update({ payment_link_url: url })
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      toast.success("Lien de paiement enregistré");
    },
  });

  // Update marketing content mutation
  const updateMarketingContentMutation = useMutation({
    mutationFn: async (content: any) => {
      const { error } = await supabase
        .from("courses")
        .update({ marketing_content: content })
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      toast.success("Contenu marketing enregistré");
    },
  });

  // Generate AI content
  const handleGenerateWithAI = async () => {
    setIsGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-sales-page", {
        body: {
          courseTitle: course?.title,
          courseDescription: course?.description,
          modules: modules?.map((m: any) => ({
            title: m.title,
            lessons: m.lessons?.map((l: any) => l.title) || [],
          })),
        },
      });

      if (error) throw error;

      if (data?.content) {
        setMarketingContent(data.content);
        toast.success("Contenu généré avec l'IA !");
      }
    } catch (error: any) {
      toast.error("Erreur lors de la génération : " + error.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id && modules) {
      const oldIndex = modules.findIndex((m) => m.id === active.id);
      const newIndex = modules.findIndex((m) => m.id === over.id);

      const newModules = arrayMove(modules, oldIndex, newIndex);
      const updates = newModules.map((module, index) => ({
        id: module.id,
        position: index,
      }));

      updateModulePositionsMutation.mutate(updates);
    }
  };

  const addPainPoint = () => {
    setMarketingContent({
      ...marketingContent,
      pain_points: [...marketingContent.pain_points, ""],
    });
  };

  const removePainPoint = (index: number) => {
    const newPainPoints = [...marketingContent.pain_points];
    newPainPoints.splice(index, 1);
    setMarketingContent({ ...marketingContent, pain_points: newPainPoints });
  };

  const updatePainPoint = (index: number, value: string) => {
    const newPainPoints = [...marketingContent.pain_points];
    newPainPoints[index] = value;
    setMarketingContent({ ...marketingContent, pain_points: newPainPoints });
  };

  const addBenefit = () => {
    setMarketingContent({
      ...marketingContent,
      benefits: [...marketingContent.benefits, { icon: "✨", title: "", description: "" }],
    });
  };

  const removeBenefit = (index: number) => {
    const newBenefits = [...marketingContent.benefits];
    newBenefits.splice(index, 1);
    setMarketingContent({ ...marketingContent, benefits: newBenefits });
  };

  const updateBenefit = (index: number, field: string, value: string) => {
    const newBenefits = [...marketingContent.benefits];
    newBenefits[index][field] = value;
    setMarketingContent({ ...marketingContent, benefits: newBenefits });
  };

  const addFAQ = () => {
    setMarketingContent({
      ...marketingContent,
      faq: [...marketingContent.faq, { question: "", answer: "" }],
    });
  };

  const removeFAQ = (index: number) => {
    const newFAQ = [...marketingContent.faq];
    newFAQ.splice(index, 1);
    setMarketingContent({ ...marketingContent, faq: newFAQ });
  };

  const updateFAQ = (index: number, field: string, value: string) => {
    const newFAQ = [...marketingContent.faq];
    newFAQ[index][field] = value;
    setMarketingContent({ ...marketingContent, faq: newFAQ });
  };

  if (courseLoading || modulesLoading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/school/${slug}/studio/courses`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{course?.title}</h1>
                <p className="text-sm text-muted-foreground">Gérez votre cours</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="publish-toggle">Publié</Label>
                <Switch
                  id="publish-toggle"
                  checked={course?.is_published || false}
                  onCheckedChange={(checked) => togglePublishMutation.mutate(checked)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="curriculum" className="space-y-6">
          <TabsList>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="sales">Page de Vente</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Modules</h2>
              <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau module
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau module</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="module-title">Titre du module</Label>
                      <Input
                        id="module-title"
                        value={newModuleTitle}
                        onChange={(e) => setNewModuleTitle(e.target.value)}
                        placeholder="Ex: Introduction à React"
                      />
                    </div>
                    <Button
                      onClick={() => createModuleMutation.mutate(newModuleTitle)}
                      disabled={!newModuleTitle || createModuleMutation.isPending}
                      className="w-full"
                    >
                      Créer le module
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {modules && modules.length > 0 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {modules.map((module: any) => (
                      <ModuleAccordion key={module.id} module={module} courseId={courseId!} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">Aucun module pour le moment</p>
                  <Button onClick={() => setIsModuleDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer votre premier module
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sales Page Tab */}
          <TabsContent value="sales" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Contenu Marketing</h2>
                <p className="text-sm text-muted-foreground">Configurez votre page de vente</p>
              </div>
              <Button onClick={handleGenerateWithAI} disabled={isGeneratingAI}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isGeneratingAI ? "Génération..." : "Remplir avec l'IA"}
              </Button>
            </div>

            {/* Hero Section */}
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>Le premier élément visible de votre page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="headline">Titre accrocheur</Label>
                  <Input
                    id="headline"
                    value={marketingContent.headline}
                    onChange={(e) => setMarketingContent({ ...marketingContent, headline: e.target.value })}
                    placeholder="Ex: Devenez développeur React en 8 semaines"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subheadline">Sous-titre</Label>
                  <Textarea
                    id="subheadline"
                    value={marketingContent.subheadline}
                    onChange={(e) => setMarketingContent({ ...marketingContent, subheadline: e.target.value })}
                    placeholder="Ex: Une formation complète et pratique pour maîtriser React de A à Z"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video_url">URL Vidéo (YouTube/Vimeo)</Label>
                  <Input
                    id="video_url"
                    value={marketingContent.video_url}
                    onChange={(e) => setMarketingContent({ ...marketingContent, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/embed/..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pain Points */}
            <Card>
              <CardHeader>
                <CardTitle>Pain Points (problèmes)</CardTitle>
                <CardDescription>Les difficultés que rencontrent vos prospects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {marketingContent.pain_points.map((pain: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={pain}
                      onChange={(e) => updatePainPoint(index, e.target.value)}
                      placeholder="Ex: Difficile de trouver un emploi sans portfolio"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removePainPoint(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addPainPoint} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un problème
                </Button>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Bénéfices clés</CardTitle>
                <CardDescription>Ce que vos étudiants vont obtenir</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {marketingContent.benefits.map((benefit: any, index: number) => (
                  <div key={index} className="space-y-3 p-4 border border-border rounded-lg">
                    <div className="flex justify-between items-center">
                      <Label>Bénéfice {index + 1}</Label>
                      <Button variant="ghost" size="icon" onClick={() => removeBenefit(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={benefit.icon}
                      onChange={(e) => updateBenefit(index, "icon", e.target.value)}
                      placeholder="Emoji (ex: 🎯)"
                      className="w-24"
                    />
                    <Input
                      value={benefit.title}
                      onChange={(e) => updateBenefit(index, "title", e.target.value)}
                      placeholder="Titre du bénéfice"
                    />
                    <Textarea
                      value={benefit.description}
                      onChange={(e) => updateBenefit(index, "description", e.target.value)}
                      placeholder="Description détaillée"
                      rows={2}
                    />
                  </div>
                ))}
                <Button variant="outline" onClick={addBenefit} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un bénéfice
                </Button>
              </CardContent>
            </Card>

            {/* Author Bio */}
            <Card>
              <CardHeader>
                <CardTitle>À propos du formateur</CardTitle>
                <CardDescription>Présentez-vous et établissez votre crédibilité</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={marketingContent.author_bio}
                  onChange={(e) => setMarketingContent({ ...marketingContent, author_bio: e.target.value })}
                  placeholder="Parlez de votre expérience, vos réalisations, pourquoi vous êtes qualifié..."
                  rows={6}
                />
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card>
              <CardHeader>
                <CardTitle>FAQ</CardTitle>
                <CardDescription>Répondez aux questions fréquentes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {marketingContent.faq.map((item: any, index: number) => (
                  <div key={index} className="space-y-3 p-4 border border-border rounded-lg">
                    <div className="flex justify-between items-center">
                      <Label>Question {index + 1}</Label>
                      <Button variant="ghost" size="icon" onClick={() => removeFAQ(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={item.question}
                      onChange={(e) => updateFAQ(index, "question", e.target.value)}
                      placeholder="Question"
                    />
                    <Textarea
                      value={item.answer}
                      onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                      placeholder="Réponse"
                      rows={3}
                    />
                  </div>
                ))}
                <Button variant="outline" onClick={addFAQ} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une question
                </Button>
              </CardContent>
            </Card>

            <Button
              onClick={() => updateMarketingContentMutation.mutate(marketingContent)}
              disabled={updateMarketingContentMutation.isPending}
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              Enregistrer le contenu marketing
            </Button>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <CourseInfoCard 
              course={course} 
              courseId={courseId!} 
              paymentLinkUrl={paymentLinkUrl}
              setPaymentLinkUrl={setPaymentLinkUrl}
              updatePaymentLinkMutation={updatePaymentLinkMutation}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
