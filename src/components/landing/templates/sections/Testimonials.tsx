import { TestimonialsContent } from '@/config/landingPageSchema';
import { Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Support both new format (author object) and legacy format (flat structure)
interface LegacyTestimonial {
  avatar?: string;
  name?: string;
  role?: string;
  text?: string;
  rating?: number;
  tag?: string;
}

interface TestimonialsProps {
  content: TestimonialsContent | LegacyTestimonial[];
  primaryColor?: string;
  primaryDarkColor?: string;
}

export function Testimonials({ content, primaryColor = '#e11d48', primaryDarkColor = '#9333ea' }: TestimonialsProps) {
  const gradientStyle = `linear-gradient(90deg, ${primaryColor} 0%, ${primaryDarkColor} 100%)`;
  const goldColor = '#d4a853';
  const darkBg = '#1a1a1a';

  const handleScrollToPricing = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Detect format: array = legacy format, object with items = new format
  const isLegacyFormat = Array.isArray(content);
  
  const testimonials = isLegacyFormat 
    ? (content as LegacyTestimonial[]).map(t => ({
        quote: t.text || '',
        tag: t.tag || '',
        author: {
          name: t.name || '',
          role: t.role || '',
          photo: t.avatar || ''
        },
        rating: t.rating || 5
      }))
    : (content as TestimonialsContent).items?.map(item => ({
        ...item,
        tag: (item as any).tag || '',
        rating: 5
      })) || [];

  const headline = isLegacyFormat ? "Ils ont transformé leur business" : (content as TestimonialsContent).headline;
  const headerStars = isLegacyFormat ? 5 : (content as TestimonialsContent).stars;
  const cta = isLegacyFormat ? "Je rejoins les entrepreneurs qui ont changer leur quotidien avec l'IA" : (content as TestimonialsContent).cta;

  return (
    <section 
      className="relative py-24 md:py-32 px-4 font-inter"
      style={{ 
        backgroundColor: darkBg, 
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' 
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Headline + Stars */}
        <div className="text-center mb-16">
          <h2 
            className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 whitespace-pre-line"
            style={{ color: '#ffffff' }}
          >
            {headline}
          </h2>
          <div className="flex justify-center gap-2">
            {Array.from({ length: headerStars }).map((_, i) => (
              <Star 
                key={i} 
                className="w-6 h-6 fill-current" 
                style={{ color: goldColor }}
              />
            ))}
          </div>
        </div>

        {/* Testimonials Grid - Speech Bubbles */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 mb-20">
          {testimonials.map((item, index) => (
            <div key={index} className="flex flex-col items-center">
              {/* Speech Bubble Card */}
              <div className="relative w-full">
                <div 
                  className="p-8 rounded-2xl text-center"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <p 
                    className="text-base leading-relaxed mb-4"
                    style={{ color: '#1a1a1a' }}
                  >
                    "{item.quote}"
                  </p>
                  {item.tag && (
                    <p 
                      className="text-sm font-medium"
                      style={{ color: '#4b5563' }}
                    >
                      {item.tag}
                    </p>
                  )}
                </div>
                {/* Speech bubble pointer */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-0 h-0"
                  style={{
                    borderLeft: '12px solid transparent',
                    borderRight: '12px solid transparent',
                    borderTop: '12px solid #ffffff'
                  }}
                />
              </div>

              {/* Author info below bubble */}
              <div className="flex flex-col items-center mt-8">
                {item.author.photo ? (
                  <img 
                    src={item.author.photo} 
                    alt={item.author.name}
                    className="w-16 h-16 rounded-full object-cover mb-3 border-2"
                    style={{ borderColor: '#374151' }}
                  />
                ) : (
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                    style={{ backgroundColor: '#374151' }}
                  >
                    <User className="w-8 h-8" style={{ color: '#9ca3af' }} />
                  </div>
                )}
                <p 
                  className="text-lg font-semibold"
                  style={{ color: goldColor }}
                >
                  {item.author.name}
                </p>
                {item.author.role && (
                  <p 
                    className="text-sm text-center max-w-[200px]"
                    style={{ color: '#9ca3af' }}
                  >
                    {item.author.role}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        {cta && (
          <div className="text-center">
            <Button
              size="lg"
              onClick={handleScrollToPricing}
              className="text-lg md:text-xl px-10 py-6 h-auto rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] text-white font-semibold"
              style={{ 
                background: gradientStyle,
                boxShadow: `0 10px 30px ${primaryColor}4D`
              }}
            >
              {cta}
            </Button>
            <p 
              className="mt-4 text-sm"
              style={{ color: '#9ca3af' }}
            >
              Accès immédiat • Paiement sécurisé
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
