import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface ImportStudentsCSVDialogProps {
  organizationId: string;
  organizationName: string;
}

interface ParsedStudent {
  email: string;
  fullName: string | null;
}

interface ImportResult {
  email: string;
  success: boolean;
  message: string;
  isNewUser?: boolean;
}

export function ImportStudentsCSVDialog({ organizationId, organizationName }: ImportStudentsCSVDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "results">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const resetState = () => {
    setFile(null);
    setParsedStudents([]);
    setImportProgress(0);
    setImportResults([]);
    setStep("upload");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner un fichier CSV",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (csvFile: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: "Fichier vide",
          description: "Le fichier CSV ne contient pas de données",
          variant: "destructive",
        });
        return;
      }

      // Parse header to find email and name columns
      const header = lines[0].toLowerCase().split(/[,;]/).map((h) => h.trim().replace(/"/g, ""));
      const emailIndex = header.findIndex((h) => 
        h === "email" || h === "e-mail" || h === "mail" || h === "adresse email"
      );
      const nameIndex = header.findIndex((h) => 
        h === "nom" || h === "name" || h === "full_name" || h === "fullname" || 
        h === "nom complet" || h === "prenom" || h === "prénom"
      );

      if (emailIndex === -1) {
        toast({
          title: "Colonne email manquante",
          description: "Le fichier doit contenir une colonne 'email' ou 'mail'",
          variant: "destructive",
        });
        return;
      }

      // Parse data rows
      const students: ParsedStudent[] = [];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(/[,;]/).map((v) => v.trim().replace(/"/g, ""));
        const email = values[emailIndex]?.toLowerCase().trim();
        const fullName = nameIndex !== -1 ? values[nameIndex]?.trim() || null : null;

        if (email && emailRegex.test(email)) {
          // Check for duplicates
          if (!students.some((s) => s.email === email)) {
            students.push({ email, fullName });
          }
        }
      }

      if (students.length === 0) {
        toast({
          title: "Aucun email valide",
          description: "Le fichier ne contient aucune adresse email valide",
          variant: "destructive",
        });
        return;
      }

      setParsedStudents(students);
      setStep("preview");
    };

    reader.onerror = () => {
      toast({
        title: "Erreur de lecture",
        description: "Impossible de lire le fichier",
        variant: "destructive",
      });
    };

    reader.readAsText(csvFile);
  };

  const handleImport = async () => {
    setIsImporting(true);
    setStep("importing");
    setImportResults([]);

    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    const results: ImportResult[] = [];
    
    for (let i = 0; i < parsedStudents.length; i++) {
      const student = parsedStudents[i];
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-student`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              email: student.email,
              fullName: student.fullName,
              organizationId,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          if (result.limitReached) {
            results.push({
              email: student.email,
              success: false,
              message: "Limite d'étudiants atteinte",
            });
            // Stop importing if limit reached
            break;
          }
          results.push({
            email: student.email,
            success: false,
            message: result.error || "Erreur",
          });
        } else {
          results.push({
            email: student.email,
            success: true,
            message: result.isNewUser ? "Invitation envoyée" : "Ajouté",
            isNewUser: result.isNewUser,
          });
        }
      } catch (error) {
        results.push({
          email: student.email,
          success: false,
          message: "Erreur réseau",
        });
      }

      setImportProgress(((i + 1) / parsedStudents.length) * 100);
      setImportResults([...results]);
    }

    setIsImporting(false);
    setStep("results");

    // Refresh data
    queryClient.invalidateQueries({ queryKey: ["studio-students"] });
    queryClient.invalidateQueries({ queryKey: ["student-limit"] });
    queryClient.invalidateQueries({ queryKey: ["studio-stats"] });

    const successCount = results.filter((r) => r.success).length;
    toast({
      title: "Import terminé",
      description: `${successCount}/${results.length} étudiant(s) importé(s) avec succès`,
    });
  };

  const successCount = importResults.filter((r) => r.success).length;
  const errorCount = importResults.filter((r) => !r.success).length;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importer des étudiants</DialogTitle>
          <DialogDescription>
            Importez plusieurs étudiants en une fois via un fichier CSV
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4 py-4">
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Cliquez pour sélectionner un fichier CSV
              </p>
              <p className="text-xs text-muted-foreground">
                Le fichier doit contenir une colonne "email" (et optionnellement "nom")
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground font-medium mb-1">Format attendu :</p>
              <code className="text-xs block bg-background p-2 rounded">
                email,nom<br />
                jean@exemple.com,Jean Dupont<br />
                marie@exemple.com,Marie Martin
              </code>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>{parsedStudents.length} étudiant(s) détecté(s)</span>
            </div>
            <div className="max-h-[200px] overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Nom</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedStudents.slice(0, 50).map((student, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 truncate max-w-[200px]">{student.email}</td>
                      <td className="p-2 text-muted-foreground">{student.fullName || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedStudents.length > 50 && (
                <p className="text-xs text-muted-foreground p-2 text-center border-t">
                  ... et {parsedStudents.length - 50} autres
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetState}>
                Annuler
              </Button>
              <Button 
                onClick={handleImport}
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              >
                Importer {parsedStudents.length} étudiant(s)
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-4 py-8">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Import en cours...</span>
            </div>
            <Progress value={importProgress} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">
              {importResults.length} / {parsedStudents.length} traité(s)
            </p>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-4 py-4">
            <div className="flex gap-4 justify-center">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{successCount} réussi(s)</span>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span>{errorCount} échoué(s)</span>
                </div>
              )}
            </div>
            
            {errorCount > 0 && (
              <div className="max-h-[150px] overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Erreur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResults.filter((r) => !r.success).map((result, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 truncate max-w-[200px]">{result.email}</td>
                        <td className="p-2 text-destructive">{result.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setOpen(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
