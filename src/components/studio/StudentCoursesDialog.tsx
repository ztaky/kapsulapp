import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ShoppingCart, Gift, Lock } from "lucide-react";

interface StudentCoursesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    id: string;
    user_id: string;
    profiles: {
      id: string;
      full_name: string | null;
      email: string;
    } | null;
  };
  organizationId: string;
}

export function StudentCoursesDialog({
  open,
  onOpenChange,
  student,
  organizationId,
}: StudentCoursesDialogProps) {
  const queryClient = useQueryClient();

  // Fetch all courses for this organization
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["org-courses", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, price, is_published")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch student's purchases
  const { data: purchases } = useQuery({
    queryKey: ["student-purchases", student.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("course_id")
        .eq("user_id", student.user_id)
        .eq("status", "completed");

      if (error) throw error;
      return data.map((p) => p.course_id);
    },
    enabled: open,
  });

  // Fetch student's manual enrollments
  const { data: enrollments, refetch: refetchEnrollments } = useQuery({
    queryKey: ["student-enrollments", student.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("course_id, is_active")
        .eq("user_id", student.user_id);

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const toggleEnrollment = useMutation({
    mutationFn: async ({ courseId, enable }: { courseId: string; enable: boolean }) => {
      if (enable) {
        // Get current user for granted_by
        const { data: { user } } = await supabase.auth.getUser();
        
        const { error } = await supabase
          .from("course_enrollments")
          .upsert({
            user_id: student.user_id,
            course_id: courseId,
            granted_by: user?.id,
            is_active: true,
          }, {
            onConflict: "user_id,course_id",
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("course_enrollments")
          .update({ is_active: false })
          .eq("user_id", student.user_id)
          .eq("course_id", courseId);

        if (error) throw error;
      }
    },
    onSuccess: (_, { enable }) => {
      toast.success(enable ? "Accès accordé" : "Accès retiré");
      refetchEnrollments();
      queryClient.invalidateQueries({ queryKey: ["studio-students"] });
    },
    onError: () => {
      toast.error("Erreur lors de la modification");
    },
  });

  const grantAllAccess = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const coursesToEnroll = courses?.filter(
        (course) => !purchases?.includes(course.id)
      ) || [];

      for (const course of coursesToEnroll) {
        const { error } = await supabase
          .from("course_enrollments")
          .upsert({
            user_id: student.user_id,
            course_id: course.id,
            granted_by: user?.id,
            is_active: true,
          }, {
            onConflict: "user_id,course_id",
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Accès accordé à tous les cours");
      refetchEnrollments();
      queryClient.invalidateQueries({ queryKey: ["studio-students"] });
    },
    onError: () => {
      toast.error("Erreur lors de la modification");
    },
  });

  const getAccessStatus = (courseId: string) => {
    if (purchases?.includes(courseId)) return "purchased";
    const enrollment = enrollments?.find((e) => e.course_id === courseId);
    if (enrollment?.is_active) return "enrolled";
    return "none";
  };

  const accessibleCount = courses?.filter(
    (c) => getAccessStatus(c.id) !== "none"
  ).length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Cours de {student.profiles?.full_name || student.profiles?.email}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Accès à {accessibleCount}/{courses?.length || 0} cours
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => grantAllAccess.mutate()}
              disabled={grantAllAccess.isPending}
            >
              Donner accès à tout
            </Button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {coursesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : courses?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun cours dans cette académie
              </p>
            ) : (
              courses?.map((course) => {
                const status = getAccessStatus(course.id);
                const isPurchased = status === "purchased";
                const isEnrolled = status === "enrolled";

                return (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{course.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {isPurchased && (
                          <Badge variant="default" className="text-xs">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Acheté
                          </Badge>
                        )}
                        {isEnrolled && (
                          <Badge variant="secondary" className="text-xs">
                            <Gift className="h-3 w-3 mr-1" />
                            Accès manuel
                          </Badge>
                        )}
                        {status === "none" && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            <Lock className="h-3 w-3 mr-1" />
                            Pas d'accès
                          </Badge>
                        )}
                      </div>
                    </div>

                    {!isPurchased && (
                      <Switch
                        checked={isEnrolled}
                        onCheckedChange={(checked) =>
                          toggleEnrollment.mutate({
                            courseId: course.id,
                            enable: checked,
                          })
                        }
                        disabled={toggleEnrollment.isPending}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
