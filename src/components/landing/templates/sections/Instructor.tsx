import { InstructorContent } from '@/config/landingPageSchema';
import { useTheme } from '@/theme/ThemeProvider';
import { CheckCircle2 } from 'lucide-react';

interface InstructorProps {
  content: InstructorContent;
}

export function Instructor({ content }: InstructorProps) {
  const { theme } = useTheme();

  return (
    <section 
      className="relative py-24 md:py-32 px-4"
      style={{ backgroundColor: theme.colors.bgDark }}
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
          {content.photo && (
            <div className="flex justify-center">
              <div 
                className="w-64 h-64 rounded-3xl overflow-hidden shadow-2xl"
                style={{ 
                  border: `4px solid ${theme.colors.primary}`
                }}
              >
                <img 
                  src={content.photo} 
                  alt={content.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

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
