import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Smartphone } from "lucide-react";

interface EmailPreviewDialogProps {
  template: any;
  onClose: () => void;
}

const PREVIEW_DATA = {
  "{{student_name}}": "Marie Dupont",
  "{{student_email}}": "marie@example.com",
  "{{course_name}}": "Formation Marketing Digital",
  "{{academy_name}}": "Mon Académie",
  "{{coach_name}}": "Jean Martin",
  "{{purchase_amount}}": "297€",
  "{{login_url}}": "https://example.com/login",
  "{{subject}}": "Bienvenue dans votre formation !",
};

export function EmailPreviewDialog({ template, onClose }: EmailPreviewDialogProps) {
  if (!template) return null;

  const previewHtml = Object.entries(PREVIEW_DATA).reduce(
    (html, [key, value]) => html.replaceAll(key, value),
    template.html_content
  );

  const previewSubject = Object.entries(PREVIEW_DATA).reduce(
    (subject, [key, value]) => subject.replaceAll(key, value),
    template.subject
  );

  return (
    <Dialog open={!!template} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Aperçu : {template.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-slate-100 rounded-lg p-3">
            <p className="text-sm text-slate-500">Sujet :</p>
            <p className="font-medium text-slate-900">{previewSubject}</p>
          </div>

          <Tabs defaultValue="desktop" className="w-full">
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="desktop" className="gap-2">
                <Monitor className="h-4 w-4" />
                Desktop
              </TabsTrigger>
              <TabsTrigger value="mobile" className="gap-2">
                <Smartphone className="h-4 w-4" />
                Mobile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="desktop" className="mt-4">
              <div className="border rounded-lg overflow-hidden bg-white">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-[500px] border-0"
                  title="Email preview desktop"
                />
              </div>
            </TabsContent>

            <TabsContent value="mobile" className="mt-4">
              <div className="flex justify-center">
                <div className="w-[375px] border rounded-lg overflow-hidden bg-white shadow-lg">
                  <div className="bg-slate-200 h-6 flex items-center justify-center">
                    <div className="w-20 h-1 bg-slate-400 rounded-full" />
                  </div>
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-[500px] border-0"
                    title="Email preview mobile"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
