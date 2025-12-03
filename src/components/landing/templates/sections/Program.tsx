import { ProgramContent } from '@/config/landingPageSchema';
import { CheckCircle2 } from 'lucide-react';

interface ProgramProps {
  content: ProgramContent;
}

export function Program({ content }: ProgramProps) {
  const gradientStyle = 'linear-gradient(90deg, #ea580c 0%, #ec4899 100%)';
  const orangeColor = '#ea580c';
  const redColor = '#dc2626';
  const greenColor = '#10b981';

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
            const accentColor = isWeek1 ? orangeColor : redColor;
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
                        className="font-bold text-lg mb-1"
                        style={{ color: '#0f172a' }}
                      >
                        {day.day}
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
          <button
            className="px-10 py-5 rounded-full text-white text-xl font-bold transition-all hover:scale-105 hover:shadow-xl"
            style={{ 
              background: gradientStyle,
              boxShadow: '0 10px 30px rgba(234, 88, 12, 0.3)'
            }}
          >
            Je veux la méthode IA Mastery
          </button>
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
