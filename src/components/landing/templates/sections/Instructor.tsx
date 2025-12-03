import { InstructorContent } from '@/config/landingPageSchema';
import { useTheme } from '@/theme/ThemeProvider';
import { CheckCircle2, User } from 'lucide-react';

interface InstructorProps {
  content: InstructorContent;
  trainerPhoto?: string; // Photo from trainerInfo for backward compatibility
}

export function Instructor({ content, trainerPhoto }: InstructorProps) {
  const { theme } = useTheme();
  
  // Use photo from content first, then fallback to trainerPhoto prop
  const photoUrl = content.photo || trainerPhoto;
  const hasPhoto = photoUrl && photoUrl.trim() !== '';

  return (
    <section 
      className="relative py-24 md:py-32 px-4 font-inter"
      style={{ backgroundColor: theme.colors.bgDark, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Headline */}
        <h2 
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-16"
          style={{ color: theme.colors.textLight }}
        >
          {content.headline}
        </h2>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Photo */}
          <div className="flex justify-center">
            <div 
              className="w-64 h-64 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center"
              style={{ 
                border: `4px solid ${theme.colors.primary}`,
                backgroundColor: hasPhoto ? 'transparent' : theme.colors.bgLight
              }}
            >
              {hasPhoto ? (
                <img 
                  src={photoUrl} 
                  alt={content.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User 
                  className="w-24 h-24"
                  style={{ color: theme.colors.primary, opacity: 0.5 }}
                />
              )}
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 
              className="text-3xl md:text-4xl font-bold mb-8"
              style={{ color: theme.colors.textLight }}
            >
              {content.name}
            </h3>

            {/* Credentials */}
            <ul className="space-y-4 mb-8">
              {content.credentials.map((cred, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 
                    className="w-6 h-6 flex-shrink-0 mt-1" 
                    style={{ color: theme.colors.accentGreen }}
                  />
                  <span 
                    className="text-lg"
                    style={{ color: theme.colors.textLight }}
                  >
                    {cred}
                  </span>
                </li>
              ))}
            </ul>

            {/* Mission */}
            <div className="mb-8">
              <h4 
                className="text-2xl font-bold mb-4"
                style={{ color: theme.colors.primary }}
              >
                Ma mission :
              </h4>
              <p 
                className="text-lg leading-relaxed"
                style={{ color: theme.colors.textLight }}
              >
                {content.mission}
              </p>
            </div>

            {/* Difference */}
            <div>
              <h4 
                className="text-2xl font-bold mb-4"
                style={{ color: theme.colors.primary }}
              >
                Ma différence :
              </h4>
              <p 
                className="text-lg leading-relaxed"
                style={{ color: theme.colors.textLight }}
              >
                {content.difference}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
