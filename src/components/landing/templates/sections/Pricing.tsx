import { useState } from 'react';
import { PricingContent } from '@/config/landingPageSchema';
import { useTheme, getGradientStyle } from '@/theme/ThemeProvider';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface PricingProps {
  content: PricingContent;
  landingSlug?: string;
}

export function Pricing({ content, landingSlug }: PricingProps) {
  const { theme } = useTheme();
  const gradientStyle = getGradientStyle(theme);
  const [cgvAccepted, setCgvAccepted] = useState(false);

  const handleCtaClick = (e: React.MouseEvent) => {
    if (!cgvAccepted) {
      e.preventDefault();
      toast.error("Veuillez accepter les CGV pour continuer");
      return;
    }
  };

  // Generate legal page links based on landing slug
  const legalLinks = landingSlug ? {
    cgv: `/lp/${landingSlug}/legal/cgv`,
    confidentialite: `/lp/${landingSlug}/legal/politique_confidentialite`,
    mentions: `/lp/${landingSlug}/legal/mentions_legales`,
  } : {
    cgv: '/cgv',
    confidentialite: '/confidentialite',
    mentions: '/mentions-legales',
  };

  return (
    <section 
      className="relative py-24 md:py-32 px-4 font-inter"
      style={{ backgroundColor: theme.colors.bgLight, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
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

        {/* CGV Checkbox */}
        <div className="flex items-center justify-center gap-3 mb-10 max-w-2xl mx-auto">
          <Checkbox 
            id="cgv-accept-pricing" 
            checked={cgvAccepted} 
            onCheckedChange={(checked) => setCgvAccepted(checked === true)}
            className="border-current"
            style={{ borderColor: theme.colors.textDark }}
          />
          <label 
            htmlFor="cgv-accept-pricing" 
            className="text-sm cursor-pointer text-left"
            style={{ color: theme.colors.textDark }}
          >
            {"J'accepte les "}
            <a 
              href={legalLinks.cgv} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
              style={{ color: theme.colors.primary }}
            >
              CGV
            </a>
            {", la "}
            <a 
              href={legalLinks.confidentialite} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
              style={{ color: theme.colors.primary }}
            >
              Politique de Confidentialité
            </a>
            {" et les "}
            <a 
              href={legalLinks.mentions} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
              style={{ color: theme.colors.primary }}
            >
              Mentions Légales
            </a>
          </label>
        </div>

        {/* Offers */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {content.offers.map((offer, index) => {
            const isHighlighted = !!offer.ribbon;
            return (
              <div 
                key={index}
                className="p-10 rounded-3xl shadow-2xl relative"
                style={{ 
                  backgroundColor: isHighlighted ? theme.colors.bgLight : theme.colors.textLight,
                  border: isHighlighted ? `3px solid ${theme.colors.primary}` : `2px solid ${theme.colors.textDark}1a`
                }}
              >
                {offer.ribbon && (
                  <div 
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-sm font-bold"
                    style={{ 
                      background: offer.ribbonColor || gradientStyle,
                      color: theme.colors.textLight
                    }}
                  >
                    {offer.ribbon}
                  </div>
                )}

                <h3 
                  className="text-3xl md:text-4xl font-bold mb-4"
                  style={{ color: theme.colors.textDark }}
                >
                  {offer.name}
                </h3>

                <div className="mb-8">
                  <span 
                    className="text-5xl md:text-6xl font-bold"
                    style={{ color: theme.colors.primary }}
                  >
                    {offer.price}€
                  </span>
                </div>

                <ul className="space-y-4 mb-8">
                  {offer.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 
                        className="w-6 h-6 flex-shrink-0 mt-1" 
                        style={{ color: theme.colors.accentGreen }}
                      />
                      <span 
                        className="text-base md:text-lg"
                        style={{ color: theme.colors.textDark }}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button 
                  size="lg"
                  onClick={handleCtaClick}
                  disabled={!cgvAccepted}
                  className="w-full text-xl py-8 h-auto gradient-button shadow-xl hover:shadow-2xl transition-all rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    background: isHighlighted ? gradientStyle : theme.colors.primary,
                    color: theme.colors.textLight
                  }}
                >
                  {offer.cta}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
