import { FAQContent } from '@/config/landingPageSchema';
import { useTheme } from '@/theme/ThemeProvider';
import { useState } from 'react';

interface FAQProps {
  content: FAQContent;
}

// Helper to render answer with bold parts (text between ** **)
function renderAnswer(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function FAQ({ content }: FAQProps) {
  const { theme } = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Parse headline to find gradient word (between ** **)
  const headlineParts = content.headline.split(/(\*\*[^*]+\*\*)/g);

  const openColor = '#ea580c'; // Orange vif

  return (
    <section 
      className="relative py-20 md:py-28 px-4"
      style={{ backgroundColor: '#ffffff' }}
    >
      <div className="max-w-4xl mx-auto px-4 md:px-16">
        {/* Headline with gradient word - Inter font */}
        <h2 
          className="text-3xl md:text-4xl lg:text-5xl mb-12 md:mb-16"
          style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
        >
          {headlineParts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <span 
                  key={i}
                  className="italic"
                  style={{ 
                    background: 'linear-gradient(90deg, #f97316, #db2777, #7c3aed)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 400
                  }}
                >
                  {part.slice(2, -2)}
                </span>
              );
            }
            return <span key={i} style={{ color: '#1e1b4b', fontWeight: 400 }}>{part}</span>;
          })}
        </h2>

        {/* Questions - accordion */}
        <div 
          className="space-y-8"
          style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
        >
          {content.questions.map((item, index) => {
            const isOpen = openIndex === index;
            const textColor = isOpen ? openColor : '#1f2937';
            const iconColor = isOpen ? openColor : '#1f2937';
            
            return (
              <div key={index}>
                {/* Question - clickable */}
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex items-center gap-4 w-full text-left"
                >
                  {/* Plus/Minus icon as text */}
                  <span 
                    className="text-xl font-bold flex-shrink-0"
                    style={{ color: iconColor }}
                  >
                    {isOpen ? '—' : '+'}
                  </span>
                  <span 
                    className="text-lg md:text-xl font-bold"
                    style={{ color: textColor }}
                  >
                    {item.question}
                  </span>
                </button>
                
                {/* Answer - only visible when open */}
                {isOpen && (
                  <div 
                    className="pl-9 mt-4"
                    style={{ color: '#1f2937' }}
                  >
                    <p className="text-base leading-relaxed whitespace-pre-line">
                      {renderAnswer(item.answer)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
