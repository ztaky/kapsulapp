import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, ExternalLink, Eye, EyeOff, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  is_published: boolean;
  created_at: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  students_count: number;
}

const AdminCourses = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("courses")
      .select(`
        id,
        title,
        description,
        price,
        is_published,
        created_at,
        organizations!inner(id, name, slug)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching courses:", error);
      toast.error("Erreur lors du chargement des formations");
    }

    // Fetch purchases count per course
    const courseIds = data?.map((c: any) => c.id) || [];
    const { data: purchasesData } = await supabase
      .from("purchases")
      .select("course_id")
      .in("course_id", courseIds);

    const purchasesCount: Record<string, number> = {};
    purchasesData?.forEach((p: any) => {
      purchasesCount[p.course_id] = (purchasesCount[p.course_id] || 0) + 1;
    });

    const processed = data?.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      price: item.price,
      is_published: item.is_published,
      created_at: item.created_at,
      organization: {
        id: item.organizations.id,
        name: item.organizations.name,
        slug: item.organizations.slug,
      },
      students_count: purchasesCount[item.id] || 0,
    })) || [];

    setCourses(processed);
    setLoading(false);
  };

  const handleDeleteCourse = async (courseId: string) => {
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId);

    if (error) {
      console.error("Error deleting course:", error);
      toast.error("Erreur lors de la suppression de la formation");
      return;
    }

    toast.success("Formation supprimée avec succès");
    fetchCourses();
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.organization.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Formations</h1>
        <p className="text-muted-foreground">Toutes les formations de la plateforme</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une formation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-pink-500" />
              {filteredCourses.length} formation{filteredCourses.length !== 1 && "s"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Formation</th>
                    <th className="pb-3 font-medium">Académie</th>
                    <th className="pb-3 font-medium">Prix</th>
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Étudiants</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-4">
                        <div>
                          <p className="font-semibold text-foreground">{course.title}</p>
                          {course.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{course.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {course.organization.name}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-foreground font-semibold">
                          {course.price === 0 ? "Gratuit" : `${course.price}€`}
                        </span>
                      </td>
                      <td className="py-4">
                        {course.is_published ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <Eye className="h-3 w-3" />
                            Publié
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <EyeOff className="h-3 w-3" />
                            Brouillon
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <span className="text-foreground font-semibold">{course.students_count}</span>
                        <span className="text-muted-foreground ml-1">étudiant{course.students_count !== 1 && "s"}</span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/school/${course.organization.slug}/studio/courses/${course.id}/curriculum`)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Éditer
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer cette formation ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. La formation "{course.title}" et tout son contenu seront définitivement supprimés.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCourse(course.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCourses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Aucune formation trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminCourses;
