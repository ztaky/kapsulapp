import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, X } from 'lucide-react';

interface FullscreenWrapperProps {
  children: ReactNode;
  title?: string;
}

export function FullscreenWrapper({ children, title }: FullscreenWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        // Fallback to CSS fullscreen for browsers that don't support the API
        setIsFullscreen(true);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        setIsFullscreen(false);
      }
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (err) {
        // Silent fail
      }
    }
    setIsFullscreen(false);
  }, []);

  // Listen for escape key and fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, exitFullscreen]);

  return (
    <div 
      ref={containerRef} 
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}
    >
      {/* Fullscreen button */}
      <div className={`absolute top-2 right-2 z-10 flex gap-2 ${isFullscreen ? 'top-4 right-4' : ''}`}>
        {isFullscreen && title && (
          <span className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium">
            {title}
          </span>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={isFullscreen ? exitFullscreen : toggleFullscreen}
          className="bg-background/90 backdrop-blur-sm hover:bg-background shadow-md"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="h-4 w-4 mr-1" />
              Quitter
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4 mr-1" />
              Plein écran
            </>
          )}
        </Button>
        {isFullscreen && (
          <Button
            variant="secondary"
            size="sm"
            onClick={exitFullscreen}
            className="bg-background/90 backdrop-blur-sm hover:bg-background shadow-md"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className={isFullscreen ? 'h-full w-full overflow-auto pt-16 px-4 pb-4' : ''}>
        {children}
      </div>
    </div>
  );
}
