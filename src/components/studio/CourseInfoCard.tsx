import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Loader2, CreditCard } from "lucide-react";
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
  const [installmentsEnabled, setInstallmentsEnabled] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(3);

  useEffect(() => {
    if (course) {
      setCourseInfo({
        title: course.title || "",
        description: course.description || "",
        price: course.price || 0,
        cover_image: course.cover_image || "",
      });
      setInstallmentsEnabled(course.installments_enabled || false);
      setInstallmentsCount(course.installments_count || 3);
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

  const createInstallmentPriceMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-installment-price", {
        body: {
          courseId,
          totalPrice: courseInfo.price,
          installmentsCount,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      toast.success(`Paiement en ${data.installmentsCount}x configuré (${data.monthlyAmount}€/mois)`);
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const disableInstallmentsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("courses")
        .update({
          installments_enabled: false,
          installment_price_id: null,
        })
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      toast.success("Paiement en plusieurs fois désactivé");
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const handleInstallmentsToggle = async (enabled: boolean) => {
    setInstallmentsEnabled(enabled);
    if (!enabled) {
      disableInstallmentsMutation.mutate();
    }
  };

  const monthlyPrice = courseInfo.price > 0 ? Math.ceil(courseInfo.price / installmentsCount) : 0;

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

      {/* Installment Payment Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Paiement en plusieurs fois
          </CardTitle>
          <CardDescription>
            Proposez à vos élèves de payer en plusieurs mensualités sans frais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activer le paiement en plusieurs fois</Label>
              <p className="text-sm text-muted-foreground">
                Les élèves pourront choisir entre paiement comptant ou en plusieurs fois
              </p>
            </div>
            <Switch
              checked={installmentsEnabled}
              onCheckedChange={handleInstallmentsToggle}
              disabled={disableInstallmentsMutation.isPending}
            />
          </div>

          {installmentsEnabled && (
            <>
              <div className="space-y-2">
                <Label>Nombre de mensualités</Label>
                <Select
                  value={installmentsCount.toString()}
                  onValueChange={(value) => setInstallmentsCount(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 fois</SelectItem>
                    <SelectItem value="3">3 fois</SelectItem>
                    <SelectItem value="4">4 fois</SelectItem>
                    <SelectItem value="6">6 fois</SelectItem>
                    <SelectItem value="10">10 fois</SelectItem>
                    <SelectItem value="12">12 fois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium">Aperçu pour l'élève</p>
                <p className="text-2xl font-bold mt-1">
                  {installmentsCount}x {monthlyPrice}€ <span className="text-sm font-normal text-muted-foreground">sans frais</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Prix total : {courseInfo.price}€
                </p>
              </div>

              <Button
                onClick={() => createInstallmentPriceMutation.mutate()}
                disabled={createInstallmentPriceMutation.isPending || courseInfo.price <= 0}
                className="w-full"
              >
                {createInstallmentPriceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configuration...
                  </>
                ) : course?.installment_price_id ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Mettre à jour le paiement en {installmentsCount}x
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Configurer le paiement en {installmentsCount}x
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lien de paiement externe</CardTitle>
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
