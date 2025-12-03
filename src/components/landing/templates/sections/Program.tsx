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

  // Helper to format day content - extract title and description
  const formatDayContent = (dayText: string, dayContent: string) => {
    // Extract title part (e.g., "Les fondations" from "Jour 1-2 : Les fondations")
    const titleMatch = dayText.match(/Jour \d+(?:-\d+)?\s*:\s*(.+)/i);
    const title = titleMatch ? titleMatch[1] : dayText;
    
    return { title, description: dayContent };
  };

  return (
    <section 
      className="relative py-24 md:py-32 px-4"
      style={{ 
        backgroundColor: '#fdfbf7',
        fontFamily: 'Inter, sans-serif',
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Headline */}
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
            {content.headline.includes('IA Mastery') ? 'IA Mastery' : content.headline}
          </span>
        </h2>

        {/* Subheadline */}
        <p 
          className="text-xl md:text-2xl text-center mb-16 max-w-4xl mx-auto"
          style={{ color: '#4b5563' }}
        >
          {content.subheadline}
        </p>

        {/* Two columns - Semaine 1 & 2 */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {content.weeks.map((week, weekIndex) => {
            const isWeek1 = weekIndex === 0;
            const accentColor = isWeek1 ? orangeColor : purpleColor;
            const weekSubtitle = isWeek1 
              ? "L'IA devient ton assistant opérationnel"
              : "L'IA devient ton partenaire créatif";

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
                {/* Week title */}
                <h3 
                  className="text-2xl md:text-3xl font-bold mb-2"
                  style={{ color: '#1a1a1a' }}
                >
                  {week.title}
                </h3>

                {/* Week subtitle with accent color */}
                <p 
                  className="text-lg font-medium mb-6"
                  style={{ color: accentColor }}
                >
                  {weekSubtitle}
                </p>

                {/* Days list */}
                <div className="space-y-4">
                  {week.days.map((day, dayIndex) => {
                    const { title, description } = formatDayContent(day.day, day.content);
                    return (
                      <div key={dayIndex} className="flex items-start gap-3">
                        <div 
                          className="w-2 h-2 rounded-full mt-2.5 flex-shrink-0"
                          style={{ backgroundColor: accentColor }}
                        />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {day.day}
                          </p>
                          <p className="text-gray-600 text-sm leading-relaxed">
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
