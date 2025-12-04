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
import { Search, Filter } from "lucide-react";

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

  // Fetch students with their course access counts
  const { data: students } = useQuery({
    queryKey: ["studio-students", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      // Get students
      const { data: members, error } = await supabase
        .from("organization_members")
        .select(`
          *,
          profiles(*)
        `)
        .eq("organization_id", currentOrg.id)
        .eq("role", "student");

      if (error) throw error;

      // Get total courses count
      const { count: totalCourses } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", currentOrg.id);

      // Get access counts for each student
      const studentsWithAccess = await Promise.all(
        (members || []).map(async (member) => {
          // Get purchases
          const { data: purchases } = await supabase
            .from("purchases")
            .select("course_id")
            .eq("user_id", member.user_id)
            .eq("status", "completed");

          // Get enrollments
          const { data: enrollments } = await supabase
            .from("course_enrollments")
            .select("course_id")
            .eq("user_id", member.user_id)
            .eq("is_active", true);

          const purchasedCourseIds = purchases?.map((p) => p.course_id) || [];
          const enrolledCourseIds = enrollments?.map((e) => e.course_id) || [];
          const accessibleCourseIds = [...new Set([...purchasedCourseIds, ...enrolledCourseIds])];

          return {
            ...member,
            accessibleCoursesCount: accessibleCourseIds.length,
            accessibleCourseIds,
            totalCourses: totalCourses || 0,
          };
        })
      );

      return studentsWithAccess;
    },
    enabled: !!currentOrg?.id,
  });

  // Filter students
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={accessFilter} onValueChange={(v: any) => setAccessFilter(v)}>
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
          <Select value={courseFilter} onValueChange={setCourseFilter}>
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

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{filteredStudents.length} étudiant{filteredStudents.length > 1 ? "s" : ""}</span>
        {(searchQuery || accessFilter !== "all" || courseFilter !== "all") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setAccessFilter("all");
              setCourseFilter("all");
            }}
            className="text-primary hover:underline"
          >
            Réinitialiser les filtres
          </button>
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

      {filteredStudents.length === 0 && (
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
