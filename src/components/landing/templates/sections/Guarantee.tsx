import { GuaranteeContent } from '@/config/landingPageSchema';
import { useTheme } from '@/theme/ThemeProvider';
import { Shield } from 'lucide-react';

interface GuaranteeProps {
  content: GuaranteeContent;
}

export function Guarantee({ content }: GuaranteeProps) {
  const { theme } = useTheme();

  return (
    <section 
      className="relative py-24 md:py-32 px-4"
      style={{ backgroundColor: '#fef8f3' }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <Shield 
          className="w-24 h-24 mx-auto mb-8" 
          style={{ color: theme.colors.accentGreen }}
        />
        <h2 
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8"
          style={{ color: theme.colors.textDark }}
        >
          {content.title}
        </h2>
        <p 
          className="text-xl md:text-2xl mb-8 leading-relaxed"
          style={{ color: theme.colors.textDark }}
        >
          {content.description}
        </p>
        <p 
          className="text-2xl md:text-3xl font-bold"
          style={{ color: theme.colors.primary }}
        >
          {content.riskPhrase}
        </p>
      </div>
    </section>
  );
}
