import { FAQContent } from '@/config/landingPageSchema';
import { useTheme } from '@/theme/ThemeProvider';
import { Minus } from 'lucide-react';
import { useState } from 'react';

interface FAQProps {
  content: FAQContent;
}

// Helper to render answer with bold parts (text between ** **)
function renderAnswer(text: string, textColor: string) {
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
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Parse headline to find gradient word (between ** **)
  const headlineParts = content.headline.split(/(\*\*[^*]+\*\*)/g);

  return (
    <section 
      className="relative py-24 md:py-32 px-4 font-inter"
      style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Headline with gradient word */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-16">
          {headlineParts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <span 
                  key={i}
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
            return <span key={i} style={{ color: '#1e1b4b' }}>{part}</span>;
          })}
        </h2>

        {/* Questions */}
        <div className="space-y-8">
          {content.questions.map((item, index) => (
            <div 
              key={index}
              className="cursor-pointer"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              {/* Question */}
              <div className="flex items-start gap-4 mb-3">
                <Minus 
                  className="w-6 h-6 flex-shrink-0 mt-1"
                  style={{ color: theme.colors.primary }}
                  strokeWidth={3}
                />
                <h3 
                  className="text-xl md:text-2xl font-bold"
                  style={{ color: theme.colors.primary }}
                >
                  {item.question}
                </h3>
              </div>
              
              {/* Answer - always visible in this design */}
              <div 
                className="pl-10 transition-all"
                style={{ color: '#1e1b4b' }}
              >
                <p className="text-base md:text-lg leading-relaxed whitespace-pre-line">
                  {renderAnswer(item.answer, '#1e1b4b')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
