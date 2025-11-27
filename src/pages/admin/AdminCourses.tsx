import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, ExternalLink, Eye, EyeOff } from "lucide-react";
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

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.organization.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Formations</h1>
        <p className="text-slate-400">Toutes les formations de la plateforme</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Rechercher une formation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 bg-slate-800 mb-2" />
                <Skeleton className="h-4 w-32 bg-slate-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-pink-500" />
              {filteredCourses.length} formation{filteredCourses.length !== 1 && "s"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-sm text-slate-500">
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
                    <tr key={course.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="py-4">
                        <div>
                          <p className="font-semibold text-white">{course.title}</p>
                          {course.description && (
                            <p className="text-sm text-slate-500 line-clamp-1">{course.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                          {course.organization.name}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-white font-semibold">
                          {course.price === 0 ? "Gratuit" : `${course.price}€`}
                        </span>
                      </td>
                      <td className="py-4">
                        {course.is_published ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                            <Eye className="h-3 w-3" />
                            Publié
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400">
                            <EyeOff className="h-3 w-3" />
                            Brouillon
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <span className="text-white font-semibold">{course.students_count}</span>
                        <span className="text-slate-500 ml-1">étudiant{course.students_count !== 1 && "s"}</span>
                      </td>
                      <td className="py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/school/${course.organization.slug}/studio/courses/${course.id}/curriculum`)}
                          className="text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Éditer
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredCourses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
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
