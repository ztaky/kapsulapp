import { FAQContent } from '@/config/landingPageSchema';
import { useTheme } from '@/theme/ThemeProvider';
import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';

interface FAQProps {
  content: FAQContent;
}

// Helper to render answer with bold parts (text between ** **)
function renderAnswer(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function FAQ({ content }: FAQProps) {
  const { theme } = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(null); // Closed by default

  // Parse headline to find gradient word (between ** **)
  const headlineParts = content.headline.split(/(\*\*[^*]+\*\*)/g);

  return (
    <section 
      className="relative py-24 md:py-32 px-4 font-inter"
      style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Headline with gradient word */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal mb-16">
          {headlineParts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <span 
                  key={i}
                  className="font-normal italic"
                  style={{ 
                    background: 'linear-gradient(90deg, #f97316, #ec4899, #8b5cf6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {part.slice(2, -2)}
                </span>
              );
            }
            return <span key={i} style={{ color: '#1e1b4b', fontWeight: 700 }}>{part}</span>;
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
                  className="flex items-start gap-3 w-full text-left"
                >
                  {isOpen ? (
                    <Minus 
                      className="w-5 h-5 flex-shrink-0 mt-1"
                      style={{ color: theme.colors.primary }}
                      strokeWidth={3}
                    />
                  ) : (
                    <Plus 
                      className="w-5 h-5 flex-shrink-0 mt-1"
                      style={{ color: theme.colors.primary }}
                      strokeWidth={3}
                    />
                  )}
                  <h3 
                    className="text-lg md:text-xl font-bold"
                    style={{ color: theme.colors.primary }}
                  >
                    {item.question}
                  </h3>
                </button>
                
                {/* Answer - only visible when open */}
                {isOpen && (
                  <div 
                    className="pl-8 mt-3 animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{ color: '#1e1b4b' }}
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
