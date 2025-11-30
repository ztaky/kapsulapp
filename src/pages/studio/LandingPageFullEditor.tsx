import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  Save, 
  ExternalLink, 
  Globe, 
  Loader2,
  LayoutTemplate,
  AlertTriangle,
  Lightbulb,
  Repeat,
  Users,
  MessageSquare,
  HelpCircle,
  Rocket,
  Bot,
  Eye,
  EyeOff,
  Palette
} from "lucide-react";
import { toast } from "sonner";
import { SectionEditor } from "@/components/landing/SectionEditor";
import { LandingPageAIChat } from "@/components/landing/LandingPageAIChat";
import { DesignEditor } from "@/components/landing/DesignEditor";

const SECTIONS = [
  { id: 'hero', label: 'Hero', icon: LayoutTemplate, required: true },
  { id: 'problem', label: 'Problème', icon: AlertTriangle, required: false },
  { id: 'method', label: 'Méthode', icon: Lightbulb, required: false },
  { id: 'transformation', label: 'Transformation', icon: Repeat, required: false },
  { id: 'program', label: 'Programme', icon: LayoutTemplate, required: false },
  { id: 'trainer', label: 'Formateur', icon: Users, required: false },
  { id: 'testimonials', label: 'Témoignages', icon: MessageSquare, required: false },
  { id: 'faq', label: 'FAQ', icon: HelpCircle, required: false },
  { id: 'final_cta', label: 'CTA Final', icon: Rocket, required: false },
];

// All sections enabled by default
const DEFAULT_ENABLED_SECTIONS = SECTIONS.map(s => s.id);

