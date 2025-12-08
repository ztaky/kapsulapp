import { InstructorContent } from '@/config/landingPageSchema';
import { Monitor } from 'lucide-react';
import instructorPhoto from '@/assets/instructor-photo.png';

interface InstructorProps {
  content: InstructorContent;
  trainerPhoto?: string;
  primaryColor?: string;
  primaryDarkColor?: string;
}

export function Instructor({ content, trainerPhoto, primaryColor = '#e11d48', primaryDarkColor = '#9333ea' }: InstructorProps) {
  const gradientStyle = `linear-gradient(90deg, ${primaryColor}, ${primaryDarkColor})`;
  
  const credentials = [
    "23 ans d'entrepreneuriat (j'ai vécu tous les hauts et les bas)",
    "DU en Astrophysique (la complexité technique, je connais)",
    "Autrice « Le Leadership Émotionnel » (je comprends les leaders)",
    "Conférencière IA (MEDEF, entreprises, événements)",
    "Fondatrice Harmonia – IA Éthique (lancement 2026)"
  ];

  return (
    <section 
      className="relative py-20 md:py-28 px-4 font-inter"
      style={{ backgroundColor: '#1a1f2e', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Content */}
          <div>
            {/* Title */}
            <h2 
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
              style={{ color: '#ffffff' }}
            >
              Qui suis-je ?
            </h2>
            
            {/* Name with gradient */}
            <h3 
              className="text-2xl md:text-3xl font-bold mb-8"
              style={{ 
                background: gradientStyle,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Zaheda TAKY
            </h3>

            {/* Credentials */}
            <ul className="space-y-3 mb-12">
              {credentials.map((cred, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span 
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span 
                    className="text-base md:text-lg"
                    style={{ color: '#e0e0e0' }}
                  >
                    {cred}
                  </span>
                </li>
              ))}
            </ul>

            {/* Mission */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-4">
                <div 
                  className="w-16 h-16 flex items-center justify-center"
                  style={{ color: primaryColor }}
                >
                  <Monitor className="w-12 h-12" strokeWidth={1.5} />
                </div>
              </div>
              <h4 
                className="text-xl md:text-2xl font-bold mb-4"
                style={{ 
                  background: gradientStyle,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Ma mission
              </h4>
              <p 
                className="text-base md:text-lg leading-relaxed max-w-md mx-auto"
                style={{ color: '#e0e0e0' }}
              >
                Transformer les entrepreneurs débordés en dirigeants décuplés grâce à l'IA.
              </p>
            </div>

            {/* Difference */}
            <div className="text-center">
              <h4 
                className="text-xl md:text-2xl font-bold mb-4"
                style={{ 
                  background: gradientStyle,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Ma différence
              </h4>
              <div 
                className="text-base md:text-lg leading-relaxed max-w-lg mx-auto space-y-1"
                style={{ color: '#e0e0e0' }}
              >
                <p>J'ai vécu ton blocage.</p>
                <p>Je sais exactement comment le briser.</p>
                <p>Ma pédagogie transforme l'IA en assistant personnel, pas en outil compliqué.</p>
              </div>
            </div>
          </div>

          {/* Right - Photo */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <img 
                src={instructorPhoto} 
                alt="Zaheda TAKY"
                className="w-80 md:w-96 h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
