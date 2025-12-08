import { BonusContent } from '@/config/landingPageSchema';

interface BonusProps {
  content?: BonusContent;
  primaryColor?: string;
  primaryDarkColor?: string;
}

// Hardcoded bonus data matching the design
const bonusItems = [
  {
    title: "Bibliothèque de Prompts Privée",
    value: "297€",
    description: "Collection complète de prompts prêts à l'emploi pour tous tes besoins business.",
    contentLabel: "Contenu :",
    contentList: [
      "50+ prompts optimisés par catégorie",
      "Templates Master Prompt personnalisables",
      "Prompts avancés pour cas d'usage spécifiques",
      "Mises à jour mensuelles avec nouveaux prompts"
    ]
  },
  {
    title: "Master Prompt - Intégration des Process",
    value: "297€",
    description: "Masterclass exclusive :\nComment intégrer tes processus et workflows dans ton Master Prompt.",
    contentLabel: "Durée :",
    contentText: "60 minutes de formation avancée."
  },
  {
    title: "Introduction aux Agents IA",
    value: "197€",
    description: "Masterclass d'introduction au monde des agents IA autonomes.",
    contentLabel: "Ce que tu découvres :",
    contentList: [
      "Qu'est-ce qu'un agent IA et comment ça fonctionne",
      "Les différences entre IA conversationnelle et agents",
      "5 cas d'usage d'agents pour ton business"
    ]
  },
  {
    title: "Base de données Outils IA + Tuto",
    value: "297€",
    description: "Base de données Notion avec TOUS les outils IA essentiels + tutoriels + offres exclusives.",
    contentLabel: "Contenu :",
    contentList: [
      "50+ outils IA catégorisés (création, analyse, automation, etc.)",
      "Tutoriel vidéo pour chaque outil",
      "Comparatifs gratuit vs payant",
      "Offres exclusives et codes promo (affiliation)",
      "Mise à jour régulière avec nouveaux outils"
    ]
  }
];

export function Bonus({ content, primaryColor = '#ec4899', primaryDarkColor = '#9333ea' }: BonusProps) {
  const accentGradient = `linear-gradient(90deg, ${primaryColor}, ${primaryDarkColor})`;
  const buttonGradient = `linear-gradient(90deg, ${primaryColor}, ${primaryDarkColor})`;

  return (
    <section 
      className="relative py-20 md:py-28 px-4 font-inter"
      style={{ 
        backgroundColor: '#f5f5f0',
        backgroundImage: `
          linear-gradient(rgba(200, 200, 200, 0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(200, 200, 200, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Headline */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4">
          <span style={{ color: '#1e1b4b' }}>4 </span>
          <span 
            style={{
              background: accentGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Bonus exclusifs
          </span>
          <span style={{ color: '#1e1b4b' }}> offerts</span>
        </h2>

        {/* Subheadline */}
        <p 
          className="text-lg md:text-xl text-center mb-12 md:mb-16 font-medium"
          style={{ color: '#4a4a4a' }}
        >
          pour maximiser tes résultats
        </p>

        {/* Bonus Grid */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-16">
          {bonusItems.map((item, index) => (
            <div 
              key={index}
              className="p-6 md:p-8 rounded-2xl shadow-lg relative bg-white/90"
              style={{ 
                backgroundColor: '#faf8f5',
                border: '1px solid rgba(200, 200, 200, 0.3)'
              }}
            >
              {/* Numbered badge */}
              <div className="flex justify-center mb-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryDarkColor}, ${primaryColor})`
                  }}
                >
                  <span className="text-white font-bold text-lg">
                    {index + 1}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h3 
                className="text-lg md:text-xl font-bold mb-2 text-center"
                style={{ 
                  background: accentGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {item.title}
              </h3>

              {/* Value */}
              <p 
                className="text-sm font-bold mb-4 text-center"
                style={{ color: '#1e1b4b' }}
              >
                Valeur : {item.value}
              </p>

              {/* Description */}
              <p 
                className="text-sm text-center mb-4 whitespace-pre-line"
                style={{ color: '#4a4a4a' }}
              >
                {item.description}
              </p>

              {/* Content label & list */}
              {item.contentLabel && (
                <div className="text-center">
                  <p 
                    className="text-sm font-bold mb-2"
                    style={{ color: '#1e1b4b' }}
                  >
                    {item.contentLabel}
                  </p>
                  {item.contentList && (
                    <div className="text-sm" style={{ color: '#4a4a4a' }}>
                      {item.contentList.map((line, i) => (
                        <p key={i} className="leading-relaxed">{line}</p>
                      ))}
                    </div>
                  )}
                  {item.contentText && (
                    <p className="text-sm" style={{ color: '#4a4a4a' }}>
                      {item.contentText}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center">
          <a
            href="#pricing"
            className="inline-block px-8 py-4 rounded-xl text-white font-bold text-lg md:text-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              background: buttonGradient,
              boxShadow: `0 10px 40px ${primaryColor}4D`
            }}
          >
            J'accède à la formation + 4 bonus
          </a>
          <p 
            className="mt-4 text-sm"
            style={{ color: '#6b7280' }}
          >
            Accès immédiat · Paiement sécurisé
          </p>
        </div>
      </div>
    </section>
  );
}
