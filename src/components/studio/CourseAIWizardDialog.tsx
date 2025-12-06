import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Sparkles, ArrowRight, ArrowLeft, Loader2, BookOpen, Users, Target, Layers, FolderOpen, FileText, Link, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CourseResourcesUpload, AttachedFile } from "./CourseResourcesUpload";

interface CourseAIWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseGenerated: (courseData: GeneratedCourseData) => void;
}

export interface GeneratedLesson {
  title: string;
  content: string;
  has_quiz?: boolean;
  quiz?: {
    title: string;
    questions: {
      question: string;
      answers: string[];
      correctIndex: number;
      explanation?: string;
    }[];
  };
}

export interface GeneratedModule {
  title: string;
  description?: string;
  lessons: GeneratedLesson[];
}

export interface GeneratedCourseData {
  course: {
    title: string;
    description: string;
    target_audience?: string;
    duration_estimate?: string;
  };
  modules: GeneratedModule[];
}

interface WizardData {
  subject: string;
  targetAudience: string;
  objectives: string;
  moduleCount: string;
  uploadedFiles: AttachedFile[];
  referenceLinks: string[];
}

const STEPS = [
  { id: 1, title: "Sujet", icon: BookOpen },
  { id: 2, title: "Public", icon: Users },
  { id: 3, title: "Objectifs", icon: Target },
  { id: 4, title: "Ressources", icon: FolderOpen },
  { id: 5, title: "Structure", icon: Layers },
];

interface ExtractionProgress {
  phase: 'idle' | 'files' | 'urls' | 'generating';
  currentItem: string;
  currentIndex: number;
  totalItems: number;
  completedFiles: { name: string; success: boolean }[];
  completedUrls: { url: string; success: boolean }[];
}

