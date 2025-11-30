import { HeroContent } from '@/config/landingPageSchema';
import { useTheme, getGradientStyle } from '@/theme/ThemeProvider';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Star } from 'lucide-react';

interface HeroProps {
  content: HeroContent & { hero_image?: string }; // Support both formats
}

export function Hero({ content }: HeroProps) {
  const { theme } = useTheme();
  const gradientStyle = getGradientStyle(theme);

  // Support both heroImage (new) and hero_image (legacy) formats
  const heroImageUrl = content.heroImage || (content as any).hero_image;
  const hasImage = heroImageUrl && heroImageUrl.trim() !== '';

  return (
    <section 
      className="relative min-h-[90vh] flex items-center justify-center px-4 py-32 md:py-40 overflow-hidden"
      style={{ backgroundColor: '#fef8f3' }}
    >
      {/* Background image if provided */}
      {hasImage && (
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div 
            className="absolute inset-0"
            style={{ 
              backgroundColor: 'rgba(254, 248, 243, 0.85)',
              backdropFilter: 'blur(2px)'
            }}
          />
        </div>
      )}

      <div className={`max-w-6xl mx-auto text-center space-y-12 relative z-10 ${hasImage ? 'grid md:grid-cols-2 gap-12 items-center text-left' : ''}`}>
        <div className={hasImage ? 'space-y-8' : 'space-y-12'}>
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
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
              style={{ color: theme.colors.textDark }}
            >
              {content.headline.line1}
            </div>
            <div 
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
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
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
              style={{ color: theme.colors.textDark }}
            >
              {content.headline.line3}
            </div>
          </h1>

          {/* Subheadline */}
          <p 
            className="text-lg md:text-xl max-w-4xl leading-relaxed"
            style={{ color: theme.colors.textDark }}
          >
            {content.subheadline}
          </p>

          {/* Benefits */}
          <div className={`flex flex-col gap-4 ${hasImage ? '' : 'md:flex-row md:gap-8 justify-center items-start md:items-center max-w-5xl mx-auto'}`}>
            {content.benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 text-left">
                <CheckCircle2 
                  className="w-5 h-5 flex-shrink-0 mt-0.5" 
                  style={{ color: theme.colors.accentGreen }}
                />
                <span 
                  className="text-base leading-snug"
                  style={{ color: theme.colors.textDark }}
                >
                  {benefit}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className={hasImage ? '' : 'pt-4'}>
            <Button 
              size="lg"
              className="text-lg px-10 py-6 h-auto gradient-button shadow-xl hover:shadow-2xl transition-all rounded-full"
              style={{ 
                background: gradientStyle,
                color: theme.colors.textLight
              }}
            >
              {content.cta.text}
            </Button>
          </div>
        </div>

        {/* Hero Image (displayed as featured image when present) */}
        {hasImage && (
          <div className="relative">
            <div 
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ 
                border: `4px solid ${theme.colors.primary}20`
              }}
            >
              <img 
                src={heroImageUrl} 
                alt="Hero"
                className="w-full h-auto object-cover aspect-[4/3]"
              />
            </div>
            {/* Decorative gradient blob behind */}
            <div 
              className="absolute -z-10 -top-4 -right-4 w-full h-full rounded-2xl opacity-30"
              style={{ background: gradientStyle }}
            />
          </div>
        )}

        {/* Testimonial Snippet - only show when no image or as full width */}
        {!hasImage && content.testimonialSnippet && (
          <div 
            className="pt-8 max-w-3xl mx-auto p-10 md:p-12 rounded-3xl shadow-2xl"
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
        )}
      </div>

      {/* Testimonial below when image is present */}
      {hasImage && content.testimonialSnippet && (
        <div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-2xl p-6 rounded-2xl shadow-xl z-10"
          style={{ 
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.05)'
          }}
        >
          <div className="flex items-center gap-4">
            <div className="flex gap-0.5">
              {Array.from({ length: content.testimonialSnippet.stars }).map((_, i) => (
                <Star 
                  key={i} 
                  className="w-4 h-4 fill-current" 
                  style={{ color: '#fbbf24' }}
                />
              ))}
            </div>
            <p 
              className="text-sm italic flex-1"
              style={{ color: theme.colors.textDark }}
            >
              "{content.testimonialSnippet.text}"
            </p>
            <p 
              className="text-sm font-semibold whitespace-nowrap"
              style={{ color: theme.colors.primary }}
            >
              — {content.testimonialSnippet.author}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}