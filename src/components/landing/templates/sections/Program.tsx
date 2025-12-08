import { ProgramContent } from '@/config/landingPageSchema';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProgramProps {
  content: ProgramContent;
  primaryColor?: string;
  primaryDarkColor?: string;
}

export function Program({ content, primaryColor = '#e11d48', primaryDarkColor = '#9333ea' }: ProgramProps) {
  const gradientStyle = `linear-gradient(90deg, ${primaryColor} 0%, ${primaryDarkColor} 100%)`;
  const coralColor = primaryColor;
  const purpleColor = primaryDarkColor;
  const greenColor = '#10b981';

  const handleScrollToPricing = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      className="relative py-24 md:py-32 px-4 font-inter"
      style={{ 
        backgroundColor: '#fdfbf7',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Headline - "La méthode" + gradient text */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4">
          <span style={{ color: '#1a1a1a' }}>La méthode </span>
          <span 
            style={{ 
              background: gradientStyle,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {content.headline}
          </span>
        </h2>

        {/* Subheadline */}
        <p 
          className="text-xl md:text-2xl text-center mb-16 max-w-4xl mx-auto"
          style={{ color: '#4b5563' }}
        >
          {content.subheadline}
        </p>

        {/* Two columns - Semaine 1 & Semaine 2 - NO CARDS */}
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          {content.weeks.map((week, weekIndex) => {
            const isWeek1 = weekIndex === 0;
            const accentColor = isWeek1 ? coralColor : purpleColor;
            const weekNumber = isWeek1 ? '1' : '2';
            const subtitle = isWeek1 
              ? "L'IA devient ton assistant opérationnel"
              : "L'IA devient ton partenaire créatif";

            return (
              <div key={weekIndex}>
                {/* Week title - "Semaine 1" / "Semaine 2" */}
                <h3 
                  className="text-2xl md:text-3xl font-bold mb-2"
                  style={{ color: '#0f172a' }}
                >
                  Semaine {weekNumber}
                </h3>

                {/* Colored subtitle */}
                <p 
                  className="text-lg font-medium mb-8"
                  style={{ color: accentColor }}
                >
                  {subtitle}
                </p>

                {/* Days list - Full "Jour X : Titre" without bullets */}
                <div className="space-y-6">
                  {week.days.map((day, dayIndex) => (
                    <div key={dayIndex}>
                      <p 
                        className="text-lg mb-1"
                        style={{ color: '#0f172a', fontWeight: 700 }}
                      >
                        <strong>{day.day}</strong>
                      </p>
                      <p 
                        className="text-gray-600 leading-relaxed"
                      >
                        {day.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Deliverables section - NO CARD, single column */}
        <div className="text-center mb-12">
          <h3 
            className="text-2xl md:text-3xl font-bold mb-8"
            style={{ color: '#0f172a' }}
          >
            À la fin de ces 14 jours, tu auras
          </h3>
          
          <div className="flex flex-col items-start max-w-lg mx-auto space-y-4">
            {content.deliverables.map((deliverable, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle2 
                  className="w-6 h-6 flex-shrink-0" 
                  style={{ color: greenColor }}
                />
                <span 
                  className="text-lg text-left"
                  style={{ color: '#374151' }}
                >
                  {deliverable}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={handleScrollToPricing}
            className="text-lg md:text-xl px-10 py-6 h-auto rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] text-white font-semibold"
            style={{ 
              background: gradientStyle,
              boxShadow: `0 10px 30px ${primaryColor}4D`
            }}
          >
            Je veux la méthode IA Mastery
          </Button>
          <p 
            className="mt-4 text-sm"
            style={{ color: '#9ca3af' }}
          >
            Accès immédiat • Paiement sécurisé
          </p>
        </div>
      </div>
    </section>
  );
}
