import { AgitationContent } from '@/config/landingPageSchema';
import { useTheme } from '@/theme/ThemeProvider';
import { XCircle, AlertTriangle } from 'lucide-react';
import stressedIllustration from '@/assets/agitation-stressed.png';
import confusedIllustration from '@/assets/agitation-confused.png';

interface AgitationProps {
  content: AgitationContent;
}

export function Agitation({ content }: AgitationProps) {
  const { theme } = useTheme();

  // Custom gradient matching Hero
  const subtitleGradient = 'linear-gradient(90deg, #e11d48 0%, #9333ea 100%)';

  return (
    <section 
      className="relative py-16 md:py-24 px-4 font-inter"
      style={{ backgroundColor: theme.colors.bgDark, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Card Container */}
        <div 
          className="rounded-3xl p-8 md:p-12 lg:p-16"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Headlines */}
          <div className="text-center mb-12">
            <h2 
              className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3"
              style={{ color: theme.colors.textLight }}
            >
              {content.headline}
            </h2>
            
            {content.subheadline && (
              <p 
                className="text-xl md:text-2xl font-semibold mb-4"
                style={{ 
                  background: subtitleGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {content.subheadline}
              </p>
            )}
            
            {content.supportingText && (
              <p 
                className="text-base md:text-lg"
                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                {content.supportingText}
              </p>
            )}
          </div>

          {/* Two Columns with Illustrations + Pain Points */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Left Column - Overwhelmed */}
            <div className="flex flex-col items-center">
              {/* Illustration centered above column */}
              <div className="mb-8">
                <img 
                  src={confusedIllustration} 
                  alt="Personne débordée" 
                  className="w-28 md:w-36 lg:w-44 h-auto"
                />
              </div>
              {content.overwhelmedPains && content.overwhelmedPains.length > 0 && (
                <div className="space-y-4 w-full">
                  {content.overwhelmedPains.map((pain, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3"
                    >
                      <XCircle 
                        className="w-5 h-5 flex-shrink-0 mt-0.5" 
                        style={{ color: '#dc2626' }}
                      />
                      <div>
                        <p 
                          className="font-semibold text-sm md:text-base"
                          style={{ color: theme.colors.textLight }}
                        >
                          {pain.title}
                        </p>
                        <p 
                          className="text-sm"
                          style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                        >
                          {pain.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - FOMO */}
            <div className="flex flex-col items-center">
              {/* Illustration centered above column */}
              <div className="mb-8">
                <img 
                  src={stressedIllustration} 
                  alt="Personne stressée" 
                  className="w-28 md:w-36 lg:w-44 h-auto"
                />
              </div>
              {content.fomoPains && content.fomoPains.length > 0 && (
                <div className="space-y-4 w-full">
                  {content.fomoPains.map((pain, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3"
                    >
                      <AlertTriangle 
                        className="w-5 h-5 flex-shrink-0 mt-0.5" 
                        style={{ color: '#e11d48' }}
                      />
                      <div>
                        <p 
                          className="font-semibold text-sm md:text-base"
                          style={{ color: theme.colors.textLight }}
                        >
                          {pain.title}
                        </p>
                        <p 
                          className="text-sm"
                          style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                        >
                          {pain.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
