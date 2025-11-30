import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Loader2, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface CourseCoverUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  organizationId?: string;
}

export function CourseCoverUploader({ 
  value, 
  onChange, 
  organizationId 
}: CourseCoverUploaderProps) {
  const [uploading, setUploading] = useState(false);
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
        .from('course-covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-covers')
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

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      <Label className="text-slate-900 font-medium text-sm">
        Image de couverture
      </Label>
      <p className="text-xs text-muted-foreground">
        Format recommandé : 1280x720px (16:9)
      </p>
      
      {/* Current Image Preview */}
      {value ? (
        <div className="relative group">
          <img 
            src={value} 
            alt="Couverture" 
            className="w-full h-40 object-cover rounded-xl border border-slate-200"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Card 
          className="border-dashed border-2 border-slate-200 p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all rounded-xl"
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
                Cliquez pour ajouter une image
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG jusqu'à 5MB
              </p>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
