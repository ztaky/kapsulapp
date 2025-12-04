import { FAQFinalContent } from '@/config/landingPageSchema';
import { MessageCircleQuestion } from 'lucide-react';

interface FAQFinalProps {
  content: FAQFinalContent;
}

export function FAQFinal({ content }: FAQFinalProps) {
  return (
    <section 
      className="relative py-20 md:py-28 px-4 font-inter"
      style={{ 
        backgroundColor: '#f3f4f6', 
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' 
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Titre */}
        <h2 
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-12"
          style={{ color: '#1e1b4b' }}
        >
          Questions fréquentes
        </h2>

        {/* Grid de questions */}
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-10">
          {content.questions.map((item, index) => (
            <div 
              key={index}
              className="flex gap-4"
            >
              {/* Icône bulle */}
              <div className="flex-shrink-0 pt-1">
                <MessageCircleQuestion 
                  className="w-10 h-10" 
                  style={{ color: '#9ca3af' }}
                  strokeWidth={1.5}
                />
              </div>

              {/* Ligne verticale orange */}
              <div 
                className="w-1 flex-shrink-0 rounded-full"
                style={{ backgroundColor: '#f59e0b' }}
              />

              {/* Contenu */}
              <div className="flex-1">
                <h3 
                  className="text-lg font-semibold mb-2"
                  style={{ color: '#d97706' }}
                >
                  {item.question}
                </h3>
                <p 
                  className="text-base leading-relaxed"
                  style={{ color: '#4b5563' }}
                >
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
