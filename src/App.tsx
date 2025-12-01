import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import CoachSignup from "./pages/CoachSignup";
import StudioLayout from "./pages/studio/StudioLayout";
import StudioDashboard from "./pages/studio/Dashboard";
import StudioCourses from "./pages/studio/Courses";
import CourseBuilder from "./pages/studio/CourseBuilder";
import LessonEditor from "./pages/studio/LessonEditor";
import StudioStudents from "./pages/studio/Students";
import StudioBranding from "./pages/studio/Branding";
import AIAssistant from "./pages/studio/AIAssistant";
import LandingPages from "./pages/studio/LandingPages";
import LandingPageFullEditor from "./pages/studio/LandingPageFullEditor";
import LegalPages from "./pages/studio/LegalPages";
import StudioSupport from "./pages/studio/Support";
import LearningSpace from "./pages/learning/LearningSpace";
import StudentLayout from "./pages/student/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProfile from "./pages/student/StudentProfile";
import StudentInvoices from "./pages/student/StudentInvoices";
import StudentCertificates from "./pages/student/StudentCertificates";
import StudentAssistant from "./pages/student/StudentAssistant";
import StudentSupport from "./pages/student/StudentSupport";
import LandingPageView from "./pages/LandingPageView";
import LegalPageView from "./pages/LegalPageView";
import CourseSalesPage from "./pages/CourseSalesPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAcademies from "./pages/admin/AdminAcademies";
import AdminSuperAdmins from "./pages/admin/AdminSuperAdmins";
import AdminCoaches from "./pages/admin/AdminCoaches";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminFAQ from "./pages/admin/AdminFAQ";
import FAQ from "./pages/FAQ";
import TestLandingPage from "./pages/TestLandingPage";
import PaymentSuccess from "./pages/PaymentSuccess";

// Legal pages for Kapsul SaaS
import MentionsLegales from "./pages/legal/MentionsLegales";
import Confidentialite from "./pages/legal/Confidentialite";
import CGV from "./pages/legal/CGV";
import CookiesPage from "./pages/legal/Cookies";

// Global components
import { CookieConsentBanner } from "./components/shared/CookieConsentBanner";
import { KapsulTracking } from "./components/shared/KapsulTracking";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Global Cookie Consent Banner */}
        <CookieConsentBanner />
        
        {/* Kapsul SaaS Tracking (GTM + FB Pixel) */}
        <KapsulTracking />
        
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/start" element={<CoachSignup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Kapsul Legal Pages */}
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/confidentialite" element={<Confidentialite />} />
          <Route path="/cgv" element={<CGV />} />
          <Route path="/cookies" element={<CookiesPage />} />
          
          {/* Legacy redirect */}
          <Route path="/super-admin" element={<Navigate to="/admin" replace />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="academies" element={<AdminAcademies />} />
            <Route path="super-admins" element={<AdminSuperAdmins />} />
            <Route path="coaches" element={<AdminCoaches />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="logs" element={<AdminLogs />} />
            <Route path="support/*" element={<AdminSupport />} />
            <Route path="faq" element={<AdminFAQ />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          
          {/* Student Routes */}
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="invoices" element={<StudentInvoices />} />
            <Route path="certificates" element={<StudentCertificates />} />
            <Route path="assistant" element={<StudentAssistant />} />
            <Route path="support/*" element={<StudentSupport />} />
          </Route>
          
          {/* Studio Routes */}
          <Route path="/school/:slug/studio" element={<StudioLayout />}>
            <Route index element={<StudioDashboard />} />
            <Route path="courses" element={<StudioCourses />} />
            <Route path="courses/:courseId/curriculum" element={<CourseBuilder />} />
            <Route path="students" element={<StudioStudents />} />
            <Route path="assistant" element={<AIAssistant />} />
            <Route path="landing-pages" element={<LandingPages />} />
            <Route path="landing-pages/:pageId/edit" element={<LandingPageFullEditor />} />
            <Route path="legal" element={<LegalPages />} />
            <Route path="branding" element={<StudioBranding />} />
            <Route path="support/*" element={<StudioSupport />} />
          </Route>
          <Route path="/school/:slug/studio/lessons/:lessonId" element={<LessonEditor />} />
          
          {/* Learning Space Routes */}
          <Route path="/school/:slug/learn/:courseId" element={<LearningSpace />} />
          <Route path="/school/:slug/learn/:courseId/lessons/:lessonId" element={<LearningSpace />} />
          
          {/* Public FAQ */}
          <Route path="/faq" element={<FAQ />} />
          
          {/* Public Landing Pages */}
          <Route path="/lp/:slug" element={<LandingPageView />} />
          <Route path="/lp/:landingSlug/legal/:type" element={<LegalPageView />} />
          
          {/* Public Course Sales Page */}
          <Route path="/school/:slug/course/:courseId" element={<CourseSalesPage />} />
          
          {/* Test Landing Page */}
          <Route path="/test-landing" element={<TestLandingPage />} />
          
          {/* Payment Success */}
          <Route path="/payment-success" element={<PaymentSuccess />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
