import { SolutionTimeframeContent } from '@/config/landingPageSchema';
import { useTheme } from '@/theme/ThemeProvider';
import { Clock, Users, Lightbulb } from 'lucide-react';

interface SolutionTimeframeProps {
  content: SolutionTimeframeContent;
}

export function SolutionTimeframe({ content }: SolutionTimeframeProps) {
  const { theme } = useTheme();
  
  // Dégradé harmonisé avec Hero
  const statGradient = 'linear-gradient(90deg, #ea580c 0%, #9333ea 100%)';
  const accentColor = '#ea580c';

  return (
    <section 
      className="relative py-24 md:py-32 px-4"
      style={{ backgroundColor: '#fef8f3' }}
    >
      <div className="max-w-6xl mx-auto text-center">
        {/* Headline */}
        <h2 
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
          style={{ color: theme.colors.textDark }}
        >
          {content.headline}
        </h2>

        {/* Stats - 3 premières colonnes */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 justify-center items-center mb-8 mt-20">
          {content.stats.slice(0, 3).map((stat, index) => (
            <div key={index} className="text-center">
              <div 
                className="text-3xl md:text-4xl font-bold mb-2"
                style={{ 
                  background: statGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {stat.value}
              </div>
              <div 
                className="text-lg md:text-xl"
                style={{ color: theme.colors.textDark }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* 4ème stat centrée en dessous */}
        {content.stats[3] && (
          <div className="text-center mb-16">
            <div 
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{ 
                background: statGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {content.stats[3].value}
            </div>
            <div 
              className="text-lg md:text-xl"
              style={{ color: theme.colors.textDark }}
            >
              {content.stats[3].label}
            </div>
          </div>
        )}

        {/* Social Proof */}
        <p 
          className="text-xl md:text-2xl font-semibold mb-16"
          style={{ color: theme.colors.textDark }}
        >
          {content.socialProof}
        </p>

        {/* Secret Box */}
        <div 
          className="max-w-3xl mx-auto p-10 md:p-12 rounded-3xl shadow-xl"
          style={{ 
            backgroundColor: 'white',
            border: `2px solid ${accentColor}`
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <Lightbulb 
              className="w-8 h-8" 
              style={{ color: accentColor }}
            />
            <h3 
              className="text-2xl md:text-3xl font-bold"
              style={{ color: theme.colors.textDark }}
            >
              {content.secretBox.title}
            </h3>
          </div>
          <p 
            className="text-lg md:text-xl leading-relaxed"
            style={{ color: theme.colors.textDark }}
          >
            {content.secretBox.content}
          </p>
        </div>
      </div>
    </section>
  );
}
