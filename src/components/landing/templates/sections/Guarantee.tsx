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
      className="relative py-20 md:py-28 px-4 font-inter"
      style={{ backgroundColor: '#fef8f3', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <Shield 
          className="w-16 h-16 mx-auto mb-6" 
          strokeWidth={1.5}
          style={{ color: theme.colors.accentGreen }}
        />
        <h2 
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
          style={{ color: theme.colors.textDark }}
        >
          Ta Garantie Sans Risque
        </h2>
        <p 
          className="text-lg md:text-xl mb-6 leading-relaxed max-w-2xl mx-auto"
          style={{ color: theme.colors.textDark }}
        >
          Lance-toi sans hésiter, je te soutiens. Si IA Mastery ne comble pas tes attentes, dis-le moi. Tu as 30 jours pour changer d'avis, et je te rembourse intégralement, sans aucune question.
        </p>
        <p 
          className="text-xl md:text-2xl font-semibold"
          style={{ color: theme.colors.primary }}
        >
          Le seul risque : passer à côté.
        </p>
      </div>
    </section>
  );
}