export function CourseAIWizardDialog({ open, onOpenChange, onCourseGenerated }: CourseAIWizardDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress>({
    phase: 'idle',
    currentItem: '',
    currentIndex: 0,
    totalItems: 0,
    completedFiles: [],
    completedUrls: [],
  });
  const [wizardData, setWizardData] = useState<WizardData>({
    subject: "",
    targetAudience: "debutant",
    objectives: "",
    moduleCount: "4",
    uploadedFiles: [],
    referenceLinks: [],
  });

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return wizardData.subject.trim().length >= 3;
      case 2:
        return !!wizardData.targetAudience;
      case 3:
        return wizardData.objectives.trim().length >= 10;
      case 4:
        return true; // Resources are optional
      case 5:
        return !!wizardData.moduleCount;
      default:
        return false;
    }
  };

  const extractDocumentContent = async (file: AttachedFile): Promise<string> => {
    if (!file.url) return '';
    
    try {
      const { data, error } = await supabase.functions.invoke('extract-document-content', {
        body: {
          fileUrl: file.url,
          fileName: file.name,
          fileType: file.type,
        },
      });

      if (error) {
        console.error(`Error extracting content from ${file.name}:`, error);
        return '';
      }

      return data?.extractedText || '';
    } catch (err) {
      console.error(`Failed to extract content from ${file.name}:`, err);
      return '';
    }
  };

  const extractUrlContent = async (url: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('extract-url-content', {
        body: { url },
      });

      if (error) {
        console.error(`Error extracting content from ${url}:`, error);
        return '';
      }

      return data?.extractedText || '';
    } catch (err) {
      console.error(`Failed to extract content from ${url}:`, err);
      return '';
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setExtractionProgress({
      phase: 'idle',
      currentItem: '',
      currentIndex: 0,
      totalItems: 0,
      completedFiles: [],
      completedUrls: [],
    });
    
    try {
      const audienceLabel = {
        debutant: "Débutants - aucune connaissance préalable",
        intermediaire: "Intermédiaires - bases acquises",
        avance: "Avancés - expérience significative",
        professionnel: "Professionnels - experts du domaine"
      }[wizardData.targetAudience] || wizardData.targetAudience;

      // Extract content from uploaded files with progress tracking
      let extractedFileContents: { fileName: string; content: string }[] = [];
      let extractedUrlContents: { url: string; content: string }[] = [];
      
      if (wizardData.uploadedFiles.length > 0) {
        setExtractionProgress(prev => ({
          ...prev,
          phase: 'files',
          totalItems: wizardData.uploadedFiles.length,
          currentIndex: 0,
        }));
        
        for (let i = 0; i < wizardData.uploadedFiles.length; i++) {
          const file = wizardData.uploadedFiles[i];
          setExtractionProgress(prev => ({
            ...prev,
            currentItem: file.name,
            currentIndex: i,
          }));
          
          const content = await extractDocumentContent(file);
          const success = content.length > 0;
          
          if (success) {
            extractedFileContents.push({ fileName: file.name, content });
          }
          
          setExtractionProgress(prev => ({
            ...prev,
            completedFiles: [...prev.completedFiles, { name: file.name, success }],
          }));
        }
      }

      // Extract content from URLs with progress tracking
      if (wizardData.referenceLinks.length > 0) {
        setExtractionProgress(prev => ({
          ...prev,
          phase: 'urls',
          totalItems: wizardData.referenceLinks.length,
          currentIndex: 0,
          currentItem: '',
        }));
        
        for (let i = 0; i < wizardData.referenceLinks.length; i++) {
          const url = wizardData.referenceLinks[i];
          setExtractionProgress(prev => ({
            ...prev,
            currentItem: url,
            currentIndex: i,
          }));
          
          const content = await extractUrlContent(url);
          const success = content.length > 0;
          
          if (success) {
            extractedUrlContents.push({ url, content });
          }
          
          setExtractionProgress(prev => ({
            ...prev,
            completedUrls: [...prev.completedUrls, { url, success }],
          }));
        }
      }

      // Update phase to generating
      setExtractionProgress(prev => ({
        ...prev,
        phase: 'generating',
        currentItem: '',
      }));


      // Build resources section for prompt with extracted content
      let resourcesSection = "";
      if (extractedFileContents.length > 0 || extractedUrlContents.length > 0) {
        resourcesSection = "\n\nRESSOURCES ET CONTENU FOURNIS PAR LE FORMATEUR:";
        
        if (extractedFileContents.length > 0) {
          resourcesSection += "\n\n--- CONTENU DES DOCUMENTS ---";
          for (const ec of extractedFileContents) {
            resourcesSection += `\n\n=== ${ec.fileName} ===\n${ec.content}`;
          }
        }
        
        if (extractedUrlContents.length > 0) {
          resourcesSection += "\n\n--- CONTENU DES PAGES WEB ---";
          for (const ec of extractedUrlContents) {
            resourcesSection += `\n\n=== ${ec.url} ===\n${ec.content}`;
          }
        }
        
        resourcesSection += "\n\n⚠️ IMPORTANT: Utilise le contenu extrait ci-dessus comme BASE PRINCIPALE pour structurer et rédiger le cours. Intègre les concepts, exemples et informations de ces documents et pages web dans les leçons de manière pédagogique.";
      }

      const hasExtractedContent = extractedFileContents.length > 0 || extractedUrlContents.length > 0;

      const moduleCountNum = parseInt(wizardData.moduleCount);
      
      const prompt = `Tu es un EXPERT PÉDAGOGIQUE qui fait des RECHERCHES APPROFONDIES pour créer des cours de haute qualité.

MISSION: Génère un cours complet et professionnel avec l'outil create_complete_course.

=== INFORMATIONS DU COURS ===
SUJET: ${wizardData.subject}
PUBLIC CIBLE: ${audienceLabel}
OBJECTIFS D'APPRENTISSAGE: ${wizardData.objectives}
${resourcesSection}

=== EXIGENCES CRITIQUES ===

📊 STRUCTURE OBLIGATOIRE:
- Tu DOIS créer EXACTEMENT ${moduleCountNum} modules (pas ${moduleCountNum - 1}, pas ${moduleCountNum + 1}, mais PRÉCISÉMENT ${moduleCountNum})
- Chaque module doit avoir 3-4 leçons
- Ajoute un quiz (has_quiz: true) à la DERNIÈRE leçon de chaque module

📝 QUALITÉ DU CONTENU (TRÈS IMPORTANT):
- Chaque leçon DOIT faire minimum 400 mots
- Inclus des DONNÉES CHIFFRÉES, des STATISTIQUES et des FAITS vérifiables
- Cite des ÉTUDES, des RECHERCHES ou des EXPERTS reconnus dans le domaine
- Donne des EXEMPLES CONCRETS et PRATIQUES que l'apprenant peut appliquer immédiatement
- Utilise un vocabulaire SPÉCIFIQUE au domaine "${wizardData.subject}"
- Adapte les exemples au niveau "${audienceLabel}"

📖 FORMAT DE CHAQUE LEÇON:
🎯 **Objectif de la leçon** (ce que l'apprenant saura faire)

📖 **Introduction** (contexte et importance, avec une statistique ou fait marquant)

💡 **Points clés** (4-5 concepts détaillés avec exemples)
- Point 1 avec explication approfondie
- Point 2 avec exemple pratique
- etc.

🔍 **Étude de cas / Exemple concret** (situation réelle et applicable)

✅ **À retenir** (3-4 points essentiels résumés)

💪 **Exercice pratique** (action concrète à réaliser)

${hasExtractedContent ? `

⚠️ RESSOURCES À EXPLOITER:
Analyse EN PROFONDEUR le contenu des documents et pages web fournis ci-dessus.
- Extrais les concepts clés et intègre-les dans les leçons
- Utilise les exemples et données des documents
- Structure le cours autour des informations fournies
- Si les documents contiennent des méthodologies, intègre-les étape par étape
` : `

🔬 MODE RECHERCHE:
Comme aucun document n'est fourni, tu dois agir comme un chercheur expert:
- Inclus des informations précises et actualisées sur "${wizardData.subject}"
- Mentionne des techniques, méthodes ou frameworks reconnus dans ce domaine
- Donne des conseils basés sur les meilleures pratiques du secteur
`}

RAPPEL FINAL: Tu DOIS créer EXACTEMENT ${moduleCountNum} modules. Vérifie avant de répondre.`;

      const { data, error } = await supabase.functions.invoke("unified-chat", {
        body: {
          messages: [{ role: "user", content: prompt }],
          mode: "studio",
          forceTool: "create_complete_course",
          useProModel: true, // Signal to use more powerful model
        },
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Erreur lors de l'appel à l'IA");
      }

      let courseData: GeneratedCourseData;
      
      // Log full response for debugging
      console.log("AI Response received:", JSON.stringify(data, null, 2).substring(0, 2000));
      
      // Check for specific error codes from unified-chat
      if (data?.error) {
        console.error("AI returned error:", data.error, "Code:", data.code);
        
        if (data.code === 'RESPONSE_TRUNCATED') {
          toast.error("La réponse est trop longue. Réduisez le nombre de modules ou simplifiez le sujet.", { duration: 6000 });
        } else if (data.code === 'TOOL_CALL_MISSING') {
          toast.error("L'IA n'a pas pu générer le cours. Essayez avec une description plus précise.");
        } else if (data.code === 'TOOL_PARSE_ERROR') {
          toast.error("Erreur de parsing de la réponse IA. Veuillez réessayer.");
        } else {
          toast.error(data.error);
        }
        return;
      }
      
      // Check if we got text content instead of tool call (shouldn't happen with improved backend)
      if (data?.content && !data?.toolName && !data?.data) {
        console.error("AI returned text instead of tool call:", data.content?.substring(0, 300));
        toast.error("L'IA n'a pas généré un cours structuré. Essayez avec une description plus claire du sujet.");
        return;
      }
      
      // The response should contain the tool call data directly
      if (data?.toolName === "create_complete_course" && data?.data) {
        courseData = data.data as GeneratedCourseData;
      } else if (data?.data?.course && data?.data?.modules) {
        courseData = data.data as GeneratedCourseData;
      } else if (data?.course && data?.modules) {
        // Handle case where data is directly the course data
        courseData = data as GeneratedCourseData;
      } else {
        // Log the actual structure received
        console.error("Unexpected response format. Keys received:", data ? Object.keys(data) : "null");
        console.error("Full response:", JSON.stringify(data, null, 2).substring(0, 1000));
        toast.error("Format de réponse inattendu. Veuillez réessayer avec une description plus simple.");
        return;
      }

      // Validate course data structure
      if (!courseData.course?.title || !Array.isArray(courseData.modules) || courseData.modules.length === 0) {
        console.error("Invalid course data structure:", courseData);
        toast.error("Le cours généré est incomplet. Veuillez réessayer.");
        return;
      }

      // Validate module count
      const requestedModules = parseInt(wizardData.moduleCount);
      if (courseData.modules.length !== requestedModules) {
        console.warn(`Module count mismatch: requested ${requestedModules}, got ${courseData.modules.length}`);
        toast.warning(`${courseData.modules.length} modules générés au lieu de ${requestedModules}. Vous pouvez ajuster manuellement.`, { duration: 5000 });
      }

      onCourseGenerated(courseData);
      toast.success("Cours généré avec succès !");
      
      // Reset wizard
      setCurrentStep(1);
      setWizardData({
        subject: "",
        targetAudience: "debutant",
        objectives: "",
        moduleCount: "4",
        uploadedFiles: [],
        referenceLinks: [],
      });
      
    } catch (error) {
      console.error("Error generating course:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDefaultCourse = (data: WizardData): GeneratedCourseData => {
    const moduleCount = parseInt(data.moduleCount);
    const modules: GeneratedModule[] = [];
    
    for (let i = 0; i < moduleCount; i++) {
      modules.push({
        title: `Module ${i + 1}: Introduction`,
        description: `Description du module ${i + 1}`,
        lessons: [
          {
            title: `Leçon 1: Concepts de base`,
            content: `Contenu de la leçon sur ${data.subject}. Cette leçon couvre les concepts fondamentaux.`,
          },
          {
            title: `Leçon 2: Application pratique`,
            content: `Mise en pratique des concepts appris.`,
          },
          {
            title: `Quiz du module ${i + 1}`,
            content: `Testez vos connaissances sur le module ${i + 1}.`,
            has_quiz: true,
            quiz: {
              title: `Quiz - Module ${i + 1}`,
              questions: [
                {
                  question: `Question exemple pour le module ${i + 1}`,
                  answers: ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],
                  correctIndex: 0,
                  explanation: "Explication de la bonne réponse.",
                },
              ],
            },
          },
        ],
      });
    }

    return {
      course: {
        title: `Formation: ${data.subject}`,
        description: `Une formation complète sur ${data.subject}, conçue pour ${data.targetAudience === "debutant" ? "les débutants" : data.targetAudience === "intermediaire" ? "les intermédiaires" : "les experts"}. ${data.objectives}`,
        target_audience: data.targetAudience,
      },
      modules,
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-3xl border border-slate-100 p-0 overflow-hidden">
        {/* Header with progress */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              Créer avec l'IA
            </DialogTitle>
          </DialogHeader>
          
          {/* Progress steps */}
          <div className="flex items-center justify-between mt-6">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full transition-all
                    ${isActive ? "bg-white text-orange-500" : isCompleted ? "bg-white/30 text-white" : "bg-white/10 text-white/50"}
                  `}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 ${isCompleted ? "bg-white/50" : "bg-white/20"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-8">
              {/* Extraction Progress UI */}
              {(extractionProgress.phase === 'files' || extractionProgress.phase === 'urls') && (
                <div className="w-full max-w-md space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    {extractionProgress.phase === 'files' ? (
                      <FileText className="h-5 w-5 text-orange-500" />
                    ) : (
                      <Link className="h-5 w-5 text-blue-500" />
                    )}
                    <span className="font-medium text-slate-700">
                      {extractionProgress.phase === 'files' 
                        ? 'Extraction des documents' 
                        : 'Extraction des pages web'}
                    </span>
                    <span className="ml-auto text-sm text-slate-500">
                      {extractionProgress.currentIndex + 1} / {extractionProgress.totalItems}
                    </span>
                  </div>
                  
                  <Progress 
                    value={((extractionProgress.currentIndex + 1) / extractionProgress.totalItems) * 100} 
                    className="h-2"
                  />
                  
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500 flex-shrink-0" />
                    <span className="truncate">
                      {extractionProgress.currentItem.length > 40 
                        ? `...${extractionProgress.currentItem.slice(-40)}` 
                        : extractionProgress.currentItem}
                    </span>
                  </div>

                  {/* Completed items list */}
                  {(extractionProgress.completedFiles.length > 0 || extractionProgress.completedUrls.length > 0) && (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {extractionProgress.completedFiles.map((file, idx) => (
                        <div key={`file-${idx}`} className="flex items-center gap-2 text-sm">
                          {file.success ? (
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          )}
                          <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className={`truncate ${file.success ? 'text-slate-600' : 'text-slate-400'}`}>
                            {file.name}
                          </span>
                          <span className="ml-auto text-xs text-slate-400">
                            {file.success ? 'Extrait' : 'Échec'}
                          </span>
                        </div>
                      ))}
                      {extractionProgress.completedUrls.map((urlItem, idx) => (
                        <div key={`url-${idx}`} className="flex items-center gap-2 text-sm">
                          {urlItem.success ? (
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          )}
                          <Link className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className={`truncate ${urlItem.success ? 'text-slate-600' : 'text-slate-400'}`}>
                            {urlItem.url.length > 35 ? `${urlItem.url.slice(0, 35)}...` : urlItem.url}
                          </span>
                          <span className="ml-auto text-xs text-slate-400">
                            {urlItem.success ? 'Extrait' : 'Échec'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Generation phase */}
              {extractionProgress.phase === 'generating' && (
                <>
                  {/* Show extraction summary if there were files/urls */}
                  {(extractionProgress.completedFiles.length > 0 || extractionProgress.completedUrls.length > 0) && (
                    <div className="w-full max-w-md mb-6 p-3 bg-green-50 border border-green-100 rounded-xl">
                      <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-2">
                        <Check className="h-4 w-4" />
                        Extraction terminée
                      </div>
                      <div className="text-xs text-green-600 space-y-1">
                        {extractionProgress.completedFiles.filter(f => f.success).length > 0 && (
                          <p>✓ {extractionProgress.completedFiles.filter(f => f.success).length} document(s) extrait(s)</p>
                        )}
                        {extractionProgress.completedUrls.filter(u => u.success).length > 0 && (
                          <p>✓ {extractionProgress.completedUrls.filter(u => u.success).length} page(s) web extraite(s)</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Main loading animation */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 animate-pulse" />
                <Loader2 className="absolute inset-0 m-auto h-10 w-10 text-white animate-spin" />
              </div>
              <p className="mt-6 text-lg font-medium text-slate-700">
                {extractionProgress.phase === 'files' && 'Extraction des documents en cours...'}
                {extractionProgress.phase === 'urls' && 'Extraction des pages web en cours...'}
                {extractionProgress.phase === 'generating' && 'Génération du cours en cours...'}
                {extractionProgress.phase === 'idle' && 'Préparation...'}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {extractionProgress.phase === 'generating' 
                  ? 'Cela peut prendre quelques secondes'
                  : 'Analyse du contenu avec OCR et IA'}
              </p>
            </div>
          ) : (
            <>
              {/* Step 1: Subject */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-semibold text-slate-900">
                      Quel sujet voulez-vous enseigner ?
                    </Label>
                    <p className="text-sm text-slate-500 mt-1">
                      Soyez précis pour obtenir un cours adapté
                    </p>
                  </div>
                  <Input
                    placeholder="Ex: Marketing digital pour e-commerce, Yoga pour débutants..."
                    value={wizardData.subject}
                    onChange={(e) => setWizardData({ ...wizardData, subject: e.target.value })}
                    className="h-12 text-lg rounded-xl border-slate-200"
                  />
                </div>
              )}

              {/* Step 2: Target Audience */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-semibold text-slate-900">
                      Quel est le niveau de votre public cible ?
                    </Label>
                    <p className="text-sm text-slate-500 mt-1">
                      L'IA adaptera le contenu en conséquence
                    </p>
                  </div>
                  <Select
                    value={wizardData.targetAudience}
                    onValueChange={(value) => setWizardData({ ...wizardData, targetAudience: value })}
                  >
                    <SelectTrigger className="h-12 text-lg rounded-xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debutant">🌱 Débutant - Aucune connaissance préalable</SelectItem>
                      <SelectItem value="intermediaire">📚 Intermédiaire - Bases acquises</SelectItem>
                      <SelectItem value="avance">🎯 Avancé - Expérience significative</SelectItem>
                      <SelectItem value="professionnel">💼 Professionnel - Expert du domaine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Step 3: Objectives */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-semibold text-slate-900">
                      Quels sont les objectifs d'apprentissage ?
                    </Label>
                    <p className="text-sm text-slate-500 mt-1">
                      Que sauront faire vos apprenants à la fin du cours ?
                    </p>
                  </div>
                  <Textarea
                    placeholder="Ex: À la fin de cette formation, les apprenants seront capables de créer une stratégie marketing complète, configurer des campagnes publicitaires et analyser les résultats..."
                    value={wizardData.objectives}
                    onChange={(e) => setWizardData({ ...wizardData, objectives: e.target.value })}
                    className="min-h-[120px] text-base rounded-xl border-slate-200"
                  />
                </div>
              )}

              {/* Step 4: Resources (optional) */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-semibold text-slate-900">
                      Avez-vous des ressources à partager ?
                    </Label>
                    <p className="text-sm text-slate-500 mt-1">
                      Uploadez des documents ou ajoutez des liens pour enrichir la génération (facultatif)
                    </p>
                  </div>
                  <CourseResourcesUpload
                    files={wizardData.uploadedFiles}
                    links={wizardData.referenceLinks}
                    onFilesChange={(files) => setWizardData({ ...wizardData, uploadedFiles: files })}
                    onLinksChange={(links) => setWizardData({ ...wizardData, referenceLinks: links })}
                  />
                </div>
              )}

              {/* Step 5: Module Count */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-semibold text-slate-900">
                      Combien de modules souhaitez-vous ?
                    </Label>
                    <p className="text-sm text-slate-500 mt-1">
                      Chaque module contiendra 2-4 leçons + 1 quiz
                    </p>
                  </div>
                  <Select
                    value={wizardData.moduleCount}
                    onValueChange={(value) => setWizardData({ ...wizardData, moduleCount: value })}
                  >
                    <SelectTrigger className="h-12 text-lg rounded-xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 modules - Format court (~2h)</SelectItem>
                      <SelectItem value="4">4 modules - Format standard (~3h)</SelectItem>
                      <SelectItem value="5">5 modules - Format complet (~4h)</SelectItem>
                      <SelectItem value="6">6 modules - Format approfondi (~5h+)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Summary */}
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                    <h4 className="font-medium text-slate-900 mb-2">Récapitulatif</h4>
                    <ul className="space-y-1 text-sm text-slate-600">
                      <li>📚 Sujet: <span className="font-medium text-slate-900">{wizardData.subject}</span></li>
                      <li>👥 Public: <span className="font-medium text-slate-900">{wizardData.targetAudience}</span></li>
                      <li>🎯 Objectifs: <span className="font-medium text-slate-900">{wizardData.objectives.slice(0, 50)}...</span></li>
                      <li>📦 Modules: <span className="font-medium text-slate-900">{wizardData.moduleCount}</span></li>
                      {(wizardData.uploadedFiles.length > 0 || wizardData.referenceLinks.length > 0) && (
                        <li>📎 Ressources: <span className="font-medium text-slate-900">
                          {wizardData.uploadedFiles.length} fichier(s), {wizardData.referenceLinks.length} lien(s)
                        </span></li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                
                {currentStep < 5 ? (
                  <Button
                    variant="gradient"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="rounded-xl"
                  >
                    Suivant
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    variant="gradient"
                    onClick={handleGenerate}
                    disabled={!canProceed()}
                    className="rounded-xl"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer le cours
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
