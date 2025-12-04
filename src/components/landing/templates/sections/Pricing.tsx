import { useState } from 'react';
import { PricingContent } from '@/config/landingPageSchema';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowRightCircle } from 'lucide-react';

interface PricingProps {
  content: PricingContent;
  landingSlug?: string;
}

export function Pricing({ content, landingSlug }: PricingProps) {
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
      className="relative py-20 md:py-28 px-4 font-inter"
      style={{ 
        backgroundColor: '#f8f9fa', 
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Titre avec dégradé */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4">
          <span 
            style={{ 
              background: 'linear-gradient(90deg, #f97316, #db2777, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {content.headline}
          </span>
        </h2>

        {/* Sous-titre */}
        <p 
          className="text-lg md:text-xl text-center mb-12 font-medium"
          style={{ color: '#1e1b4b' }}
        >
          {content.subheadline}
        </p>

        {/* CGV Checkbox */}
        <div className="flex items-center justify-center gap-3 mb-10 max-w-2xl mx-auto">
          <Checkbox 
            id="cgv-accept-pricing" 
            checked={cgvAccepted} 
            onCheckedChange={(checked) => setCgvAccepted(checked === true)}
            className="border-gray-400"
          />
          <label 
            htmlFor="cgv-accept-pricing" 
            className="text-sm cursor-pointer text-left"
            style={{ color: '#1e1b4b' }}
          >
            {"J'accepte les "}
            <a 
              href={legalLinks.cgv} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
              style={{ color: '#f97316' }}
            >
              CGV
            </a>
            {", la "}
            <a 
              href={legalLinks.confidentialite} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
              style={{ color: '#f97316' }}
            >
              Politique de Confidentialité
            </a>
            {" et les "}
            <a 
              href={legalLinks.mentions} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
              style={{ color: '#f97316' }}
            >
              Mentions Légales
            </a>
          </label>
        </div>

        {/* Offres */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {content.offers.map((offer, index) => {
            const isHighlighted = !!offer.ribbon;
            return (
              <div 
                key={index}
                className="relative bg-white rounded-lg overflow-hidden"
                style={{ 
                  border: isHighlighted ? '3px solid #ef4444' : '2px solid #e5e7eb'
                }}
              >

                {/* Contenu de la carte */}
                <div className="p-8 pt-10 text-center">
                  {/* Nom de l'offre */}
                  <h3 
                    className="text-xl font-bold tracking-wider mb-6"
                    style={{ color: '#1e1b4b' }}
                  >
                    {offer.name}
                  </h3>

                  {/* Prix */}
                  <div className="mb-2">
                    <span 
                      className="text-2xl align-top"
                      style={{ color: '#1e1b4b' }}
                    >
                      €
                    </span>
                    <span 
                      className="text-6xl md:text-7xl font-bold"
                      style={{ color: '#1e1b4b' }}
                    >
                      {offer.price}
                    </span>
                  </div>

                  {/* Sous-prix */}
                  <p 
                    className="text-sm mb-8"
                    style={{ color: '#6b7280' }}
                  >
                    ou 3x {Math.ceil(offer.price / 3)}€ sans frais
                  </p>

                  {/* Features */}
                  <div className="border-t border-gray-200">
                    {offer.features.map((feature, i) => (
                      <div 
                        key={i} 
                        className="flex items-center justify-center gap-3 py-4 border-b border-gray-200"
                      >
                        <ArrowRightCircle 
                          className="w-5 h-5 flex-shrink-0" 
                          style={{ color: '#f97316' }}
                          fill="#f97316"
                          stroke="white"
                        />
                        <span 
                          className="text-base"
                          style={{ color: '#1e1b4b' }}
                        >
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button 
                    size="lg"
                    onClick={handleCtaClick}
                    disabled={!cgvAccepted}
                    className="w-full max-w-xs mx-auto mt-8 text-lg py-6 h-auto rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                    style={{ 
                      background: '#f97316',
                      color: 'white'
                    }}
                  >
                    {offer.cta}
                  </Button>

                  {/* Texte sous le CTA */}
                  <p 
                    className="text-sm mt-4"
                    style={{ color: '#6b7280' }}
                  >
                    Payable en 3 fois sans frais
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
