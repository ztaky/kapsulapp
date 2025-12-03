import { TestimonialsContent } from '@/config/landingPageSchema';
import { useTheme, getGradientStyle } from '@/theme/ThemeProvider';
import { Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Support both new format (author object) and legacy format (flat structure)
interface LegacyTestimonial {
  avatar?: string;
  name?: string;
  role?: string;
  text?: string;
  rating?: number;
}

interface TestimonialsProps {
  content: TestimonialsContent | LegacyTestimonial[];
}

export function Testimonials({ content }: TestimonialsProps) {
  const { theme } = useTheme();
  const gradientStyle = getGradientStyle(theme);

  // Detect format: array = legacy format, object with items = new format
  const isLegacyFormat = Array.isArray(content);
  
  const testimonials = isLegacyFormat 
    ? (content as LegacyTestimonial[]).map(t => ({
        quote: t.text || '',
        author: {
          name: t.name || '',
          role: t.role || '',
          photo: t.avatar || ''
        },
        rating: t.rating || 5
      }))
    : (content as TestimonialsContent).items?.map(item => ({
        ...item,
        rating: 5
      })) || [];

  const headline = isLegacyFormat ? 'Ce que disent nos clients' : (content as TestimonialsContent).headline;
  const headerStars = isLegacyFormat ? 5 : (content as TestimonialsContent).stars;
  const cta = isLegacyFormat ? 'Rejoignez-les' : (content as TestimonialsContent).cta;

  return (
    <section 
      className="relative py-24 md:py-32 px-4 font-inter"
      style={{ backgroundColor: theme.colors.bgDark, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Stars + Headline */}
        <div className="text-center mb-16">
          <div className="flex justify-center gap-1 mb-6">
            {Array.from({ length: headerStars }).map((_, i) => (
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
            {headline}
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((item, index) => (
            <div 
              key={index}
              className="p-8 rounded-3xl shadow-2xl"
              style={{ backgroundColor: 'white' }}
            >
              <div className="flex justify-center gap-1 mb-4">
                {Array.from({ length: item.rating || 5 }).map((_, i) => (
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
                {item.author.photo ? (
                  <img 
                    src={item.author.photo} 
                    alt={item.author.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: theme.colors.bgLight }}
                  >
                    <User className="w-5 h-5" style={{ color: theme.colors.primary, opacity: 0.5 }} />
                  </div>
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
        {cta && (
          <div className="text-center">
            <Button 
              size="lg"
              className="text-xl px-12 py-8 h-auto gradient-button shadow-2xl hover:shadow-3xl transition-all rounded-full"
              style={{ 
                background: gradientStyle,
                color: theme.colors.textLight
              }}
            >
              {cta}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
