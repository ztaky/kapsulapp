import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Upload, Link, Sparkles, Loader2, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  organizationId?: string;
}

export function ImageUploader({ 
  value, 
  onChange, 
  label = "Image",
  placeholder = "Décrivez l'image à générer...",
  organizationId 
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${organizationId || 'public'}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('landing-page-references')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('landing-page-references')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success("Image uploadée avec succès");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      toast.error("Veuillez entrer une URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
      onChange(urlInput);
      setUrlInput("");
      toast.success("URL ajoutée");
    } catch {
      toast.error("URL invalide");
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Veuillez décrire l'image à générer");
      return;
    }

    setGenerating(true);
    try {
      const response = await supabase.functions.invoke('edit-landing-content', {
        body: {
          action: 'generate-image',
          prompt: aiPrompt,
        }
      });

      if (response.error) throw response.error;
      
      if (response.data?.imageUrl) {
        onChange(response.data.imageUrl);
        setAiPrompt("");
        toast.success("Image générée avec succès");
      } else {
        throw new Error("Pas d'image générée");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Erreur lors de la génération. Réessayez.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-3">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      
      {/* Current Image Preview */}
      {value && (
        <div className="relative group">
          <img 
            src={value} 
            alt="Preview" 
            className="w-full h-40 object-cover rounded-lg border"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload Options */}
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="text-xs">
            <Upload className="h-3 w-3 mr-1" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="text-xs">
            <Link className="h-3 w-3 mr-1" />
            URL
          </TabsTrigger>
          <TabsTrigger value="ai" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            IA
          </TabsTrigger>
        </TabsList>

        {/* Upload from PC */}
        <TabsContent value="upload" className="mt-3">
          <Card 
            className="border-dashed border-2 p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {uploading ? (
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
            ) : (
              <>
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Cliquez ou glissez une image ici
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG jusqu'à 5MB
                </p>
              </>
            )}
          </Card>
        </TabsContent>

        {/* URL Input */}
        <TabsContent value="url" className="mt-3 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <Button onClick={handleUrlSubmit} size="sm">
              <Link className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        {/* AI Generation */}
        <TabsContent value="ai" className="mt-3 space-y-3">
          <Textarea
            placeholder={placeholder}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={3}
          />
          <Button 
            onClick={handleAIGenerate} 
            disabled={generating || !aiPrompt.trim()}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Générer avec l'IA
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
