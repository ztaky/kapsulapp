import { TestimonialsContent } from '@/config/landingPageSchema';
import { useTheme, getGradientStyle } from '@/theme/ThemeProvider';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TestimonialsProps {
  content: TestimonialsContent;
}

export function Testimonials({ content }: TestimonialsProps) {
  const { theme } = useTheme();
  const gradientStyle = getGradientStyle(theme);

  return (
    <section 
      className="relative py-24 md:py-32 px-4"
      style={{ backgroundColor: theme.colors.bgDark }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Stars + Headline */}
        <div className="text-center mb-16">
          <div className="flex justify-center gap-1 mb-6">
            {Array.from({ length: content.stars }).map((_, i) => (
              <Star 
                key={i} 
                className="w-8 h-8 fill-current" 
                style={{ color: '#fbbf24' }}
              />
            ))}
          </div>
          <h2 
            className="text-4xl md:text-5xl lg:text-6xl font-bold"
            style={{ color: theme.colors.textLight }}
          >
            {content.headline}
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {content.items.map((item, index) => (
            <div 
              key={index}
              className="p-8 rounded-3xl shadow-2xl"
              style={{ backgroundColor: 'white' }}
            >
              <div className="flex justify-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className="w-5 h-5 fill-current" 
                    style={{ color: '#fbbf24' }}
                  />
                ))}
              </div>
              <p 
                className="text-base md:text-lg italic mb-6 leading-relaxed"
                style={{ color: theme.colors.textDark }}
              >
                "{item.quote}"
              </p>
              <div className="flex items-center gap-3">
                {item.author.photo && (
                  <img 
                    src={item.author.photo} 
                    alt={item.author.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <p 
                    className="text-sm font-semibold"
                    style={{ color: theme.colors.primary }}
                  >
                    {item.author.name}
                  </p>
                  {item.author.role && (
                    <p 
                      className="text-xs"
                      style={{ color: theme.colors.textDark, opacity: 0.7 }}
                    >
                      {item.author.role}
                    </p>
                  )}
                </div>
              </div>
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
