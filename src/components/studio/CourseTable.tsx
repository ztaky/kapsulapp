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
            className={`overflow-hidden border-l-4 transition-all duration-300 hover:shadow-elevated cursor-pointer group ${
              isPublished ? "border-l-primary/50" : "border-l-gray-400/50"
            }`}
            onClick={() =>
              navigate(`/school/${organizationSlug}/studio/courses/${course.id}/curriculum`)
            }
          >
            {/* Cover Image */}
            <div className="relative h-48 bg-gradient-to-br from-primary/20 to-purple-500/20 overflow-hidden">
              {course.cover_image ? (
                <img
                  src={course.cover_image}
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-primary/40" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                <Badge
                  variant={isPublished ? "default" : "secondary"}
                  className="shadow-lg"
                >
                  {isPublished ? "Publié" : "Brouillon"}
                </Badge>
              </div>
            </div>

            {/* Content */}
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Title & Description */}
                <div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Students */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10">
                    <div className="p-1.5 rounded bg-blue-500/20">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Inscrits</p>
                      <p className="text-lg font-bold">{purchaseCount}</p>
                    </div>
                  </div>

                  {/* Modules */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10">
                    <div className="p-1.5 rounded bg-purple-500/20">
                      <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Modules</p>
                      <p className="text-lg font-bold">{moduleCount}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10">
                    <div className="p-1.5 rounded bg-green-500/20">
                      <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Prix</p>
                      <p className="text-lg font-bold">{course.price} €</p>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10">
                    <div className="p-1.5 rounded bg-primary/20">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Revenus</p>
                      <p className="text-lg font-bold">{revenue} €</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
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
                    Éditer
                  </Button>
                  {isPublished && (
                    <Button
                      variant="ghost"
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
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
