import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUserOrganizations } from "@/hooks/useUserRole";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { CourseTable } from "@/components/studio/CourseTable";

export default function StudioCourses() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { organizations } = useUserOrganizations();
  const currentOrg = organizations.find((org) => org.slug === slug);
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
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
      setDialogOpen(false);
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header - Style Warm Premium */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-10 border border-slate-200 shadow-card">
        <div className="relative z-10 flex items-center justify-between">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-extrabold mb-4 text-slate-900 leading-tight">
              Mes Formations
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Créez et gérez vos cours en ligne. Partagez votre expertise avec le monde.
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Nouvelle Formation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-900">Nouvelle formation</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createCourseMutation.mutate(formData);
                }}
                className="space-y-5 pt-4"
              >
                <div>
                  <Label htmlFor="title" className="text-slate-900 font-medium">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1.5 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-slate-900 font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1.5 rounded-xl"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="price" className="text-slate-900 font-medium">Prix (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="mt-1.5 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="cover_image" className="text-slate-900 font-medium">Image de couverture (URL)</Label>
                  <Input
                    id="cover_image"
                    type="url"
                    value={formData.cover_image}
                    onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                    placeholder="https://..."
                    className="mt-1.5 rounded-xl"
                  />
                </div>
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
        
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-orange-200/40 to-pink-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-pink-200/30 to-orange-200/30 rounded-full blur-3xl" />
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-200 shadow-card">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm font-medium text-slate-600">Total</p>
            <p className="text-3xl font-bold text-slate-900">{courses?.length || 0}</p>
          </div>
          <div className="h-12 w-px bg-slate-200" />
          <div>
            <p className="text-sm font-medium text-slate-600">Publiées</p>
            <p className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {courses?.filter(c => c.is_published).length || 0}
            </p>
          </div>
        </div>
      </div>

      <CourseTable courses={courses || []} isLoading={isLoading} organizationSlug={slug || ""} />
    </div>
  );
}
