import { AgitationContent } from '@/config/landingPageSchema';
import { useTheme } from '@/theme/ThemeProvider';
import { AlertCircle } from 'lucide-react';

interface AgitationProps {
  content: AgitationContent;
}

export function Agitation({ content }: AgitationProps) {
  const { theme } = useTheme();

  return (
    <section 
      className="relative py-24 md:py-32 px-4"
      style={{ backgroundColor: theme.colors.bgDark }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Headline */}
        <h2 
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6"
          style={{ color: theme.colors.textLight }}
        >
          {content.headline}
        </h2>

        {/* Subheadline */}
        {content.subheadline && (
          <p 
            className="text-xl md:text-2xl text-center mb-16 max-w-4xl mx-auto"
            style={{ color: theme.colors.textLight, opacity: 0.9 }}
          >
            {content.subheadline}
          </p>
        )}

        {/* Pain Points Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {content.painPoints.map((pain, index) => (
            <div 
              key={index}
              className="flex items-start gap-4 p-6 rounded-2xl transition-all hover:scale-105"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <AlertCircle 
                className="w-6 h-6 flex-shrink-0 mt-1" 
                style={{ color: theme.colors.accentRed }}
              />
              <p 
                className="text-base md:text-lg leading-relaxed"
                style={{ color: theme.colors.textLight }}
              >
                {pain.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
