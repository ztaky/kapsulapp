import { GuaranteeContent } from '@/config/landingPageSchema';
import { Shield } from 'lucide-react';

interface GuaranteeProps {
  content: GuaranteeContent;
}

export function Guarantee({ content }: GuaranteeProps) {
  return (
    <section 
      className="relative py-20 md:py-28 px-4 font-inter"
      style={{ backgroundColor: '#fef8f3', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      <div className="max-w-3xl mx-auto text-center">
        {/* Icône bouclier avec dégradé */}
        <div 
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #9333ea, #e11d48)' }}
        >
          <Shield 
            className="w-10 h-10 text-white" 
            strokeWidth={1.5}
          />
        </div>
        
        {/* Titre avec dégradé partiel */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
          <span style={{ color: '#1e1b4b' }}>Ta Garantie </span>
          <span 
            style={{ 
              background: 'linear-gradient(90deg, #e11d48, #9333ea)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Sans Risque
          </span>
        </h2>
        
        <p 
          className="text-lg md:text-xl mb-6 leading-relaxed max-w-2xl mx-auto"
          style={{ color: '#1e1b4b' }}
        >
          Lance-toi sans hésiter, je te soutiens. Si IA Mastery ne comble pas tes attentes, dis-le moi. Tu as 30 jours pour changer d'avis, et je te rembourse intégralement, sans aucune question.
        </p>
        
        {/* Phrase d'accroche avec dégradé complet */}
        <p 
          className="text-xl md:text-2xl font-semibold"
          style={{ 
            background: 'linear-gradient(90deg, #e11d48, #9333ea)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Le seul risque : passer à côté.
        </p>
      </div>
    </section>
  );
}
