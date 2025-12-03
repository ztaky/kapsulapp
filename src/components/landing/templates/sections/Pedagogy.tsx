import { PedagogyContent } from '@/config/landingPageSchema';
import { useTheme } from '@/theme/ThemeProvider';

interface PedagogyProps {
  content: PedagogyContent;
}

// Gradients harmonisés
const headlineGradient = 'linear-gradient(90deg, #ea580c 0%, #9333ea 100%)';
const titleGradient = 'linear-gradient(90deg, #dc2626 0%, #ea580c 100%)';
const badgeGradient = 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)';
const accentColor = '#ea580c';
const cardBgColor = '#fef3e2';

export function Pedagogy({ content }: PedagogyProps) {
  const { theme } = useTheme();

  // Parse headline to extract highlighted part
  const renderHeadline = () => {
    if (content.highlightedHeadline) {
      return (
        <>
          <span style={{ color: theme.colors.textDark }}>{content.headline} </span>
          <span 
            style={{ 
              background: headlineGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {content.highlightedHeadline}
          </span>
        </>
      );
    }
    return <span style={{ color: theme.colors.textDark }}>{content.headline}</span>;
  };

  // Parse subheadline to highlight "3 piliers"
  const renderSubheadline = () => {
    const text = content.subheadline;
    const pilierMatch = text.match(/(3 piliers?)/i);
    
    if (pilierMatch) {
      const parts = text.split(pilierMatch[0]);
      return (
        <>
          {parts[0]}
          <span style={{ color: accentColor, fontWeight: 700 }}>{pilierMatch[0]}</span>
          {parts[1]}
        </>
      );
    }
    return text;
  };

  return (
    <section 
      className="relative py-24 md:py-32 px-4"
      style={{ backgroundColor: 'white' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Headline */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6">
          {renderHeadline()}
        </h2>

        {/* Subheadline */}
        <p 
          className="text-xl md:text-2xl text-center mb-4 max-w-4xl mx-auto"
          style={{ color: theme.colors.textDark }}
        >
          {renderSubheadline()}
        </p>

        {/* Subheadline2 */}
        {content.subheadline2 && (
          <p 
            className="text-xl md:text-2xl font-bold text-center mb-16 max-w-4xl mx-auto"
            style={{ color: theme.colors.textDark }}
          >
            {content.subheadline2}
          </p>
        )}

        {/* Pillars */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {content.pillars.map((pillar, index) => (
            <div 
              key={index}
              className="p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all"
              style={{ 
                backgroundColor: cardBgColor,
                border: '2px solid rgba(0,0,0,0.05)'
              }}
            >
              {/* Number Badge - Pill shape */}
              <div 
                className="inline-flex items-center justify-center w-14 h-14 rounded-full text-white text-2xl font-bold mb-6"
                style={{ 
                  background: badgeGradient,
                  boxShadow: '0 4px 15px rgba(147, 51, 234, 0.3)'
                }}
              >
                {pillar.number}
              </div>

              {/* Title with red-orange gradient */}
              <h3 
                className="text-2xl md:text-3xl font-bold mb-4"
                style={{ 
                  background: titleGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {pillar.title}
              </h3>

              {/* Description */}
              <p 
                className="text-lg leading-relaxed mb-4"
                style={{ color: theme.colors.textDark }}
              >
                {pillar.description}
              </p>

              {/* Details */}
              <p 
                className="text-base leading-relaxed mb-4"
                style={{ color: theme.colors.textDark, opacity: 0.85 }}
              >
                {pillar.details}
              </p>

              {/* Testimonial - Red accent */}
              {pillar.testimonial && (
                <p 
                  className="text-base leading-relaxed font-semibold italic"
                  style={{ color: accentColor }}
                >
                  {pillar.testimonial}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Shock Phrase */}
        {content.shockPhrase && (
          <p 
            className="text-2xl md:text-3xl font-bold text-center"
            style={{ color: accentColor }}
          >
            {content.shockPhrase}
          </p>
        )}
      </div>
    </section>
  );
}
