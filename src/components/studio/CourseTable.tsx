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
            className="overflow-hidden cursor-pointer group bg-white"
            onClick={() =>
              navigate(`/school/${organizationSlug}/studio/courses/${course.id}/curriculum`)
            }
          >
            {/* Cover Image - 50% de la carte */}
            <div className="relative h-56 bg-gradient-to-br from-orange-100 via-pink-50 to-orange-50 overflow-hidden">
              {course.cover_image ? (
                <img
                  src={course.cover_image}
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-600/10 to-pink-600/10">
                  <BookOpen className="h-20 w-20 text-primary/30" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                <Badge
                  variant={isPublished ? "default" : "secondary"}
                  className={`shadow-lg font-semibold ${
                    isPublished 
                      ? "bg-gradient-primary text-white border-0" 
                      : "bg-white/90 backdrop-blur-sm text-muted-foreground"
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
                <h3 className="text-xl font-bold mb-2 text-slate-900 group-hover:text-primary transition-colors leading-tight">
                  {course.title}
                </h3>
                {course.description && (
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                )}
              </div>

              {/* Stats Grid - Style Pastel */}
              <div className="grid grid-cols-2 gap-3">
                {/* Students */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-orange-100/50">
                  <div className="p-2 rounded-full bg-orange-600/10">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600">Inscrits</p>
                    <p className="text-xl font-bold text-slate-900">{purchaseCount}</p>
                  </div>
                </div>

                {/* Modules */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-pink-100/50">
                  <div className="p-2 rounded-full bg-pink-600/10">
                    <Layers className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600">Modules</p>
                    <p className="text-xl font-bold text-slate-900">{moduleCount}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-100/50">
                  <div className="p-2 rounded-full bg-green-600/10">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600">Prix</p>
                    <p className="text-xl font-bold text-slate-900">{course.price} €</p>
                  </div>
                </div>

                {/* Revenue */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-purple-100/50">
                  <div className="p-2 rounded-full bg-purple-600/10">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600">Revenus</p>
                    <p className="text-xl font-bold text-slate-900">{revenue} €</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="gradient"
                  size="sm"
                  className="flex-1"
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
