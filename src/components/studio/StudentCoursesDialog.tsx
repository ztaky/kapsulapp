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
import { ShoppingCart, Gift, Lock, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

  // Fetch organization info
  const { data: organization } = useQuery({
    queryKey: ["organization", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("name, slug")
        .eq("id", organizationId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

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

  // Fetch student's manual enrollments with coach info
  const { data: enrollments, refetch: refetchEnrollments } = useQuery({
    queryKey: ["student-enrollments", student.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select(`
          course_id, 
          is_active, 
          granted_at,
          granted_by
        `)
        .eq("user_id", student.user_id);

      if (error) throw error;
      
      // Fetch coach profiles separately to avoid relationship ambiguity
      const coachIds = [...new Set(data.filter(e => e.granted_by).map(e => e.granted_by!))];
      let coachProfiles: Record<string, { full_name: string | null; email: string }> = {};
      
      if (coachIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", coachIds);
        
        if (profiles) {
          coachProfiles = Object.fromEntries(profiles.map(p => [p.id, p]));
        }
      }
      
      return data.map(enrollment => ({
        ...enrollment,
        coach: enrollment.granted_by ? coachProfiles[enrollment.granted_by] || null : null
      }));
    },
    enabled: open,
  });

  const sendEnrollmentNotification = async (courseTitle: string, coachName: string | null) => {
    if (!organization || !student.profiles?.email) return;

    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-enrollment-notification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentEmail: student.profiles.email,
            studentName: student.profiles.full_name,
            courseTitles: [courseTitle],
            organizationName: organization.name,
            organizationSlug: organization.slug,
            coachName,
          }),
        }
      );
    } catch (error) {
      console.error("Failed to send enrollment notification:", error);
    }
  };

  const toggleEnrollment = useMutation({
    mutationFn: async ({ courseId, enable, courseTitle }: { courseId: string; enable: boolean; courseTitle: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (enable) {
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

        // Get coach name for notification
        let coachName: string | null = null;
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();
          coachName = profile?.full_name || null;
        }

        // Send notification email
        sendEnrollmentNotification(courseTitle, coachName);
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
      
      // Get coach name
      let coachName: string | null = null;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        coachName = profile?.full_name || null;
      }

      const coursesToEnroll = courses?.filter(
        (course) => !purchases?.includes(course.id) && 
                    !enrollments?.some(e => e.course_id === course.id && e.is_active)
      ) || [];

      const newCourseTitles: string[] = [];

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

        if (!error) {
          newCourseTitles.push(course.title);
        }
      }

      // Send single notification with all new courses
      if (newCourseTitles.length > 0 && organization && student.profiles?.email) {
        try {
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-enrollment-notification`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                studentEmail: student.profiles.email,
                studentName: student.profiles.full_name,
                courseTitles: newCourseTitles,
                organizationName: organization.name,
                organizationSlug: organization.slug,
                coachName,
              }),
            }
          );
        } catch (error) {
          console.error("Failed to send enrollment notification:", error);
        }
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
                const enrollment = enrollments?.find((e) => e.course_id === course.id);

                return (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{course.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                      {/* Historique d'inscription manuelle */}
                      {enrollment && enrollment.is_active && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(enrollment.granted_at), "d MMM yyyy", { locale: fr })}
                          </span>
                          {enrollment.coach && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              par {enrollment.coach.full_name || enrollment.coach.email}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {!isPurchased && (
                      <Switch
                        checked={isEnrolled}
                        onCheckedChange={(checked) =>
                          toggleEnrollment.mutate({
                            courseId: course.id,
                            enable: checked,
                            courseTitle: course.title,
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
