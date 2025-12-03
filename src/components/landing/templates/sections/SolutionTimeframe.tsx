import { SolutionTimeframeContent } from '@/config/landingPageSchema';
import { CheckCircle } from 'lucide-react';

interface SolutionTimeframeProps {
  content: SolutionTimeframeContent;
}

export function SolutionTimeframe({ content }: SolutionTimeframeProps) {
  const gradientStyle = 'linear-gradient(90deg, #ea580c 0%, #9333ea 100%)';
  const bgColor = '#1a1a2e';
  const cardBgColor = '#fef3e2';

  // Helper to render text with bold part
  const renderBenefitText = (text: string, boldPart: string) => {
    if (!boldPart) return text;
    const parts = text.split(boldPart);
    if (parts.length === 1) return text;
    return (
      <>
        {parts[0]}<span className="font-bold text-white">{boldPart}</span>{parts[1]}
      </>
    );
  };

  // Check if we have new format data
  const hasNewFormat = content.headline && typeof content.headline === 'object' && 'gradient' in content.headline;

  // Legacy fallback for old data format
  if (!hasNewFormat) {
    const legacyHeadline = typeof content.headline === 'string' ? content.headline : '';
    return (
      <section 
        className="relative py-24 md:py-32 px-4"
        style={{ backgroundColor: '#fef8f3' }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <h2 
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            style={{ color: '#1a1a1a' }}
          >
            {legacyHeadline}
          </h2>
          {content.stats && content.stats.length > 0 && (
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 justify-center items-center mb-8 mt-20">
              {content.stats.slice(0, 3).map((stat, index) => (
                <div key={index} className="text-center">
                  <div 
                    className="text-3xl md:text-4xl font-bold mb-2"
                    style={{ 
                      background: gradientStyle,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-lg md:text-xl" style={{ color: '#1a1a1a' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section 
      className="relative py-24 md:py-32 px-4"
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Headline with gradient part */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6">
          <span className="text-white">{content.headline.before} </span>
          <span 
            style={{ 
              background: gradientStyle,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {content.headline.gradient}
          </span>
          <span className="text-white"> {content.headline.after}</span>
        </h2>

        {/* Subheadline - bold white */}
        <h3 className="text-xl md:text-2xl font-bold text-white text-center mb-6">
          {content.subheadline}
        </h3>

        {/* Description - gray */}
        <p className="text-lg text-gray-300 text-center max-w-4xl mx-auto mb-8">
          {content.description}
        </p>

        {/* Orange separator line */}
        <div 
          className="w-48 h-1 mx-auto mb-16 rounded-full"
          style={{ backgroundColor: '#ea580c' }}
        />

        {/* Two cards side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {content.cards && content.cards.map((card, index) => (
            <div 
              key={index}
              className="p-8 rounded-2xl"
              style={{ backgroundColor: cardBgColor }}
            >
              {/* Card title - colored uppercase */}
              <h4 
                className="text-lg font-bold uppercase tracking-wider mb-2"
                style={{ color: card.color }}
              >
                {card.title}
              </h4>

              {/* Subtitle */}
              <p className="text-gray-700 mb-4">
                {card.subtitle}
              </p>

              {/* Colored separator line */}
              <div 
                className="w-48 h-0.5 mb-6"
                style={{ backgroundColor: card.color }}
              />

              {/* Items list */}
              <ul className="space-y-3">
                {card.items.map((item, itemIndex) => (
                  <li 
                    key={itemIndex}
                    className="text-gray-800 flex items-center gap-2"
                  >
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: card.color }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Benefits with green checkmarks */}
        <div className="max-w-3xl mx-auto space-y-4">
          {content.benefits && content.benefits.map((benefit, index) => (
            <div 
              key={index}
              className="flex items-start gap-4"
            >
              <CheckCircle 
                className="w-6 h-6 flex-shrink-0 mt-0.5"
                style={{ color: '#10b981' }}
              />
              <p className="text-gray-300 text-lg">
                {renderBenefitText(benefit.text, benefit.boldPart)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
