import { HeroContent } from '@/config/landingPageSchema';
import { useTheme, getGradientStyle } from '@/theme/ThemeProvider';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Star } from 'lucide-react';

interface HeroProps {
  content: HeroContent & { hero_image?: string };
}

export function Hero({ content }: HeroProps) {
  const { theme } = useTheme();

  // Custom gradient: amber orange → dark purple/magenta
  const titleGradient = 'linear-gradient(90deg, #d97706 0%, #840a85 100%)';
  const buttonGradient = 'linear-gradient(135deg, #d97706 0%, #840a85 100%)';

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-24 md:py-32 overflow-hidden">
      {/* Grid background pattern */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundColor: '#fafafa',
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
        {/* Pre-headline with bold words */}
        <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
          Pour les <span className="font-semibold text-gray-800">dirigeants débordés</span> qui veulent se mettre à l'IA 
          mais qui <span className="font-semibold text-gray-800">ne savent pas par où commencer</span>.
        </p>

        {/* Main Headline */}
        <h1 className="space-y-1 md:space-y-2">
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
            {content.headline.line1}
          </div>
          <div 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
            style={{ 
              background: titleGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {content.headline.line2}
          </div>
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
            {content.headline.line3}
          </div>
        </h1>

        {/* Bold tagline */}
        <p className="text-lg md:text-xl font-bold text-gray-900">
          Formation par la pratique. Zéro théorie. Résultats garantis.
        </p>

        {/* Description */}
        <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          {content.subheadline}
        </p>

        {/* Benefits - Centered column */}
        <div className="flex flex-col gap-4 items-center max-w-xl mx-auto">
          {content.benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3 text-left">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-base text-gray-700 leading-snug">
                {benefit}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="pt-4 space-y-3">
          <Button 
            size="lg"
            className="text-base md:text-lg px-8 md:px-12 py-6 md:py-7 h-auto rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] text-white font-semibold"
            style={{ 
              background: buttonGradient,
            }}
          >
            {content.cta.text}
          </Button>
          
          {/* CTA Subtext */}
          <p className="text-sm text-gray-500">
            Accès immédiat · Paiement sécurisé
          </p>
        </div>

        {/* Testimonial Snippet - Simplified */}
        {content.testimonialSnippet && (
          <div className="pt-8 max-w-2xl mx-auto">
            <div className="flex justify-center gap-1 mb-4">
              {Array.from({ length: content.testimonialSnippet.stars }).map((_, i) => (
                <Star 
                  key={i} 
                  className="w-5 h-5 fill-current text-amber-400"
                />
              ))}
            </div>
            <p className="text-base md:text-lg italic text-gray-600 leading-relaxed">
              « {content.testimonialSnippet.text} »
            </p>
            <p className="text-sm font-medium text-gray-500 mt-2">
              – {content.testimonialSnippet.author}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
