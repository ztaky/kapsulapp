import { HeroContent } from '@/config/landingPageSchema';
import { useTheme, getGradientStyle } from '@/theme/ThemeProvider';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Star } from 'lucide-react';

interface HeroProps {
  content: HeroContent;
}

export function Hero({ content }: HeroProps) {
  const { theme } = useTheme();
  const gradientStyle = getGradientStyle(theme);

  return (
    <section 
      className="relative min-h-[90vh] flex items-center justify-center px-4 py-20"
      style={{ backgroundColor: theme.colors.bgLight }}
    >
      <div className="max-w-5xl mx-auto text-center space-y-8">
        {/* Pre-headline */}
        <p 
          className="text-sm md:text-base font-medium"
          style={{ color: theme.colors.textDark }}
        >
          {content.preHeadline}
        </p>

        {/* Main Headline */}
        <h1 className="space-y-2">
          <div 
            className="text-4xl md:text-5xl lg:text-6xl font-bold"
            style={{ color: theme.colors.textDark }}
          >
            {content.headline.line1}
          </div>
          <div 
            className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text"
            style={{ 
              background: gradientStyle,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {content.headline.line2}
          </div>
          <div 
            className="text-4xl md:text-5xl lg:text-6xl font-bold"
            style={{ color: theme.colors.textDark }}
          >
            {content.headline.line3}
          </div>
        </h1>

        {/* Subheadline */}
        <p 
          className="text-lg md:text-xl max-w-3xl mx-auto"
          style={{ color: theme.colors.textDark }}
        >
          {content.subheadline}
        </p>

        {/* Benefits */}
        <div className="flex flex-col md:flex-row gap-4 justify-center items-start md:items-center max-w-4xl mx-auto">
          {content.benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-2 text-left">
              <CheckCircle2 
                className="w-5 h-5 flex-shrink-0 mt-0.5" 
                style={{ color: theme.colors.accentGreen }}
              />
              <span 
                className="text-sm md:text-base"
                style={{ color: theme.colors.textDark }}
              >
                {benefit}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          <Button 
            size="lg"
            className="text-lg px-8 py-6 h-auto gradient-button shadow-lg hover:shadow-xl transition-all"
            style={{ 
              background: gradientStyle,
              color: theme.colors.textLight
            }}
          >
            {content.cta.text}
          </Button>
        </div>

        {/* Testimonial Snippet */}
        <div 
          className="pt-8 max-w-2xl mx-auto p-6 rounded-2xl shadow-sm"
          style={{ backgroundColor: 'white' }}
        >
          <div className="flex justify-center gap-1 mb-3">
            {Array.from({ length: content.testimonialSnippet.stars }).map((_, i) => (
              <Star 
                key={i} 
                className="w-5 h-5 fill-current" 
                style={{ color: '#fbbf24' }}
              />
            ))}
          </div>
          <p 
            className="text-base md:text-lg italic mb-2"
            style={{ color: theme.colors.textDark }}
          >
            "{content.testimonialSnippet.text}"
          </p>
          <p 
            className="text-sm font-medium"
            style={{ color: theme.colors.primary }}
          >
            — {content.testimonialSnippet.author}
          </p>
        </div>
      </div>
    </section>
  );
}
