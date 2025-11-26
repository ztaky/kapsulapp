import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Course {
  id: string;
  title: string;
  price: number;
  is_published: boolean;
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
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <p className="text-lg font-medium">Aucune formation</p>
          <p className="text-sm text-muted-foreground">
            Commencez par créer votre première formation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Inscrits</TableHead>
            <TableHead>Modules</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => {
            const purchaseCount = course.purchases?.[0]?.count || 0;
            const moduleCount = course.modules?.[0]?.count || 0;
            const revenue = purchaseCount * course.price;

            return (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.title}</TableCell>
                <TableCell>{course.price} €</TableCell>
                <TableCell>
                  <Badge variant={course.is_published ? "default" : "secondary"}>
                    {course.is_published ? "Publié" : "Brouillon"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {purchaseCount} ({revenue} €)
                </TableCell>
                <TableCell>{moduleCount}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        navigate(`/school/${organizationSlug}/studio/courses/${course.id}/curriculum`)
                      }
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {course.is_published && (
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
