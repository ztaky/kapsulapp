import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { CourseCoverUploader } from "./CourseCoverUploader";

interface CourseInfoCardProps {
  course: any;
  courseId: string;
  paymentLinkUrl: string;
  setPaymentLinkUrl: (url: string) => void;
  updatePaymentLinkMutation: any;
}

export function CourseInfoCard({ 
  course, 
  courseId, 
  paymentLinkUrl, 
  setPaymentLinkUrl, 
  updatePaymentLinkMutation 
}: CourseInfoCardProps) {
  const queryClient = useQueryClient();
  const [courseInfo, setCourseInfo] = useState({
    title: "",
    description: "",
    price: 0,
    cover_image: "",
  });

  useEffect(() => {
    if (course) {
      setCourseInfo({
        title: course.title || "",
        description: course.description || "",
        price: course.price || 0,
        cover_image: course.cover_image || "",
      });
    }
  }, [course]);

  const updateCourseMutation = useMutation({
    mutationFn: async (data: typeof courseInfo) => {
      const { error } = await supabase
        .from("courses")
        .update({
          title: data.title,
          description: data.description,
          price: data.price,
          cover_image: data.cover_image || null,
        })
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      toast.success("Informations du cours mises à jour");
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const hasChanges = course && (
    courseInfo.title !== course.title ||
    courseInfo.description !== (course.description || "") ||
    courseInfo.price !== course.price ||
    courseInfo.cover_image !== (course.cover_image || "")
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations du cours</CardTitle>
          <CardDescription>Modifiez les informations de base de votre cours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course-title">Titre</Label>
            <Input
              id="course-title"
              value={courseInfo.title}
              onChange={(e) => setCourseInfo({ ...courseInfo, title: e.target.value })}
              placeholder="Titre du cours"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course-description">Description</Label>
            <Textarea
              id="course-description"
              value={courseInfo.description}
              onChange={(e) => setCourseInfo({ ...courseInfo, description: e.target.value })}
              placeholder="Description du cours"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course-price">Prix (€)</Label>
            <Input
              id="course-price"
              type="number"
              min="0"
              step="0.01"
              value={courseInfo.price}
              onChange={(e) => setCourseInfo({ ...courseInfo, price: parseFloat(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
          <CourseCoverUploader
            value={courseInfo.cover_image}
            onChange={(url) => setCourseInfo({ ...courseInfo, cover_image: url })}
          />
          <Button
            onClick={() => updateCourseMutation.mutate(courseInfo)}
            disabled={updateCourseMutation.isPending || !hasChanges}
            className="w-full"
          >
            {updateCourseMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration du paiement</CardTitle>
          <CardDescription>Lien de paiement externe (optionnel)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-link">Lien de paiement Stripe/PayPal</Label>
            <Input
              id="payment-link"
              type="url"
              value={paymentLinkUrl}
              onChange={(e) => setPaymentLinkUrl(e.target.value)}
              placeholder="https://buy.stripe.com/..."
            />
            <p className="text-xs text-muted-foreground">
              Si vous avez connecté Stripe dans les paramètres, ce lien sera automatiquement généré.
            </p>
          </div>
          <Button
            onClick={() => updatePaymentLinkMutation.mutate(paymentLinkUrl)}
            disabled={updatePaymentLinkMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            Enregistrer le lien
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
