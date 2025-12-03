import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface AIGeneratedToolProps {
  config: {
    description?: string;
    generatedCode?: string;
    generatedAt?: string;
  };
}

export function AIGeneratedTool({ config }: AIGeneratedToolProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(300);

  useEffect(() => {
    if (!config.generatedCode || !iframeRef.current) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'resize' && typeof event.data.height === 'number') {
        setIframeHeight(Math.max(200, event.data.height + 20));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [config.generatedCode]);

  if (!config.generatedCode) {
    return (
      <Card className="border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-background">
        <CardContent className="text-center py-12">
          <Sparkles className="h-12 w-12 mx-auto text-purple-400 mb-4" />
          <p className="text-muted-foreground">Outil interactif non configuré</p>
        </CardContent>
      </Card>
    );
  }

  // Wrap the generated code with auto-resize script
  const wrappedCode = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { box-sizing: border-box; }
        body { 
          margin: 0; 
          padding: 16px; 
          font-family: system-ui, -apple-system, sans-serif;
          background: transparent;
        }
      </style>
    </head>
    <body>
      ${config.generatedCode}
      <script>
        // Auto-resize iframe
        function sendHeight() {
          const height = document.body.scrollHeight;
          parent.postMessage({ type: 'resize', height }, '*');
        }
        
        // Send height on load and on DOM changes
        window.addEventListener('load', sendHeight);
        window.addEventListener('resize', sendHeight);
        
        // Observe DOM changes
        const observer = new MutationObserver(sendHeight);
        observer.observe(document.body, { 
          childList: true, 
          subtree: true, 
          attributes: true 
        });
        
        // Initial send
        setTimeout(sendHeight, 100);
      </script>
    </body>
    </html>
  `;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Outil Interactif
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <iframe
          ref={iframeRef}
          srcDoc={wrappedCode}
          sandbox="allow-scripts allow-forms"
          className="w-full border-0"
          style={{ height: `${iframeHeight}px` }}
          title="Outil interactif IA"
        />
      </CardContent>
    </Card>
  );
}
