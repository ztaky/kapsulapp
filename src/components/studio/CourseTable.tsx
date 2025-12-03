import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Eye, BookOpen, Users, DollarSign, Layers, TrendingUp, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  onDelete?: (courseId: string) => void;
}

export function CourseTable({ courses, isLoading, organizationSlug, onDelete }: CourseTableProps) {
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
          <div className="p-4 rounded-xl bg-amber-50 mb-4">
            <BookOpen className="h-12 w-12 text-slate-600" />
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
            className="overflow-hidden cursor-pointer group bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300"
            onClick={() =>
              navigate(`/school/${organizationSlug}/studio/courses/${course.id}/curriculum`)
            }
          >
            {/* Cover Image */}
            <div className="relative h-48 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
              {course.cover_image ? (
                <img
                  src={course.cover_image}
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="rounded-xl bg-amber-50 p-4">
                    <BookOpen className="h-8 w-8 text-slate-600" />
                  </div>
                </div>
              )}
              <div className="absolute top-4 right-4">
                <Badge
                  variant={isPublished ? "default" : "secondary"}
                  className={`shadow-sm font-medium rounded-full px-3 py-1 ${
                    isPublished 
                      ? "bg-gradient-to-r from-primary to-pink-500 text-white border-0" 
                      : "bg-white/90 backdrop-blur-sm text-slate-600 border border-slate-200"
                  }`}
                >
                  {isPublished ? "Publié" : "Brouillon"}
                </Badge>
              </div>
            </div>

            {/* Content */}
            <CardContent className="p-6 space-y-4">
              {/* Title & Description */}
              <div>
                <h3 className="text-lg font-bold mb-1 text-foreground group-hover:text-primary transition-colors leading-tight tracking-tight">
                  {course.title}
                </h3>
                {course.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                )}
              </div>

              {/* Stats Grid - Neutral Style */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="rounded-lg bg-amber-50 p-2 flex-shrink-0">
                    <Users className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">Inscrits</p>
                    <p className="text-lg font-bold text-foreground">{purchaseCount}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="rounded-lg bg-amber-50 p-2 flex-shrink-0">
                    <Layers className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">Modules</p>
                    <p className="text-lg font-bold text-foreground">{moduleCount}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="rounded-lg bg-amber-50 p-2 flex-shrink-0">
                    <DollarSign className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">Prix</p>
                    <p className="text-lg font-bold text-foreground">{course.price} €</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="rounded-lg bg-amber-50 p-2 flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">Revenus</p>
                    <p className="text-lg font-bold text-foreground">{revenue} €</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
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
                    className="border-slate-200 hover:bg-slate-50"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer cette formation ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. La formation "{course.title}" et tout son contenu (modules, leçons) seront définitivement supprimés.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(course.id);
                        }}
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
