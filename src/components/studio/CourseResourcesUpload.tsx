import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  X, 
  Plus,
  File
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

interface CourseResourcesUploadProps {
  files: AttachedFile[];
  links: string[];
  onFilesChange: (files: AttachedFile[]) => void;
  onLinksChange: (links: string[]) => void;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const ACCEPTED_FILE_TYPES = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/csv": "csv",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const getFileIcon = (type: string) => {
  if (type.includes("pdf") || type.includes("word") || type.includes("document")) {
    return FileText;
  }
  if (type.includes("excel") || type.includes("spreadsheet") || type.includes("csv")) {
    return FileSpreadsheet;
  }
  if (type.includes("powerpoint") || type.includes("presentation")) {
    return Presentation;
  }
  if (type.includes("image")) {
    return ImageIcon;
  }
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function CourseResourcesUpload({
  files,
  links,
  onFilesChange,
  onLinksChange,
}: CourseResourcesUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [newLink, setNewLink] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    setIsUploading(true);

    try {
      // Get current user ID for RLS-compliant path
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous devez être connecté pour uploader des fichiers");
        setIsUploading(false);
        return;
      }

      const newFiles: AttachedFile[] = [];

      for (const file of Array.from(selectedFiles)) {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} dépasse la limite de 20MB`);
          continue;
        }

        // Check file type
        if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
          toast.error(`Type de fichier non supporté: ${file.name}`);
          continue;
        }

        // Upload to Supabase storage with user_id as first folder (required by RLS policy)
        const fileId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const filePath = `${user.id}/${fileId}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("ai-assistant-uploads")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`Erreur d'upload pour ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("ai-assistant-uploads")
          .getPublicUrl(filePath);

        newFiles.push({
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          url: urlData.publicUrl,
        });
      }

      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles]);
        toast.success(`${newFiles.length} fichier(s) ajouté(s)`);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveFile = (fileId: string) => {
    onFilesChange(files.filter((f) => f.id !== fileId));
  };

  const handleAddLink = () => {
    const trimmedLink = newLink.trim();
    if (!trimmedLink) return;

    // Basic URL validation
    try {
      new URL(trimmedLink);
    } catch {
      toast.error("URL invalide");
      return;
    }

    if (links.includes(trimmedLink)) {
      toast.error("Ce lien existe déjà");
      return;
    }

    onLinksChange([...links, trimmedLink]);
    setNewLink("");
    toast.success("Lien ajouté");
  };

  const handleRemoveLink = (link: string) => {
    onLinksChange(links.filter((l) => l !== link));
  };

  const acceptedTypes = Object.keys(ACCEPTED_FILE_TYPES).join(",");

  return (
    <div className="space-y-6">
      {/* File upload zone */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-2 block">
          Documents (facultatif)
        </Label>
        <div
          className={`
            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
            transition-colors hover:border-orange-300 hover:bg-orange-50/50
            ${isUploading ? "border-orange-400 bg-orange-50" : "border-slate-200"}
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className={`h-8 w-8 mx-auto mb-2 ${isUploading ? "text-orange-500 animate-pulse" : "text-slate-400"}`} />
          <p className="text-sm text-slate-600">
            {isUploading ? "Upload en cours..." : "Glissez vos fichiers ici ou cliquez pour sélectionner"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            PDF, Word, Excel, PowerPoint, Images (max 20MB)
          </p>
        </div>
      </div>

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Fichiers ajoutés ({files.length})
          </Label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {files.map((file) => {
              const Icon = getFileIcon(file.type);
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span className="text-sm text-slate-700 truncate">{file.name}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(file.id)}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Links section */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-2 block">
          Liens de référence (facultatif)
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="https://exemple.com/article"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
              className="pl-9 rounded-lg border-slate-200"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleAddLink}
            className="rounded-lg border-slate-200"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Links list */}
      {links.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Liens ajoutés ({links.length})
          </Label>
          <div className="space-y-2 max-h-24 overflow-y-auto">
            {links.map((link) => (
              <div
                key={link}
                className="flex items-center justify-between p-2 bg-blue-50 rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <LinkIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate"
                  >
                    {link}
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveLink(link)}
                  className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
