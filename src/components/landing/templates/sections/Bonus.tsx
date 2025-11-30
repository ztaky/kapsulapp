import { BonusContent } from '@/config/landingPageSchema';
import { useTheme, getGradientStyle } from '@/theme/ThemeProvider';
import { Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BonusProps {
  content: BonusContent;
}

export function Bonus({ content }: BonusProps) {
  const { theme } = useTheme();
  const gradientStyle = getGradientStyle(theme);

  return (
    <section 
      className="relative py-24 md:py-32 px-4"
      style={{ backgroundColor: theme.colors.bgLight }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Headline */}
        <h2 
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6"
          style={{ color: theme.colors.textDark }}
        >
          {content.headline}
        </h2>

        {/* Subheadline */}
        <p 
          className="text-xl md:text-2xl text-center mb-16 max-w-4xl mx-auto"
          style={{ color: theme.colors.textDark }}
        >
          {content.subheadline}
        </p>

        {/* Bonus Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {content.items.map((item, index) => (
            <div 
              key={index}
              className="p-8 rounded-3xl shadow-xl relative overflow-hidden"
              style={{ 
                backgroundColor: theme.colors.textLight,
                border: `2px solid ${theme.colors.primary}`
              }}
            >
              <div 
                className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center"
                style={{ 
                  background: gradientStyle
                }}
              >
                <span 
                  className="text-xl font-bold"
                  style={{ color: theme.colors.textLight }}
                >
                  {index + 1}
                </span>
              </div>
              <Gift 
                className="w-12 h-12 mb-4" 
                style={{ color: theme.colors.primary }}
              />
              <h3 
                className="text-2xl md:text-3xl font-bold mb-3"
                style={{ color: theme.colors.textDark }}
              >
                {item.title}
              </h3>
              <p 
                className="text-lg font-semibold mb-4"
                style={{ color: theme.colors.primary }}
              >
                Valeur : {item.value}
              </p>
              <p 
                className="text-base md:text-lg leading-relaxed mb-4"
                style={{ color: theme.colors.textDark }}
              >
                {item.description}
              </p>
              {/* Contenu détaillé du bonus */}
              {item.content && (
                <div 
                  className="mt-4 pt-4 text-sm leading-relaxed"
                  style={{ 
                    color: theme.colors.textDark,
                    opacity: 0.8,
                    borderTop: `1px solid ${theme.colors.primary}30`
                  }}
                >
                  {item.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            size="lg"
            className="text-xl px-12 py-8 h-auto gradient-button shadow-2xl hover:shadow-3xl transition-all rounded-full"
            style={{ 
              background: gradientStyle,
              color: theme.colors.textLight
            }}
          >
            {content.cta}
          </Button>
        </div>
      </div>
    </section>
  );
}
