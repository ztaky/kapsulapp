import { FAQContent } from '@/config/landingPageSchema';
import { useTheme } from '@/theme/ThemeProvider';
import { Minus } from 'lucide-react';
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

  return (
    <section 
      className="relative py-20 md:py-28 px-4"
      style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Headline with gradient word */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl mb-12 md:mb-16">
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
        <div className="space-y-6">
          {content.questions.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index}>
                {/* Question - clickable */}
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex items-start gap-4 w-full text-left group"
                >
                  <Minus 
                    className="w-4 h-4 flex-shrink-0 mt-1.5"
                    style={{ color: theme.colors.primary }}
                    strokeWidth={3}
                  />
                  <h3 
                    className="text-base md:text-lg font-semibold"
                    style={{ color: theme.colors.primary }}
                  >
                    {item.question}
                  </h3>
                </button>
                
                {/* Answer - only visible when open */}
                {isOpen && (
                  <div 
                    className="pl-8 mt-3"
                    style={{ color: '#1e1b4b' }}
                  >
                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-line">
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
