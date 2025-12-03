import { FAQContent } from '@/config/landingPageSchema';
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Parse headline to find gradient word (between ** **)
  const headlineParts = content.headline.split(/(\*\*[^*]+\*\*)/g);

  const closedColor = '#2d3748';
  const openColor = '#ea580c';

  return (
    <section 
      className="relative py-20 md:py-28 px-4 font-inter"
      style={{ 
        backgroundColor: '#ffffff',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}
    >
      <div className="max-w-5xl mx-auto px-6 md:px-20">
        {/* Headline - left aligned, bold */}
        <h2 className="text-2xl md:text-3xl lg:text-4xl mb-12 md:mb-16 text-left font-bold">
          {headlineParts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <span 
                  key={i}
                  style={{
                    background: 'linear-gradient(90deg, #f97316, #db2777, #7c3aed)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 700
                  }}
                >
                  {part.slice(2, -2)}
                </span>
              );
            }
            return <span key={i} style={{ color: '#1e1b4b', fontWeight: 400 }}>{part}</span>;
          })}
        </h2>

        {/* Questions - accordion with more spacing */}
        <div className="space-y-10">
          {content.questions.map((item, index) => {
            const isOpen = openIndex === index;
            const currentColor = isOpen ? openColor : closedColor;
            
            return (
              <div key={index}>
                {/* Question - clickable */}
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex items-center gap-4 w-full text-left"
                >
                  {/* Plus/Minus icon */}
                  <span 
                    className="text-xl flex-shrink-0 font-bold"
                    style={{ color: currentColor }}
                  >
                    {isOpen ? '—' : '+'}
                  </span>
                  <span 
                    className="text-base md:text-lg font-bold"
                    style={{ color: currentColor, fontWeight: 700 }}
                  >
                    {item.question}
                  </span>
                </button>
                
                {/* Answer - only visible when open */}
                {isOpen && (
                  <div 
                    className="pl-10 mt-3"
                    style={{ color: closedColor }}
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
