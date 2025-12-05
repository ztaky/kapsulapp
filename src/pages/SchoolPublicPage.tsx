import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, BookOpen, Users, Mail, ArrowRight } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string | null;
  description: string | null;
  specialty: string | null;
  contact_email: string | null;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  price: number;
  is_published: boolean;
}

interface CoachProfile {
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

const SchoolPublicPage = () => {
  const { slug } = useParams<{ slug: string }>();

  // Fetch organization data
  const { data: organization, isLoading: isLoadingOrg, error: orgError } = useQuery({
    queryKey: ['public-organization', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_public_organization', { org_slug: slug })
        .single();
      
      if (error) throw error;
      return data as Organization;
    },
    enabled: !!slug,
  });

  // Fetch published courses
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['public-courses', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, cover_image, price, is_published')
        .eq('organization_id', organization!.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Course[];
    },
    enabled: !!organization?.id,
  });

  // Fetch coach info
  const { data: coach } = useQuery({
    queryKey: ['public-coach', organization?.id],
    queryFn: async () => {
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', organization!.id)
        .eq('role', 'coach')
        .limit(1)
        .maybeSingle();
      
      if (memberError || !memberData) return null;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('id', memberData.user_id)
        .maybeSingle();
      
      if (profileError) return null;
      return profileData as CoachProfile;
    },
    enabled: !!organization?.id,
  });

  // Fetch legal pages for footer
  const { data: legalPages } = useQuery({
    queryKey: ['public-legal-pages', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_pages')
        .select('type, title')
        .eq('organization_id', organization!.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  if (isLoadingOrg) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-20 w-48 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (orgError || !organization) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Académie introuvable</h1>
          <p className="text-muted-foreground mb-4">Cette académie n'existe pas ou n'est plus disponible.</p>
          <Button asChild>
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    );
  }

  const brandColor = organization.brand_color || '#d97706';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header 
        className="border-b bg-card"
        style={{ borderBottomColor: brandColor }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {organization.logo_url ? (
              <img 
                src={organization.logo_url} 
                alt={organization.name} 
                className="h-10 w-10 object-contain rounded"
              />
            ) : (
              <div 
                className="h-10 w-10 rounded flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: brandColor }}
              >
                {organization.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-lg text-foreground">{organization.name}</span>
          </div>
          {organization.contact_email && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${organization.contact_email}`}>
                <Mail className="h-4 w-4 mr-2" />
                Contact
              </a>
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="py-16 md:py-24"
        style={{ 
          background: `linear-gradient(135deg, ${brandColor}15 0%, transparent 100%)` 
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <div 
              className="p-4 rounded-full"
              style={{ backgroundColor: `${brandColor}20` }}
            >
              <GraduationCap className="h-12 w-12" style={{ color: brandColor }} />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {organization.name}
          </h1>
          {organization.specialty && (
            <Badge 
              variant="secondary" 
              className="mb-4 text-sm"
              style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
            >
              {organization.specialty}
            </Badge>
          )}
          {organization.description && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {organization.description}
            </p>
          )}
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="h-6 w-6" style={{ color: brandColor }} />
            <h2 className="text-2xl font-bold text-foreground">Formations disponibles</h2>
          </div>

          {isLoadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80 w-full" />
              ))}
            </div>
          ) : courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video relative bg-muted">
                    {course.cover_image ? (
                      <img 
                        src={course.cover_image} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: `${brandColor}20` }}
                      >
                        <BookOpen className="h-12 w-12" style={{ color: brandColor }} />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <h3 className="font-semibold text-lg text-foreground line-clamp-2">
                      {course.title}
                    </h3>
                  </CardHeader>
                  <CardContent>
                    {course.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {course.description}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <span 
                      className="font-bold text-lg"
                      style={{ color: brandColor }}
                    >
                      {course.price > 0 ? `${course.price}€` : 'Gratuit'}
                    </span>
                    <Button 
                      asChild
                      style={{ backgroundColor: brandColor }}
                      className="hover:opacity-90"
                    >
                      <Link to={`/school/${slug}/course/${course.id}`}>
                        Voir <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-lg border">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune formation disponible pour le moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Coach Section */}
      {coach && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Users className="h-6 w-6" style={{ color: brandColor }} />
              <h2 className="text-2xl font-bold text-foreground">Votre formateur</h2>
            </div>
            <Card className="max-w-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {coach.avatar_url ? (
                    <img 
                      src={coach.avatar_url} 
                      alt={coach.full_name || 'Formateur'}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div 
                      className="h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                      style={{ backgroundColor: brandColor }}
                    >
                      {(coach.full_name || coach.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">
                      {coach.full_name || 'Formateur'}
                    </h3>
                    <p className="text-sm text-muted-foreground">{coach.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {organization.logo_url ? (
                <img 
                  src={organization.logo_url} 
                  alt={organization.name} 
                  className="h-6 w-6 object-contain"
                />
              ) : (
                <div 
                  className="h-6 w-6 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: brandColor }}
                >
                  {organization.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} {organization.name}
              </span>
            </div>
            
            {legalPages && legalPages.length > 0 && (
              <div className="flex flex-wrap gap-4 text-sm">
                {legalPages.map((page) => (
                  <Link 
                    key={page.type}
                    to={`/school/${slug}/legal/${page.type}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {page.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SchoolPublicPage;
