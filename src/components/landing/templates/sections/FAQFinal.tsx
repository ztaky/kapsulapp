import { FAQFinalContent } from '@/config/landingPageSchema';
import { MessagesSquare } from 'lucide-react';

interface FAQFinalProps {
  content: FAQFinalContent;
}

// Questions par défaut si aucune n'est fournie
const defaultQuestions = [
  {
    question: "Le paiement en 3 fois est-il vraiment sans frais ?",
    answer: "Oui, absolument. Aucun frais caché. Tu payes exactement le même montant total, juste réparti sur 3 mois."
  },
  {
    question: "Y a-t-il une limite de places ?",
    answer: "Pour garantir la qualité du support, j'accepte un nombre limité de nouveaux membres chaque mois."
  },
  {
    question: "Je peux upgrader de IA Mastery vers Pack Power plus tard ?",
    answer: "Oui, à tout moment. Mais tu devras payer 697€ au lieu de 500€ si tu prends le pack complet."
  },
  {
    question: "L'offre est limitée dans le temps ?",
    answer: "Ces prix sont les tarifs de lancement. Ils peuvent augmenter à tout moment. Une fois inscrit(e), tu as accès à vie gratuitement aux mises à jour."
  }
];

export function FAQFinal({ content }: FAQFinalProps) {
  const questions = content.questions?.length > 0 ? content.questions : defaultQuestions;

  return (
    <section 
      className="relative py-20 md:py-28 px-4 font-inter"
      style={{ 
        backgroundColor: '#f3f4f6', 
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' 
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Titre */}
        <h2 
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-16"
          style={{ color: '#1e1b4b' }}
        >
          Questions fréquentes
        </h2>

        {/* Grid de questions - 2 colonnes */}
        <div className="grid md:grid-cols-2 gap-x-20 gap-y-12">
          {questions.map((item, index) => (
            <div 
              key={index}
              className="flex gap-4 items-start"
            >
              {/* Icône bulles de chat */}
              <div className="flex-shrink-0">
                <MessagesSquare 
                  className="w-12 h-12" 
                  style={{ color: '#9ca3af' }}
                  strokeWidth={1.2}
                />
              </div>

              {/* Ligne verticale orange */}
              <div 
                className="w-1 flex-shrink-0 self-stretch rounded-full"
                style={{ backgroundColor: '#f59e0b' }}
              />

              {/* Contenu */}
              <div className="flex-1">
                <h3 
                  className="text-lg font-semibold mb-3 leading-tight"
                  style={{ color: '#d97706' }}
                >
                  {item.question}
                </h3>
                <p 
                  className="text-base leading-relaxed"
                  style={{ color: '#4b5563' }}
                >
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
