import { ProgramContent } from '@/config/landingPageSchema';
import { CheckCircle2 } from 'lucide-react';

interface ProgramProps {
  content: ProgramContent;
}

export function Program({ content }: ProgramProps) {
  const gradientStyle = 'linear-gradient(90deg, #ea580c 0%, #ec4899 100%)';
  const orangeColor = '#ea580c';
  const purpleColor = '#9333ea';
  const greenColor = '#10b981';

  // Extract day number from day string (e.g., "Jour 1-2 : Les fondations" -> "1-2")
  const extractDayNumber = (dayText: string) => {
    const match = dayText.match(/Jour\s*(\d+(?:-\d+)?)/i);
    return match ? match[1] : dayText;
  };

  return (
    <section 
      className="relative py-24 md:py-32 px-4 font-inter"
      style={{ 
        backgroundColor: '#fdfbf7',
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

        {/* Two columns - Assistant opérationnel & Partenaire créatif */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {content.weeks.map((week, weekIndex) => {
            const isFirstColumn = weekIndex === 0;
            const accentColor = isFirstColumn ? orangeColor : purpleColor;
            // Use the week title as the main heading
            const columnTitle = week.title;

            return (
              <div 
                key={weekIndex}
                className="p-8 rounded-3xl"
                style={{ 
                  backgroundColor: 'white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                {/* Column title - bold black */}
                <h3 
                  className="text-2xl md:text-3xl font-bold mb-2"
                  style={{ color: '#1a1a1a' }}
                >
                  {columnTitle}
                </h3>

                {/* Subtitle with accent color - same as title */}
                <p 
                  className="text-base font-medium mb-8"
                  style={{ color: accentColor }}
                >
                  {columnTitle}
                </p>

                {/* Days list - just number + description */}
                <div className="space-y-6">
                  {week.days.map((day, dayIndex) => {
                    const dayNumber = extractDayNumber(day.day);
                    return (
                      <div key={dayIndex} className="flex items-start gap-3">
                        <div 
                          className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                          style={{ backgroundColor: accentColor }}
                        />
                        <div>
                          <p 
                            className="font-bold text-base mb-1"
                            style={{ color: '#1a1a1a' }}
                          >
                            {dayNumber}
                          </p>
                          <p 
                            className="text-sm leading-relaxed"
                            style={{ color: '#4b5563' }}
                          >
                            {day.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Deliverables section */}
        <div 
          className="p-10 rounded-3xl mb-12"
          style={{ 
            backgroundColor: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}
        >
          <h3 
            className="text-2xl md:text-3xl font-bold mb-8 text-center"
            style={{ color: '#1a1a1a' }}
          >
            À la fin de ces 14 jours, tu auras :
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {content.deliverables.map((deliverable, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 
                  className="w-6 h-6 flex-shrink-0 mt-0.5" 
                  style={{ color: greenColor }}
                />
                <span 
                  className="text-base md:text-lg"
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
