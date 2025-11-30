import { FAQFinalContent } from '@/config/landingPageSchema';
import { useTheme } from '@/theme/ThemeProvider';
import { HelpCircle } from 'lucide-react';

interface FAQFinalProps {
  content: FAQFinalContent;
}

export function FAQFinal({ content }: FAQFinalProps) {
  const { theme } = useTheme();

  return (
    <section 
      className="relative py-24 md:py-32 px-4"
      style={{ backgroundColor: '#fef8f3' }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {content.questions.map((item, index) => (
            <div 
              key={index}
              className="p-8 rounded-3xl shadow-lg"
              style={{ backgroundColor: 'white' }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  <HelpCircle 
                    className="w-6 h-6" 
                    style={{ color: theme.colors.textLight }}
                  />
                </div>
                <h3 
                  className="text-xl md:text-2xl font-bold"
                  style={{ color: theme.colors.textDark }}
                >
                  {item.question}
                </h3>
              </div>
              <p 
                className="text-base md:text-lg leading-relaxed"
                style={{ color: theme.colors.textDark }}
              >
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
