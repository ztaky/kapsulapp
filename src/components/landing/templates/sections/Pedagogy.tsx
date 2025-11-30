import { PedagogyContent } from '@/config/landingPageSchema';
import { useTheme, getGradientStyle } from '@/theme/ThemeProvider';

interface PedagogyProps {
  content: PedagogyContent;
}

export function Pedagogy({ content }: PedagogyProps) {
  const { theme } = useTheme();
  const gradientStyle = getGradientStyle(theme);

  return (
    <section 
      className="relative py-24 md:py-32 px-4"
      style={{ backgroundColor: 'white' }}
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

        {/* Pillars */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {content.pillars.map((pillar, index) => (
            <div 
              key={index}
              className="p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all"
              style={{ 
                backgroundColor: 'white',
                border: '2px solid rgba(0,0,0,0.05)'
              }}
            >
              <div 
                className="text-4xl font-bold mb-4"
                style={{ 
                  background: gradientStyle,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {pillar.number}
              </div>
              <h3 
                className="text-2xl md:text-3xl font-bold mb-4"
                style={{ color: theme.colors.textDark }}
              >
                {pillar.title}
              </h3>
              <p 
                className="text-lg leading-relaxed mb-4"
                style={{ color: theme.colors.textDark }}
              >
                {pillar.description}
              </p>
              <p 
                className="text-base leading-relaxed"
                style={{ color: theme.colors.textDark, opacity: 0.8 }}
              >
                {pillar.details}
              </p>
            </div>
          ))}
        </div>

        {/* Shock Phrase */}
        <p 
          className="text-2xl md:text-3xl font-bold text-center"
          style={{ color: theme.colors.primary }}
        >
          {content.shockPhrase}
        </p>
      </div>
    </section>
  );
}
