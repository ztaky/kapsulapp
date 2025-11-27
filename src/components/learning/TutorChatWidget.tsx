import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sparkles } from "lucide-react";
import { AIAssistantChat } from "@/components/AIAssistantChat";

interface TutorChatWidgetProps {
  courseTitle: string;
  lessonTitle: string;
}

export function TutorChatWidget({ courseTitle, lessonTitle }: TutorChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl 
                   bg-gradient-to-br from-orange-500 to-pink-500 
                   hover:scale-110 transition-transform hover:shadow-orange-500/50"
        aria-label="Ouvrir l'assistant Kapsul"
      >
        <Sparkles className="h-6 w-6 text-white" />
      </Button>

      {/* Chat sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 flex flex-col">
          <SheetHeader className="p-6 border-b bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-950/20 dark:to-pink-950/20 shrink-0">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              Kapsul Assistant
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              Je suis là pour t'aider sur "{lessonTitle}"
            </p>
          </SheetHeader>
          
          <div className="flex-1 overflow-hidden">
            <AIAssistantChat
              apiEndpoint={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutor-chat`}
              context={{ courseTitle, lessonTitle }}
              placeholder="Pose-moi une question sur cette leçon..."
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
