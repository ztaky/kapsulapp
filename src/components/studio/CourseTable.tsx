import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Edit, Eye, BookOpen, Users, DollarSign, Layers, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Course {
  id: string;
  title: string;
  description?: string;
  price: number;
  is_published: boolean;
  cover_image?: string;
  purchases?: { count: number }[];
  modules?: { count: number }[];
}

interface CourseTableProps {
  courses: Course[];
  isLoading: boolean;
  organizationSlug: string;
}

export function CourseTable({ courses, isLoading, organizationSlug }: CourseTableProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-primary/10 mb-4">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <p className="text-xl font-semibold mb-2">Aucune formation</p>
          <p className="text-muted-foreground">
            Commencez par créer votre première formation
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {courses.map((course) => {
        const purchaseCount = course.purchases?.[0]?.count || 0;
        const moduleCount = course.modules?.[0]?.count || 0;
        const revenue = purchaseCount * course.price;
        const isPublished = course.is_published;

        return (
          <Card
            key={course.id}
            className="overflow-hidden cursor-pointer group bg-white border border-slate-100 rounded-3xl shadow-premium hover:shadow-lg transition-all duration-300"
            onClick={() =>
              navigate(`/school/${organizationSlug}/studio/courses/${course.id}/curriculum`)
            }
          >
            {/* Cover Image - 50% de la carte */}
            <div className="relative h-56 bg-gradient-to-br from-orange-50 via-white to-pink-50 overflow-hidden">
              {course.cover_image ? (
                <img
                  src={course.cover_image}
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="rounded-2xl bg-orange-100 text-orange-600 p-4 w-16 h-16 flex items-center justify-center">
                    <BookOpen className="h-8 w-8" />
                  </div>
                </div>
              )}
              <div className="absolute top-4 right-4">
                <Badge
                  variant={isPublished ? "default" : "secondary"}
                  className={`shadow-lg font-semibold rounded-full px-3 py-1 ${
                    isPublished 
                      ? "bg-gradient-primary text-white border-0" 
                      : "bg-white/90 backdrop-blur-sm text-slate-600 border border-slate-200"
                  }`}
                >
                  {isPublished ? "✓ Publié" : "Brouillon"}
                </Badge>
              </div>
            </div>

            {/* Content */}
            <CardContent className="p-6 space-y-5">
              {/* Title & Description */}
              <div>
                <h3 className="text-xl font-bold mb-2 text-[#1e293b] group-hover:text-orange-600 transition-colors leading-tight tracking-tight">
                  {course.title}
                </h3>
                {course.description && (
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                )}
              </div>

              {/* Stats Grid - Premium Style */}
              <div className="grid grid-cols-2 gap-3">
                {/* Students */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100/30 border border-orange-100">
                  <div className="rounded-xl bg-orange-100 text-orange-600 p-2 w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 tracking-tight">Inscrits</p>
                    <p className="text-xl font-bold text-slate-900 tracking-tight">{purchaseCount}</p>
                  </div>
                </div>

                {/* Modules */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100/30 border border-pink-100">
                  <div className="rounded-xl bg-pink-100 text-pink-600 p-2 w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 tracking-tight">Modules</p>
                    <p className="text-xl font-bold text-slate-900 tracking-tight">{moduleCount}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/30 border border-green-100">
                  <div className="rounded-xl bg-green-100 text-green-600 p-2 w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 tracking-tight">Prix</p>
                    <p className="text-xl font-bold text-slate-900 tracking-tight">{course.price} €</p>
                  </div>
                </div>

                {/* Revenue */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/30 border border-purple-100">
                  <div className="rounded-xl bg-purple-100 text-purple-600 p-2 w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 tracking-tight">Revenus</p>
                    <p className="text-xl font-bold text-slate-900 tracking-tight">{revenue} €</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="gradient"
                  size="sm"
                  className="flex-1 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(
                      `/school/${organizationSlug}/studio/courses/${course.id}/curriculum`
                    );
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Éditer le cours
                </Button>
                {isPublished && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200 hover:bg-slate-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Navigate to course preview
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
