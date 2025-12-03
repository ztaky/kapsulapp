import { FAQContent } from '@/config/landingPageSchema';
import { useTheme, getGradientStyle } from '@/theme/ThemeProvider';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FAQProps {
  content: FAQContent;
}

export function FAQ({ content }: FAQProps) {
  const { theme } = useTheme();
  const gradientStyle = getGradientStyle(theme);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section 
      className="relative py-24 md:py-32 px-4 font-inter"
      style={{ backgroundColor: theme.colors.bgLight, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Headline */}
        <h2 
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-16"
          style={{ color: theme.colors.textDark }}
        >
          {content.headline}
        </h2>

        {/* Questions with Answers */}
        <div className="space-y-4 mb-16">
          {content.questions.map((item, index) => (
            <div 
              key={index}
              className="border-2 rounded-2xl overflow-hidden transition-all"
              style={{ 
                borderColor: openIndex === index ? theme.colors.primary : 'rgba(0,0,0,0.1)',
                backgroundColor: openIndex === index ? theme.colors.bgLight : 'white'
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 flex items-center justify-between text-left"
              >
                <span 
                  className="text-lg md:text-xl font-bold pr-4"
                  style={{ color: theme.colors.textDark }}
                >
                  {item.question}
                </span>
                <ChevronDown 
                  className={`w-6 h-6 flex-shrink-0 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                  style={{ color: theme.colors.primary }}
                />
              </button>
              
              {/* Answer */}
              {openIndex === index && (
                <div 
                  className="px-6 pb-6"
                  style={{ color: theme.colors.textDark }}
                >
                  <p className="text-base md:text-lg leading-relaxed opacity-80">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            size="lg"
            className="text-xl px-12 py-8 h-auto shadow-2xl hover:shadow-3xl transition-all rounded-full"
            style={{ 
              background: gradientStyle,
              color: theme.colors.textLight
            }}
          >
            {content.cta}
          </Button>
        </div>
      </div>
    </section>
  );
}
