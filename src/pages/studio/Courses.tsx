import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUserOrganizations } from "@/hooks/useUserRole";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { CourseTable } from "@/components/studio/CourseTable";
import { CourseCoverUploader } from "@/components/studio/CourseCoverUploader";
import { CourseAIWizardDialog, GeneratedCourseData } from "@/components/studio/CourseAIWizardDialog";
import { CourseAIPreview } from "@/components/studio/CourseAIPreview";

export default function StudioCourses() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { organizations } = useUserOrganizations();
  const currentOrg = organizations.find((org) => org.slug === slug);
  const queryClient = useQueryClient();
  
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [aiWizardOpen, setAiWizardOpen] = useState(false);
  const [aiPreviewOpen, setAiPreviewOpen] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourseData | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "0",
    cover_image: "",
  });

  const { data: courses, isLoading } = useQuery({
    queryKey: ["studio-courses", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          purchases(count),
          modules(count)
        `)
        .eq("organization_id", currentOrg.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!currentOrg?.id,
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!currentOrg?.id) throw new Error("Organization not found");

      const { data: course, error } = await supabase
        .from("courses")
        .insert({
          organization_id: currentOrg.id,
          title: data.title,
          description: data.description,
          price: parseFloat(data.price),
          cover_image: data.cover_image || null,
        })
        .select()
        .single();

      if (error) throw error;
      return course;
    },
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ["studio-courses"] });
      toast({ title: "Formation créée avec succès" });
      setManualDialogOpen(false);
      setFormData({ title: "", description: "", price: "0", cover_image: "" });
      navigate(`/school/${slug}/studio/courses/${course.id}/curriculum`);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la formation",
        variant: "destructive",
      });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-courses"] });
      toast({ title: "Formation supprimée avec succès" });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la formation",
        variant: "destructive",
      });
    },
  });

  const handleCourseGenerated = (courseData: GeneratedCourseData) => {
    setGeneratedCourse(courseData);
    setAiWizardOpen(false);
    setAiPreviewOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header - Premium Style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/50 p-10 border border-slate-100 shadow-premium">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-[#1e293b] tracking-tight">
              Mes Formations
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              Créez et gérez vos cours en ligne. Partagez votre expertise avec le monde.
            </p>
          </div>
          
          {/* Two buttons */}
          <div className="flex items-center gap-3">
            <Button 
              variant="gradient" 
              size="lg" 
              className="shadow-lg"
              onClick={() => setAiWizardOpen(true)}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Créer avec IA
            </Button>
            
            <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="border-slate-200">
                  <Plus className="mr-2 h-5 w-5" />
                  Créer manuellement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-white rounded-3xl border border-slate-100">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-[#1e293b] tracking-tight">Nouvelle formation</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createCourseMutation.mutate(formData);
                  }}
                  className="space-y-5 pt-4"
                >
                  <div>
                    <Label htmlFor="title" className="text-slate-900 font-medium text-sm">Titre *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1.5 rounded-xl border-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-slate-900 font-medium text-sm">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1.5 rounded-xl border-slate-200"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price" className="text-slate-900 font-medium text-sm">Prix (€)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="mt-1.5 rounded-xl border-slate-200"
                    />
                  </div>
                  <CourseCoverUploader
                    value={formData.cover_image}
                    onChange={(url) => setFormData({ ...formData, cover_image: url })}
                    organizationId={currentOrg?.id}
                  />
                  <Button 
                    type="submit" 
                    variant="gradient" 
                    className="w-full mt-6" 
                    disabled={createCourseMutation.isPending}
                    size="lg"
                  >
                    {createCourseMutation.isPending ? "Création..." : "Créer la formation"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 shadow-premium">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-sm font-medium text-slate-500 tracking-tight">Total</p>
            <p className="text-3xl font-bold text-slate-900 tracking-tight">{courses?.length || 0}</p>
          </div>
          <div className="h-12 w-px bg-slate-200" />
          <div>
            <p className="text-sm font-medium text-slate-500 tracking-tight">Publiées</p>
            <p className="text-3xl font-bold text-orange-600 tracking-tight">
              {courses?.filter(c => c.is_published).length || 0}
            </p>
          </div>
        </div>
      </div>

      <CourseTable 
        courses={courses || []} 
        isLoading={isLoading} 
        organizationSlug={slug || ""} 
        onDelete={(courseId) => deleteCourseMutation.mutate(courseId)}
      />

      {/* AI Wizard Dialog */}
      <CourseAIWizardDialog
        open={aiWizardOpen}
        onOpenChange={setAiWizardOpen}
        onCourseGenerated={handleCourseGenerated}
      />

      {/* AI Preview Dialog */}
      <CourseAIPreview
        open={aiPreviewOpen}
        onOpenChange={setAiPreviewOpen}
        courseData={generatedCourse}
        organizationId={currentOrg?.id || ""}
        organizationSlug={slug || ""}
      />
    </div>
  );
}
