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
      className="relative py-24 md:py-32 px-4"
      style={{ backgroundColor: 'white' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Headline */}
        <h2 
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-16"
          style={{ color: theme.colors.textDark }}
        >
          {content.headline}
        </h2>

        {/* Questions - FAQ simple (string[]) */}
        <div className="space-y-4 mb-16">
          {content.questions.map((question, index) => (
            <div 
              key={index}
              className="border-2 rounded-2xl overflow-hidden transition-all"
              style={{ 
                borderColor: openIndex === index ? theme.colors.primary : 'rgba(0,0,0,0.1)',
                backgroundColor: openIndex === index ? '#fef8f3' : 'white'
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
                  {question}
                </span>
                <ChevronDown 
                  className={`w-6 h-6 flex-shrink-0 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                  style={{ color: theme.colors.primary }}
                />
              </button>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            size="lg"
            className="text-xl px-12 py-8 h-auto gradient-button shadow-2xl hover:shadow-3xl transition-all rounded-full"
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
