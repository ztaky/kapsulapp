import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, ArrowRight, ArrowLeft, Loader2, BookOpen, Users, Target, Layers, FolderOpen } from "lucide-react";
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

export function CourseAIWizardDialog({ open, onOpenChange, onCourseGenerated }: CourseAIWizardDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
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

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const audienceLabel = {
        debutant: "Débutants - aucune connaissance préalable",
        intermediaire: "Intermédiaires - bases acquises",
        avance: "Avancés - expérience significative",
        professionnel: "Professionnels - experts du domaine"
      }[wizardData.targetAudience] || wizardData.targetAudience;

      // Extract content from uploaded files
      let extractedContents: { fileName: string; content: string }[] = [];
      
      if (wizardData.uploadedFiles.length > 0) {
        toast.info("Extraction du contenu des documents...");
        
        const extractionPromises = wizardData.uploadedFiles.map(async (file) => {
          const content = await extractDocumentContent(file);
          return { fileName: file.name, content };
        });
        
        extractedContents = await Promise.all(extractionPromises);
        extractedContents = extractedContents.filter(ec => ec.content.length > 0);
        
        if (extractedContents.length > 0) {
          toast.success(`Contenu extrait de ${extractedContents.length} fichier(s)`);
        }
      }

      // Build resources section for prompt with extracted content
      let resourcesSection = "";
      if (extractedContents.length > 0 || wizardData.referenceLinks.length > 0) {
        resourcesSection = "\n\nRESSOURCES ET CONTENU FOURNIS PAR LE FORMATEUR:";
        
        if (extractedContents.length > 0) {
          resourcesSection += "\n\n--- CONTENU DES DOCUMENTS ---";
          for (const ec of extractedContents) {
            resourcesSection += `\n\n=== ${ec.fileName} ===\n${ec.content}`;
          }
        }
        
        if (wizardData.referenceLinks.length > 0) {
          resourcesSection += `\n\n--- LIENS DE RÉFÉRENCE ---\n${wizardData.referenceLinks.join("\n")}`;
        }
        
        resourcesSection += "\n\n⚠️ IMPORTANT: Utilise le contenu extrait ci-dessus comme BASE PRINCIPALE pour structurer et rédiger le cours. Intègre les concepts, exemples et informations de ces documents dans les leçons de manière pédagogique.";
      }

      const prompt = `Génère un cours complet avec l'outil create_complete_course.

SUJET DU COURS: ${wizardData.subject}
PUBLIC CIBLE: ${audienceLabel}
OBJECTIFS D'APPRENTISSAGE: ${wizardData.objectives}
NOMBRE DE MODULES SOUHAITÉS: ${wizardData.moduleCount}${resourcesSection}

INSTRUCTIONS:
- Crée exactement ${wizardData.moduleCount} modules progressifs
- Chaque module doit avoir 2-4 leçons avec du contenu pédagogique détaillé
- Ajoute un quiz (has_quiz: true) à la dernière leçon de chaque module
- Le contenu de chaque leçon doit faire minimum 250 mots, structuré avec objectif, points clés et exemples
- Adapte le vocabulaire et les exemples au public cible
${extractedContents.length > 0 ? "- UTILISE PRIORITAIREMENT le contenu des documents fournis pour enrichir les leçons" : ""}`;

      const { data, error } = await supabase.functions.invoke("unified-chat", {
        body: {
          messages: [{ role: "user", content: prompt }],
          mode: "studio",
          forceTool: "create_complete_course",
        },
      });

      if (error) throw error;

      let courseData: GeneratedCourseData;
      
      console.log("AI Response received:", JSON.stringify(data, null, 2));
      
      // The response should contain the tool call data directly
      if (data?.toolName === "create_complete_course" && data?.data) {
        courseData = data.data as GeneratedCourseData;
      } else if (data?.data?.course && data?.data?.modules) {
        courseData = data.data as GeneratedCourseData;
      } else if (data?.course && data?.modules) {
        // Handle case where data is directly the course data
        courseData = data as GeneratedCourseData;
      } else {
        console.error("Unexpected response format:", data);
        toast.error("Format de réponse inattendu. Veuillez réessayer.");
        return;
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
      toast.error("Erreur lors de la génération. Veuillez réessayer.");
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
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 animate-pulse" />
                <Loader2 className="absolute inset-0 m-auto h-10 w-10 text-white animate-spin" />
              </div>
              <p className="mt-6 text-lg font-medium text-slate-700">Génération du cours en cours...</p>
              <p className="mt-2 text-sm text-slate-500">Cela peut prendre quelques secondes</p>
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
