import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useUserOrganizations } from "@/hooks/useUserRole";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddStudentDialog } from "@/components/studio/AddStudentDialog";
import { ImportStudentsCSVDialog } from "@/components/studio/ImportStudentsCSVDialog";
import { StudentActionsDropdown } from "@/components/studio/StudentActionsDropdown";
import { StudentsBulkActionBar } from "@/components/studio/StudentsBulkActionBar";
import { BulkAssignCoursesDialog } from "@/components/studio/BulkAssignCoursesDialog";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";

const STUDENTS_PER_PAGE = 50;

export default function StudioStudents() {
  const { slug } = useParams<{ slug: string }>();
  const { organizations } = useUserOrganizations();
  const currentOrg = organizations.find((org) => org.slug === slug);
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [accessFilter, setAccessFilter] = useState<"all" | "with-access" | "no-access">("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch courses for filter dropdown
  const { data: courses } = useQuery({
    queryKey: ["org-courses-filter", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data, error } = await supabase
        .from("courses")
        .select("id, title")
        .eq("organization_id", currentOrg.id)
        .order("title");
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrg?.id,
  });

  // Fetch total students count
  const { data: totalCount } = useQuery({
    queryKey: ["studio-students-count", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return 0;
      const { count, error } = await supabase
        .from("organization_members")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", currentOrg.id)
        .eq("role", "student");
      if (error) throw error;
      return count || 0;
    },
    enabled: !!currentOrg?.id,
  });

  // Fetch students with pagination
  const { data: students, isLoading } = useQuery({
    queryKey: ["studio-students", currentOrg?.id, currentPage],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      const from = (currentPage - 1) * STUDENTS_PER_PAGE;
      const to = from + STUDENTS_PER_PAGE - 1;

      // Get students with pagination
      const { data: members, error } = await supabase
        .from("organization_members")
        .select(`
          *,
          profiles(*)
        `)
        .eq("organization_id", currentOrg.id)
        .eq("role", "student")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      if (!members || members.length === 0) return [];

      // Get total courses count
      const { count: totalCourses } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", currentOrg.id);

      // Get user IDs for batch queries
      const userIds = members.map((m) => m.user_id);

      // Batch fetch purchases
      const { data: allPurchases } = await supabase
        .from("purchases")
        .select("user_id, course_id")
        .in("user_id", userIds)
        .eq("status", "completed");

      // Batch fetch enrollments
      const { data: allEnrollments } = await supabase
        .from("course_enrollments")
        .select("user_id, course_id")
        .in("user_id", userIds)
        .eq("is_active", true);

      // Create maps for quick lookup
      const purchasesByUser = new Map<string, string[]>();
      allPurchases?.forEach((p) => {
        const courses = purchasesByUser.get(p.user_id) || [];
        courses.push(p.course_id);
        purchasesByUser.set(p.user_id, courses);
      });

      const enrollmentsByUser = new Map<string, string[]>();
      allEnrollments?.forEach((e) => {
        const courses = enrollmentsByUser.get(e.user_id) || [];
        courses.push(e.course_id);
        enrollmentsByUser.set(e.user_id, courses);
      });

      // Map students with their access
      return members.map((member) => {
        const purchasedCourseIds = purchasesByUser.get(member.user_id) || [];
        const enrolledCourseIds = enrollmentsByUser.get(member.user_id) || [];
        const accessibleCourseIds = [...new Set([...purchasedCourseIds, ...enrolledCourseIds])];

        return {
          ...member,
          accessibleCoursesCount: accessibleCourseIds.length,
          accessibleCourseIds,
          totalCourses: totalCourses || 0,
        };
      });
    },
    enabled: !!currentOrg?.id,
  });

  // Filter students (client-side for the current page)
  const filteredStudents = useMemo(() => {
    if (!students) return [];

    return students.filter((student: any) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        student.profiles?.full_name?.toLowerCase().includes(searchLower) ||
        student.profiles?.email?.toLowerCase().includes(searchLower);

      // Access filter
      const hasAccess = student.accessibleCoursesCount > 0;
      const matchesAccess =
        accessFilter === "all" ||
        (accessFilter === "with-access" && hasAccess) ||
        (accessFilter === "no-access" && !hasAccess);

      // Course filter
      const matchesCourse =
        courseFilter === "all" ||
        student.accessibleCourseIds?.includes(courseFilter);

      return matchesSearch && matchesAccess && matchesCourse;
    });
  }, [students, searchQuery, accessFilter, courseFilter]);

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleAccessFilterChange = (value: "all" | "with-access" | "no-access") => {
    setAccessFilter(value);
    setCurrentPage(1);
  };

  const handleCourseFilterChange = (value: string) => {
    setCourseFilter(value);
    setCurrentPage(1);
  };

  // Selection helpers
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const toggleAllSelection = () => {
    if (selectedStudentIds.size === filteredStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map((s: any) => s.id)));
    }
  };

  const clearSelection = () => {
    setSelectedStudentIds(new Set());
  };

  const selectedStudents = useMemo(() => {
    return filteredStudents.filter((s: any) => selectedStudentIds.has(s.id));
  }, [filteredStudents, selectedStudentIds]);

  const allSelected = filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length;
  const someSelected = selectedStudentIds.size > 0 && selectedStudentIds.size < filteredStudents.length;

  // Pagination
  const totalPages = Math.ceil((totalCount || 0) / STUDENTS_PER_PAGE);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header - Premium Style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/50 p-10 border border-slate-100 shadow-premium">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight mb-2">
              Communauté
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              Gérez les apprenants de votre académie
            </p>
          </div>
          {currentOrg && (
            <div className="flex items-center gap-2">
              <ImportStudentsCSVDialog 
                organizationId={currentOrg.id} 
                organizationName={currentOrg.name} 
              />
              <AddStudentDialog 
                organizationId={currentOrg.id} 
                organizationName={currentOrg.name} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={accessFilter} onValueChange={handleAccessFilterChange}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Accès" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="with-access">Avec accès</SelectItem>
              <SelectItem value="no-access">Sans accès</SelectItem>
            </SelectContent>
          </Select>
          <Select value={courseFilter} onValueChange={handleCourseFilterChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par cours" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les cours</SelectItem>
              {courses?.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats and Pagination Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{totalCount || 0} étudiant{(totalCount || 0) > 1 ? "s" : ""} au total</span>
          {(searchQuery || accessFilter !== "all" || courseFilter !== "all") && (
            <button
              onClick={() => {
                handleSearchChange("");
                handleAccessFilterChange("all");
                handleCourseFilterChange("all");
              }}
              className="text-primary hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
        {totalPages > 1 && (
          <span>Page {currentPage} sur {totalPages}</span>
        )}
      </div>

      <div className="rounded-3xl border border-slate-100 shadow-premium bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as any).indeterminate = someSelected;
                    }
                  }}
                  onCheckedChange={toggleAllSelection}
                  aria-label="Tout sélectionner"
                />
              </TableHead>
              <TableHead>Étudiant</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cours</TableHead>
              <TableHead>Inscription</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((member: any) => (
              <TableRow 
                key={member.id}
                className={selectedStudentIds.has(member.id) ? "bg-muted/50" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedStudentIds.has(member.id)}
                    onCheckedChange={() => toggleStudentSelection(member.id)}
                    aria-label={`Sélectionner ${member.profiles?.full_name || member.profiles?.email}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.profiles?.avatar_url} />
                      <AvatarFallback>
                        {member.profiles?.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{member.profiles?.full_name || "Sans nom"}</span>
                  </div>
                </TableCell>
                <TableCell>{member.profiles?.email}</TableCell>
                <TableCell>
                  <Badge variant={member.accessibleCoursesCount > 0 ? "default" : "secondary"}>
                    {member.accessibleCoursesCount}/{member.totalCourses}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(member.created_at).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell>
                  {currentOrg && (
                    <StudentActionsDropdown
                      student={member}
                      organizationId={currentOrg.id}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredStudents.length === 0 && !isLoading && (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 border-dashed bg-white/50">
          <div className="text-center">
            <p className="text-lg font-medium text-slate-900">
              {students?.length === 0 ? "Aucun étudiant" : "Aucun résultat"}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              {students?.length === 0
                ? "Les étudiants apparaîtront ici après inscription"
                : "Modifiez vos filtres pour voir plus de résultats"}
            </p>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={!canGoPrevious || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Précédent
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  disabled={isLoading}
                  className="w-9"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={!canGoNext || isLoading}
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Bulk Action Bar */}
      <StudentsBulkActionBar
        selectedCount={selectedStudentIds.size}
        onClear={clearSelection}
        onAssignCourses={() => setBulkAssignOpen(true)}
      />

      {/* Bulk Assign Courses Dialog */}
      {currentOrg && (
        <BulkAssignCoursesDialog
          open={bulkAssignOpen}
          onOpenChange={setBulkAssignOpen}
          organizationId={currentOrg.id}
          selectedStudents={selectedStudents}
          onComplete={clearSelection}
        />
      )}
    </div>
  );
}
