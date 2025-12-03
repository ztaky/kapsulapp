import { LandingPageTemplate } from '@/components/landing/templates/LandingPageTemplate';
import { LandingPageConfig, defaultTheme } from '@/config/landingPageSchema';

// Données de test (simulant ce que Gemini générerait)
const testConfig: LandingPageConfig = {
  theme: defaultTheme,
  content: {
    hero: {
      preHeadline: "Pour les formateurs débordés qui veulent automatiser leur business",
      headline: {
        line1: "14 jours pour créer ton",
        line2: "Assistant IA & Académie Automatisée",
        line3: "et multiplier ta productivité x5"
      },
      subheadline: "Formation par la pratique. Zéro théorie. Résultats garantis.",
      benefits: [
        "Un système qui génère 20h/semaine de contenu automatiquement",
        "Une académie qui tourne sans toi 24/7",
        "Méthode testée par +300 formateurs avec 89% de satisfaction"
      ],
      cta: {
        text: "Je crée mon système en 14 jours",
        price: "497€"
      },
      testimonialSnippet: {
        stars: 5,
        text: "J'ai gagné 20h par semaine dès la première semaine. Game changer total !",
        author: "Marie, Coach Business"
      }
    },
    // Sections vides pour l'instant (on testera juste Hero)
    agitation: { headline: "", subheadline: "", overwhelmedPains: [], fomoPains: [] },
    solutionTimeframe: { headline: { before: "", gradient: "", after: "" }, subheadline: "", description: "", cards: [], benefits: [] },
    pedagogy: { headline: "", subheadline: "", pillars: [], shockPhrase: "" },
    program: { headline: "", subheadline: "", aiTypes: [], results: [], weeks: [], deliverables: [] },
    testimonials: { headline: "", stars: 5, items: [], cta: "" },
    faq: { headline: "", questions: [], cta: "" },
    bonus: { headline: "", subheadline: "", items: [], cta: "" },
    guarantee: { title: "", description: "", riskPhrase: "" },
    instructor: { headline: "", name: "", photo: "", credentials: [], mission: "", difference: "" },
    pricing: { headline: "", subheadline: "", offers: [] },
    faqFinal: { questions: [] },
    footer: { logo: "", copyright: "", links: [] }
  }
};

export default function TestLandingPage() {
  return <LandingPageTemplate config={testConfig} />;
}
