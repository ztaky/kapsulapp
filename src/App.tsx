import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Invoices from "./pages/Invoices";
import Certificates from "./pages/Certificates";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";
import StudioLayout from "./pages/studio/StudioLayout";
import StudioDashboard from "./pages/studio/Dashboard";
import StudioCourses from "./pages/studio/Courses";
import CourseBuilder from "./pages/studio/CourseBuilder";
import LessonEditor from "./pages/studio/LessonEditor";
import StudioStudents from "./pages/studio/Students";
import StudioBranding from "./pages/studio/Branding";
import AIAssistant from "./pages/studio/AIAssistant";
import SalesPageBuilder from "./pages/studio/SalesPageBuilder";
import LearningSpace from "./pages/learning/LearningSpace";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/super-admin" element={<SuperAdmin />} />
          
          {/* Studio Routes */}
          <Route path="/school/:slug/studio" element={<StudioLayout />}>
            <Route index element={<StudioDashboard />} />
            <Route path="courses" element={<StudioCourses />} />
            <Route path="courses/:courseId/curriculum" element={<CourseBuilder />} />
            <Route path="students" element={<StudioStudents />} />
            <Route path="assistant" element={<AIAssistant />} />
            <Route path="sales-pages" element={<SalesPageBuilder />} />
            <Route path="sales-pages/:courseId" element={<SalesPageBuilder />} />
            <Route path="branding" element={<StudioBranding />} />
          </Route>
          <Route path="/school/:slug/studio/lessons/:lessonId" element={<LessonEditor />} />
          
          {/* Learning Space Routes */}
          <Route path="/school/:slug/learn/:courseId" element={<LearningSpace />} />
          <Route path="/school/:slug/learn/:courseId/lessons/:lessonId" element={<LearningSpace />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
