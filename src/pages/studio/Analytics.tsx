import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Users, GraduationCap, Euro, TrendingUp, BookOpen, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function Analytics() {
  const { slug } = useParams();
  const [period, setPeriod] = useState("30");

  const { data: organization } = useQuery({
    queryKey: ['organization', slug],
    queryFn: async () => {
      const { data } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', slug)
        .single();
      return data;
    },
    enabled: !!slug,
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['coach-analytics', organization?.id, period],
    queryFn: async () => {
      if (!organization?.id) return null;

      const startDate = subDays(new Date(), parseInt(period));
      const startDateStr = format(startDate, 'yyyy-MM-dd');

      // Fetch all data in parallel
      const [
        studentsResult,
        coursesResult,
        purchasesResult,
        progressResult,
        lessonsResult,
      ] = await Promise.all([
        // Students count
        supabase
          .from('organization_members')
          .select('id, created_at, user_id')
          .eq('organization_id', organization.id)
          .eq('role', 'student'),
        
        // Courses
        supabase
          .from('courses')
          .select('id, title, is_published, created_at')
          .eq('organization_id', organization.id),
        
        // Purchases
        supabase
          .from('purchases')
          .select('id, amount, purchased_at, course_id, user_id, status, courses!inner(organization_id)')
          .eq('courses.organization_id', organization.id),
        
        // User progress
        supabase
          .from('user_progress')
          .select('id, user_id, lesson_id, is_completed, completed_at, lessons!inner(module_id, modules!inner(course_id, courses!inner(organization_id)))')
          .eq('lessons.modules.courses.organization_id', organization.id),
        
        // Lessons for completion rate
        supabase
          .from('lessons')
          .select('id, module_id, modules!inner(course_id, courses!inner(organization_id))')
          .eq('modules.courses.organization_id', organization.id),
      ]);

      const students = studentsResult.data || [];
      const courses = coursesResult.data || [];
      const purchases = purchasesResult.data || [];
      const progress = progressResult.data || [];
      const lessons = lessonsResult.data || [];

      // Calculate metrics
      const totalStudents = students.length;
      const newStudents = students.filter(s => new Date(s.created_at) >= startDate).length;
      
      // Active students (with progress in the period)
      const activeStudentIds = new Set(
        progress
          .filter(p => p.completed_at && new Date(p.completed_at) >= startDate)
          .map(p => p.user_id)
      );
      const activeStudents = activeStudentIds.size;

      // Revenue
      const totalRevenue = purchases
        .filter(p => p.status !== 'refunded')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const periodRevenue = purchases
        .filter(p => new Date(p.purchased_at) >= startDate && p.status !== 'refunded')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      // Completion rate
      const totalLessons = lessons.length;
      const completedProgress = progress.filter(p => p.is_completed).length;
      const uniqueStudentLessons = totalStudents * totalLessons;
      const completionRate = uniqueStudentLessons > 0 
        ? Math.round((completedProgress / uniqueStudentLessons) * 100) 
        : 0;

      // Revenue by day for chart
      const revenueByDay = eachDayOfInterval({ start: startDate, end: new Date() }).map(date => {
        const dayPurchases = purchases.filter(p => {
          const purchaseDate = new Date(p.purchased_at);
          return format(purchaseDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        });
        return {
          date: format(date, 'dd/MM', { locale: fr }),
          revenue: dayPurchases.reduce((sum, p) => sum + Number(p.amount), 0),
        };
      });

      // Students by day for chart
      const studentsByDay = eachDayOfInterval({ start: startDate, end: new Date() }).map(date => {
        const dayStudents = students.filter(s => {
          const createdDate = new Date(s.created_at);
          return format(createdDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        });
        return {
          date: format(date, 'dd/MM', { locale: fr }),
          students: dayStudents.length,
        };
      });

      // Completion by course
      const completionByCourse = courses.map(course => {
        const courseLessons = lessons.filter(l => 
          (l as any).modules?.course_id === course.id
        );
        const courseProgress = progress.filter(p => 
          courseLessons.some(l => l.id === p.lesson_id) && p.is_completed
        );
        const courseStudents = students.length;
        const maxProgress = courseLessons.length * courseStudents;
        const rate = maxProgress > 0 ? Math.round((courseProgress.length / maxProgress) * 100) : 0;
        
        return {
          name: course.title.length > 20 ? course.title.substring(0, 20) + '...' : course.title,
          completion: rate,
        };
      });

      // Sales by course
      const salesByCourse = courses.map(course => {
        const coursePurchases = purchases.filter(p => p.course_id === course.id);
        return {
          name: course.title.length > 15 ? course.title.substring(0, 15) + '...' : course.title,
          value: coursePurchases.length,
          revenue: coursePurchases.reduce((sum, p) => sum + Number(p.amount), 0),
        };
      }).filter(c => c.value > 0);

      return {
        totalStudents,
        newStudents,
        activeStudents,
        totalRevenue,
        periodRevenue,
        completionRate,
        totalCourses: courses.length,
        publishedCourses: courses.filter(c => c.is_published).length,
        revenueByDay,
        studentsByDay,
        completionByCourse,
        salesByCourse,
      };
    },
    enabled: !!organization?.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Analytics" subtitle="Tableau de bord de performance" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <DashboardHeader title="Analytics" subtitle="Tableau de bord de performance" />
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="90">90 derniers jours</SelectItem>
            <SelectItem value="365">Cette année</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Étudiants totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.newStudents || 0} sur la période
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Étudiants actifs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.activeStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.totalStudents ? Math.round((analytics.activeStudents / analytics.totalStudents) * 100) : 0}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de complétion</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.completionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Moyenne sur tous les cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalRevenue?.toLocaleString('fr-FR') || 0} €</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.periodRevenue?.toLocaleString('fr-FR') || 0} € sur la période
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Évolution des revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.revenueByDay || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}€`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} €`, 'Revenus']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nouveaux étudiants</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.studentsByDay || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  formatter={(value: number) => [value, 'Étudiants']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="students" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Taux de complétion par cours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.completionByCourse || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number" 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Complétion']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="completion" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Répartition des ventes</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.salesByCourse && analytics.salesByCourse.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.salesByCourse}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.salesByCourse.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      `${value} ventes (${props.payload.revenue}€)`, 
                      'Ventes'
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Aucune vente pour le moment
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cours publiés</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.publishedCourses || 0} / {analytics?.totalCourses || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Cours disponibles pour les étudiants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu moyen / étudiant</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.totalStudents 
                ? Math.round((analytics.totalRevenue || 0) / analytics.totalStudents).toLocaleString('fr-FR')
                : 0} €
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime value moyen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'activité</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.totalStudents 
                ? Math.round((analytics.activeStudents / analytics.totalStudents) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Étudiants actifs sur la période
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
