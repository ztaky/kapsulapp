import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Link as LinkIcon, Upload, FileText, Image, File, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Resource {
  id: string;
  type: 'link' | 'file';
  title: string;
  url: string;
  fileType?: string;
  fileSize?: number;
}

interface LessonResourcesManagerProps {
  resources: Resource[];
  onChange: (resources: Resource[]) => void;
  lessonId?: string;
}

export function LessonResourcesManager({ resources, onChange, lessonId }: LessonResourcesManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const addLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      toast.error('Veuillez remplir le titre et l\'URL');
      return;
    }

    const newResource: Resource = {
      id: crypto.randomUUID(),
      type: 'link',
      title: newLinkTitle,
      url: newLinkUrl,
    };

    onChange([...resources, newResource]);
    setNewLinkTitle('');
    setNewLinkUrl('');
    toast.success('Lien ajouté');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newResources: Resource[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} dépasse 10MB`);
        continue;
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = lessonId ? `${lessonId}/${fileName}` : fileName;

      const { error: uploadError } = await supabase.storage
        .from('lesson-resources')
        .upload(filePath, file);

      if (uploadError) {
        toast.error(`Erreur upload ${file.name}: ${uploadError.message}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('lesson-resources')
        .getPublicUrl(filePath);

      newResources.push({
        id: crypto.randomUUID(),
        type: 'file',
        title: file.name,
        url: publicUrl,
        fileType: fileExt,
        fileSize: file.size,
      });
    }

    if (newResources.length > 0) {
      onChange([...resources, ...newResources]);
      toast.success(`${newResources.length} fichier(s) ajouté(s)`);
    }

    setIsUploading(false);
    event.target.value = '';
  };

  const removeResource = (id: string) => {
    onChange(resources.filter(r => r.id !== id));
    toast.success('Ressource supprimée');
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="h-4 w-4" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      return <Image className="h-4 w-4" />;
    }
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileType)) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <Label>Ressources téléchargeables</Label>

      {/* Liste des ressources existantes */}
      {resources.length > 0 && (
        <div className="space-y-2">
          {resources.map((resource) => (
            <Card key={resource.id} className="bg-muted/30">
              <CardContent className="p-3 flex items-center gap-3">
                {resource.type === 'link' ? (
                  <LinkIcon className="h-4 w-4 text-primary" />
                ) : (
                  getFileIcon(resource.fileType)
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{resource.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {resource.type === 'file' && resource.fileSize
                      ? formatFileSize(resource.fileSize)
                      : resource.url}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeResource(resource.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ajouter un lien */}
      <Card className="border-dashed">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Ajouter un lien
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Titre du lien"
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
            />
            <Input
              type="url"
              placeholder="https://..."
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addLink}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter le lien
          </Button>
        </CardContent>
      </Card>

      {/* Upload de fichiers */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.zip"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground hover:text-foreground transition-colors">
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Upload className="h-8 w-8" />
              )}
              <p className="text-sm font-medium">
                {isUploading ? 'Upload en cours...' : 'Cliquez pour uploader des fichiers'}
              </p>
              <p className="text-xs">
                PDF, DOC, XLS, images... (max 10MB par fichier)
              </p>
            </div>
          </label>
        </CardContent>
      </Card>
    </div>
  );
}