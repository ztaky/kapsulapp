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
      className="relative min-h-[90vh] flex items-center justify-center px-4 py-32 md:py-40"
      style={{ backgroundColor: '#fef8f3' }}
    >
      <div className="max-w-6xl mx-auto text-center space-y-12">
        {/* Pre-headline */}
        <p 
          className="text-base md:text-lg font-medium"
          style={{ color: theme.colors.textDark }}
        >
          {content.preHeadline}
        </p>

        {/* Main Headline */}
        <h1 className="space-y-3">
          <div 
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
            style={{ color: theme.colors.textDark }}
          >
            {content.headline.line1}
          </div>
          <div 
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
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
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
            style={{ color: theme.colors.textDark }}
          >
            {content.headline.line3}
          </div>
        </h1>

        {/* Subheadline */}
        <p 
          className="text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed"
          style={{ color: theme.colors.textDark }}
        >
          {content.subheadline}
        </p>

        {/* Benefits */}
        <div className="flex flex-col md:flex-row gap-8 justify-center items-start md:items-center max-w-5xl mx-auto pt-4">
          {content.benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3 text-left">
              <CheckCircle2 
                className="w-6 h-6 flex-shrink-0 mt-1" 
                style={{ color: theme.colors.accentGreen }}
              />
              <span 
                className="text-base md:text-lg leading-snug"
                style={{ color: theme.colors.textDark }}
              >
                {benefit}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="pt-8">
          <Button 
            size="lg"
            className="text-xl px-12 py-8 h-auto gradient-button shadow-2xl hover:shadow-3xl transition-all rounded-full"
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
          className="pt-12 max-w-3xl mx-auto p-10 md:p-12 rounded-3xl shadow-2xl"
          style={{ 
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.05)'
          }}
        >
          <div className="flex justify-center gap-1 mb-5">
            {Array.from({ length: content.testimonialSnippet.stars }).map((_, i) => (
              <Star 
                key={i} 
                className="w-6 h-6 fill-current" 
                style={{ color: '#fbbf24' }}
              />
            ))}
          </div>
          <p 
            className="text-lg md:text-xl italic mb-4 leading-relaxed"
            style={{ color: theme.colors.textDark }}
          >
            "{content.testimonialSnippet.text}"
          </p>
          <p 
            className="text-base font-semibold"
            style={{ color: theme.colors.primary }}
          >
            — {content.testimonialSnippet.author}
          </p>
        </div>
      </div>
    </section>
  );
}
