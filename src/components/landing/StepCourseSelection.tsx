import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrganizations } from "@/hooks/useUserRole";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, FileText, PlayCircle } from "lucide-react";
import { WizardData } from "./LandingPageWizard";

interface StepCourseSelectionProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

export function StepCourseSelection({ data, onUpdate }: StepCourseSelectionProps) {
  const { currentOrg } = useUserOrganizations();

  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      const { data, error } = await supabase
        .from("courses")
        .select(`
          id,
          title,
          description,
          cover_image,
          modules (
            id,
            title,
            lessons (
              id,
              title,
              content_text,
              type
            )
          )
        `)
        .eq("organization_id", currentOrg.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!currentOrg?.id,
  });

  const selectedCourse = courses?.find((c) => c.id === data.courseId);

  const handleCourseSelect = (courseId: string) => {
    const course = courses?.find((c) => c.id === courseId);
    if (course) {
      onUpdate({
        courseId,
        courseName: course.title,
        courseContent: {
          description: course.description,
          modules: course.modules,
          totalLessons: course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0),
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Sélectionnez une formation</h3>
        <p className="text-muted-foreground">
          L'IA analysera le contenu de la formation pour créer une landing page optimisée
        </p>
      </div>

      <div className="space-y-4">
        <Label>Formation</Label>
        <Select value={data.courseId} onValueChange={handleCourseSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir une formation..." />
          </SelectTrigger>
          <SelectContent>
            {courses?.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCourse && (
        <Card className="p-6 space-y-4 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-4">
            {selectedCourse.cover_image && (
              <img
                src={selectedCourse.cover_image}
                alt={selectedCourse.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-lg mb-2">{selectedCourse.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {selectedCourse.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">{selectedCourse.modules?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Modules</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">
                  {selectedCourse.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Leçons</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">
                  {selectedCourse.modules
                    ?.reduce((acc, m) => 
                      acc + (m.lessons?.filter(l => l.content_text).length || 0), 0
                    ) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Contenus</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}