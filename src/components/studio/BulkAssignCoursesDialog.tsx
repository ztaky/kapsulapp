import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle, BookOpen } from "lucide-react";

interface Student {
  id: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
  accessibleCourseIds: string[];
}

interface BulkAssignCoursesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  selectedStudents: Student[];
  onComplete: () => void;
}

interface AssignResult {
  email: string;
  courseTitle: string;
  success: boolean;
  message: string;
  skipped?: boolean;
}

export function BulkAssignCoursesDialog({
  open,
  onOpenChange,
  organizationId,
  selectedStudents,
  onComplete,
}: BulkAssignCoursesDialogProps) {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<AssignResult[]>([]);
  const [step, setStep] = useState<"select" | "assigning" | "results">("select");
  const queryClient = useQueryClient();

  const { data: courses } = useQuery({
    queryKey: ["org-courses", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title")
        .eq("organization_id", organizationId)
        .order("title");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

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

  const resetState = () => {
    setSelectedCourses([]);
    setProgress(0);
    setResults([]);
    setStep("select");
  };

  const handleClose = () => {
    onOpenChange(false);
    resetState();
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const sendEnrollmentNotification = async (
    studentEmail: string,
    studentName: string | null,
    courseTitles: string[],
    coachName: string | null
  ) => {
    if (!organization || courseTitles.length === 0) return;

    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-enrollment-notification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentEmail,
            studentName,
            courseTitles,
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

  const handleAssign = async () => {
    if (selectedCourses.length === 0) {
      toast({
        title: "Aucun cours sélectionné",
        description: "Veuillez sélectionner au moins un cours",
        variant: "destructive",
      });
      return;
    }

    setIsAssigning(true);
    setStep("assigning");
    setResults([]);

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

    const allResults: AssignResult[] = [];
    const totalOperations = selectedStudents.length * selectedCourses.length;
    let completedOperations = 0;

    // Track new enrollments per student for notifications
    const newEnrollmentsPerStudent: Map<string, { email: string; name: string | null; courses: string[] }> = new Map();

    for (const student of selectedStudents) {
      for (const courseId of selectedCourses) {
        const course = courses?.find((c) => c.id === courseId);
        const courseName = course?.title || "Cours";

        // Check if student already has access
        if (student.accessibleCourseIds?.includes(courseId)) {
          allResults.push({
            email: student.profiles?.email || "",
            courseTitle: courseName,
            success: true,
            message: "Déjà inscrit",
            skipped: true,
          });
          completedOperations++;
          setProgress((completedOperations / totalOperations) * 100);
          continue;
        }

        try {
          const { error } = await supabase.from("course_enrollments").insert({
            user_id: student.user_id,
            course_id: courseId,
            granted_by: user?.id,
            notes: "Inscription groupée",
          });

          if (error) {
            if (error.code === "23505") {
              allResults.push({
                email: student.profiles?.email || "",
                courseTitle: courseName,
                success: true,
                message: "Déjà inscrit",
                skipped: true,
              });
            } else {
              throw error;
            }
          } else {
            allResults.push({
              email: student.profiles?.email || "",
              courseTitle: courseName,
              success: true,
              message: "Inscrit",
            });

            // Track for notification
            const studentKey = student.user_id;
            if (!newEnrollmentsPerStudent.has(studentKey)) {
              newEnrollmentsPerStudent.set(studentKey, {
                email: student.profiles?.email || "",
                name: student.profiles?.full_name || null,
                courses: [],
              });
            }
            newEnrollmentsPerStudent.get(studentKey)!.courses.push(courseName);
          }
        } catch (error) {
          allResults.push({
            email: student.profiles?.email || "",
            courseTitle: courseName,
            success: false,
            message: "Erreur",
          });
        }

        completedOperations++;
        setProgress((completedOperations / totalOperations) * 100);
        setResults([...allResults]);
      }
    }

    // Send email notifications for each student with new enrollments
    for (const [, studentData] of newEnrollmentsPerStudent) {
      if (studentData.courses.length > 0) {
        sendEnrollmentNotification(
          studentData.email,
          studentData.name,
          studentData.courses,
          coachName
        );
      }
    }

    setIsAssigning(false);
    setStep("results");

    // Refresh data
    queryClient.invalidateQueries({ queryKey: ["studio-students"] });

    const successCount = allResults.filter((r) => r.success && !r.skipped).length;
    const skippedCount = allResults.filter((r) => r.skipped).length;
    
    toast({
      title: "Attribution terminée",
      description: `${successCount} inscription(s) créée(s)${skippedCount > 0 ? `, ${skippedCount} déjà existante(s)` : ""}`,
    });
  };

  const successCount = results.filter((r) => r.success && !r.skipped).length;
  const skippedCount = results.filter((r) => r.skipped).length;
  const errorCount = results.filter((r) => !r.success).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Assigner des cours
          </DialogTitle>
          <DialogDescription>
            Attribuez des cours à {selectedStudents.length} étudiant(s) sélectionné(s)
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Sélectionnez les cours à attribuer :
            </p>
            <div className="max-h-[250px] overflow-y-auto space-y-2 border rounded-lg p-3">
              {courses?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun cours disponible
                </p>
              ) : (
                courses?.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleCourse(course.id)}
                  >
                    <Checkbox
                      checked={selectedCourses.includes(course.id)}
                      onCheckedChange={() => toggleCourse(course.id)}
                    />
                    <span className="text-sm font-medium">{course.title}</span>
                  </div>
                ))
              )}
            </div>
            {selectedCourses.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedCourses.length} cours × {selectedStudents.length} étudiants = {selectedCourses.length * selectedStudents.length} attribution(s)
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                onClick={handleAssign}
                disabled={selectedCourses.length === 0}
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              >
                Assigner {selectedCourses.length > 0 ? `(${selectedCourses.length})` : ""}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "assigning" && (
          <div className="space-y-4 py-8">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Attribution en cours...</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">
              {results.length} / {selectedStudents.length * selectedCourses.length} traité(s)
            </p>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-4 py-4">
            <div className="flex gap-4 justify-center flex-wrap">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{successCount} inscrit(s)</span>
              </div>
              {skippedCount > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span>{skippedCount} déjà inscrit(s)</span>
                </div>
              )}
              {errorCount > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span>{errorCount} erreur(s)</span>
                </div>
              )}
            </div>

            {errorCount > 0 && (
              <div className="max-h-[150px] overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2">Étudiant</th>
                      <th className="text-left p-2">Cours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results
                      .filter((r) => !r.success)
                      .map((result, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 truncate max-w-[150px]">{result.email}</td>
                          <td className="p-2 text-destructive">{result.courseTitle}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => { handleClose(); onComplete(); }}>
                Fermer
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