export default function LandingPageFullEditor() {
  const { slug, pageId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [activeSection, setActiveSection] = useState('hero');
  const [activeTab, setActiveTab] = useState<'edit' | 'design' | 'ai'>('edit');
  const [localContent, setLocalContent] = useState<any>(null);
  const [localTrainerInfo, setLocalTrainerInfo] = useState<any>(null);
  const [localDesignConfig, setLocalDesignConfig] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch landing page data
  const { data: landingPage, isLoading } = useQuery({
    queryKey: ['landing-page-editor', pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_pages')
        .select(`
          *,
          courses (id, title, price)
        `)
        .eq('id', pageId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!pageId,
  });

  // Initialize local state when data loads
  useEffect(() => {
    if (landingPage) {
      setLocalContent(landingPage.content || {});
      setLocalTrainerInfo(landingPage.trainer_info || {});
      // Ensure enabledSections is always an array
      const designConfig = (landingPage.design_config as Record<string, any>) || {};
      if (!designConfig.enabledSections) {
        designConfig.enabledSections = DEFAULT_ENABLED_SECTIONS;
      }
      setLocalDesignConfig(designConfig);
    }
  }, [landingPage]);

  // Toggle section visibility
  const toggleSection = (sectionId: string) => {
    const currentEnabled = localDesignConfig?.enabledSections || DEFAULT_ENABLED_SECTIONS;
    const isEnabled = currentEnabled.includes(sectionId);
    
    const newEnabled = isEnabled
      ? currentEnabled.filter((id: string) => id !== sectionId)
      : [...currentEnabled, sectionId];
    
    setLocalDesignConfig((prev: any) => ({
      ...prev,
      enabledSections: newEnabled
    }));
    setHasChanges(true);
  };

  const isSectionEnabled = (sectionId: string) => {
    return (localDesignConfig?.enabledSections || DEFAULT_ENABLED_SECTIONS).includes(sectionId);
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('landing_pages')
        .update({
          content: localContent,
          trainer_info: localTrainerInfo,
          design_config: localDesignConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pageId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Page sauvegardée !');
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['landing-page-editor', pageId] });
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde');
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      const newStatus = landingPage?.status === 'published' ? 'draft' : 'published';
      const { error } = await supabase
        .from('landing_pages')
        .update({ status: newStatus })
        .eq('id', pageId);

      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      toast.success(newStatus === 'published' ? 'Page publiée !' : 'Page dépubliée');
      queryClient.invalidateQueries({ queryKey: ['landing-page-editor', pageId] });
    },
    onError: () => {
      toast.error('Erreur lors de la publication');
    },
  });

  const handleContentChange = (section: string, data: any) => {
    setLocalContent((prev: any) => ({
      ...prev,
      [section]: section === 'testimonials' || section === 'faq' 
        ? data 
        : { ...(prev?.[section] || {}), ...data },
    }));
    setHasChanges(true);
  };

  const handleTrainerChange = (data: any) => {
    setLocalTrainerInfo(data);
    setHasChanges(true);
  };

  const handleAISuggestion = (section: string, newValue: any) => {
    if (section === 'testimonials' || section === 'faq') {
      setLocalContent((prev: any) => ({
        ...prev,
        [section]: newValue,
      }));
    } else {
      setLocalContent((prev: any) => ({
        ...prev,
        [section]: typeof newValue === 'object' 
          ? { ...(prev?.[section] || {}), ...newValue }
          : newValue,
      }));
    }
    setHasChanges(true);
  };

  // Handle design changes from AI
  const handleDesignChange = (designKey: string, newValue: any) => {
    setLocalDesignConfig((prev: any) => {
      const updated = { ...prev };
      
      // Handle nested keys like "palette.primary" or "fonts.heading"
      const keys = designKey.split('.');
      if (keys.length === 2) {
        const [parent, child] = keys;
        updated[parent] = {
          ...(updated[parent] || {}),
          [child]: newValue,
        };
      } else {
        // Direct key like "theme"
        updated[designKey] = newValue;
      }
      
      return updated;
    });
    setHasChanges(true);
  };

  if (isLoading || !localContent) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 p-8">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="w-96 border-l p-6">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Build preview URL with cache buster for design changes
  const previewUrl = `/lp/${landingPage?.slug}?preview=true&t=${Date.now()}`;

  return (
    <div className="flex h-screen bg-background">
      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/school/${slug}/studio/landing-pages`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="font-semibold">{landingPage?.name}</h1>
              <p className="text-xs text-muted-foreground">{landingPage?.courses?.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                Non sauvegardé
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/lp/${landingPage?.slug}`, '_blank')}
              disabled={landingPage?.status !== 'published'}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              {publishMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  {landingPage?.status === 'published' ? 'Dépublier' : 'Publier'}
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !hasChanges}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Preview Iframe/Component */}
        <div className="flex-1 overflow-auto bg-muted/30 p-4">
          <div className="bg-background rounded-lg shadow-lg overflow-hidden max-w-5xl mx-auto">
            <iframe
              key={JSON.stringify(localDesignConfig)} // Force re-render on design changes
              src={previewUrl}
              className="w-full h-[800px] border-0"
              title="Landing Page Preview"
            />
          </div>
        </div>
      </div>

      {/* Sidebar Panel */}
      <div className="w-[400px] border-l flex flex-col bg-background">
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'design' | 'ai')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="edit" className="gap-1.5 text-xs">
                <LayoutTemplate className="h-3.5 w-3.5" />
                Contenu
              </TabsTrigger>
              <TabsTrigger value="design" className="gap-1.5 text-xs">
                <Palette className="h-3.5 w-3.5" />
                Design
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-1.5 text-xs">
                <Bot className="h-3.5 w-3.5" />
                IA
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'edit' && (
            <>
            {/* Section Tabs with visibility toggles */}
              <div className="border-b p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Sections</span>
                  <span className="text-xs text-muted-foreground">Visible</span>
                </div>
                <div className="space-y-1">
                  {SECTIONS.map((section) => {
                    const isEnabled = isSectionEnabled(section.id);
                    return (
                      <div 
                        key={section.id}
                        className={`flex items-center gap-2 p-1.5 rounded-md transition-colors ${
                          activeSection === section.id 
                            ? 'bg-primary/10' 
                            : 'hover:bg-muted/50'
                        } ${!isEnabled ? 'opacity-50' : ''}`}
                      >
                        <Button
                          variant={activeSection === section.id ? "default" : "ghost"}
                          size="sm"
                          className="flex-1 text-xs justify-start h-7"
                          onClick={() => setActiveSection(section.id)}
                        >
                          <section.icon className="h-3 w-3 mr-1.5 flex-shrink-0" />
                          <span className="truncate">{section.label}</span>
                        </Button>
                        {!section.required && (
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => toggleSection(section.id)}
                            className="scale-75"
                          />
                        )}
                        {section.required && (
                          <div className="w-8 flex justify-center">
                            <span className="text-[10px] text-muted-foreground">requis</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section Editor */}
              <ScrollArea className="flex-1 p-4">
                {!isSectionEnabled(activeSection) && !SECTIONS.find(s => s.id === activeSection)?.required && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <EyeOff className="h-4 w-4" />
                      <span>Cette section est masquée sur la page</span>
                    </div>
                  </div>
                )}
                <SectionEditor
                  section={activeSection}
                  content={localContent}
                  trainerInfo={localTrainerInfo}
                  organizationId={landingPage?.organization_id}
                  onChange={handleContentChange}
                  onTrainerChange={handleTrainerChange}
                />
              </ScrollArea>
            </>
          )}

          {activeTab === 'design' && (
            <div className="flex-1 p-4 overflow-hidden">
              <DesignEditor
                designConfig={localDesignConfig}
                onChange={handleDesignChange}
              />
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="flex-1 p-4 overflow-hidden">
              <LandingPageAIChat
                content={localContent}
                trainerInfo={localTrainerInfo}
                designConfig={localDesignConfig}
                onApplySuggestion={handleAISuggestion}
                onApplyDesignChange={handleDesignChange}
                currentSection={activeSection}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
