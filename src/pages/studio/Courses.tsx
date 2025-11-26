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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mes Formations</h2>
          <p className="text-muted-foreground">Gérez le catalogue de votre école</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Créer une formation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle formation</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCourseMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="price">Prix (€)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cover_image">Image de couverture (URL)</Label>
                <Input
                  id="cover_image"
                  type="url"
                  value={formData.cover_image}
                  onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <Button type="submit" className="w-full" disabled={createCourseMutation.isPending}>
                Créer la formation
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <CourseTable courses={courses || []} isLoading={isLoading} organizationSlug={slug || ""} />
    </div>
  );
}
