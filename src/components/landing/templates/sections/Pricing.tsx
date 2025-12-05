import { useState } from 'react';
import { PricingContent } from '@/config/landingPageSchema';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowRightCircle, CreditCard, Banknote } from 'lucide-react';

interface PricingProps {
  content: PricingContent;
  landingSlug?: string;
  installmentsEnabled?: boolean;
  installmentsCount?: number;
  onCheckout?: (paymentType: 'full' | 'installments') => void;
}

export function Pricing({ content, landingSlug, installmentsEnabled, installmentsCount = 3, onCheckout }: PricingProps) {
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'full' | 'installments'>('full');

  const handleCtaClick = (e: React.MouseEvent, paymentType: 'full' | 'installments') => {
    if (!cgvAccepted) {
      e.preventDefault();
      toast.error("Veuillez accepter les CGV pour continuer");
      return;
    }
    if (onCheckout) {
      onCheckout(paymentType);
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

  const price = content.offers[0]?.price || 0;
  const monthlyPrice = Math.ceil(price / installmentsCount);

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

        {/* Payment Options */}
        {installmentsEnabled ? (
          <>
            {/* Liste des inclusions */}
            {content.offers[0]?.features && content.offers[0].features.length > 0 && (
              <div className="max-w-2xl mx-auto mb-10">
                <h3 className="text-xl font-bold text-center mb-6" style={{ color: '#1e1b4b' }}>
                  Ce qui est inclus
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {content.offers[0].features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                      <ArrowRightCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#f97316' }} fill="#f97316" stroke="white" />
                      <span className="text-sm" style={{ color: '#1e1b4b' }}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Full Payment Option */}
            <div 
              className={`relative bg-white rounded-lg overflow-hidden cursor-pointer transition-all ${selectedPayment === 'full' ? 'ring-2 ring-orange-500 shadow-lg' : 'border-2 border-gray-200 hover:border-gray-300'}`}
              onClick={() => setSelectedPayment('full')}
            >
              <div className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Banknote className="w-5 h-5 text-green-600" />
                  <span className="font-semibold" style={{ color: '#1e1b4b' }}>Paiement comptant</span>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold" style={{ color: '#1e1b4b' }}>{price}€</span>
                </div>
                <Button 
                  size="lg"
                  onClick={(e) => handleCtaClick(e, 'full')}
                  disabled={!cgvAccepted}
                  className="w-full text-base py-5 h-auto rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                  style={{ background: '#22c55e', color: 'white' }}
                >
                  Payer {price}€
                </Button>
              </div>
            </div>

            {/* Installments Option */}
            <div 
              className={`relative bg-white rounded-lg overflow-hidden cursor-pointer transition-all ${selectedPayment === 'installments' ? 'ring-2 ring-orange-500 shadow-lg' : 'border-2 border-gray-200 hover:border-gray-300'}`}
              onClick={() => setSelectedPayment('installments')}
            >
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold py-1 text-center">
                FACILITÉ DE PAIEMENT
              </div>
              <div className="p-6 pt-10 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold" style={{ color: '#1e1b4b' }}>{installmentsCount}x sans frais</span>
                </div>
                <div className="mb-2">
                  <span className="text-4xl font-bold" style={{ color: '#1e1b4b' }}>{monthlyPrice}€</span>
                  <span className="text-lg text-gray-500">/mois</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">soit {price}€ au total</p>
                <Button 
                  size="lg"
                  onClick={(e) => handleCtaClick(e, 'installments')}
                  disabled={!cgvAccepted}
                  className="w-full text-base py-5 h-auto rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                  style={{ background: '#f97316', color: 'white' }}
                >
                  Payer en {installmentsCount}x
                </Button>
              </div>
            </div>
          </div>
          </>
        ) : (
          /* Single Payment Option (existing layout) */
          <div className="max-w-md mx-auto">
            {content.offers.length > 0 && (
              <div 
                className="relative bg-white rounded-lg overflow-hidden"
                style={{ border: '2px solid #e5e7eb' }}
              >
                <div className="p-8 pt-10 text-center">
                  <h3 
                    className="text-xl font-bold tracking-wider mb-6"
                    style={{ color: '#1e1b4b' }}
                  >
                    {content.offers[0].name}
                  </h3>
                  <div className="mb-2">
                    <span className="text-2xl align-top" style={{ color: '#1e1b4b' }}>€</span>
                    <span className="text-6xl md:text-7xl font-bold" style={{ color: '#1e1b4b' }}>
                      {content.offers[0].price}
                    </span>
                  </div>
                  <p className="text-sm mb-8" style={{ color: '#6b7280' }}>
                    ou 3x {Math.ceil(content.offers[0].price / 3)}€ sans frais
                  </p>
                  <div className="border-t border-gray-200">
                    {content.offers[0].features.map((feature, i) => (
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
                        <span className="text-base" style={{ color: '#1e1b4b' }}>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    size="lg"
                    onClick={(e) => handleCtaClick(e, 'full')}
                    disabled={!cgvAccepted}
                    className="w-full max-w-xs mx-auto mt-8 text-lg py-6 h-auto rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                    style={{ background: '#f97316', color: 'white' }}
                  >
                    {content.offers[0].cta}
                  </Button>
                  <p className="text-sm mt-4" style={{ color: '#6b7280' }}>
                    Payable en 3 fois sans frais
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
