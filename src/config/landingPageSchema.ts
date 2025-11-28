/**
 * Structure complète des données pour une landing page
 * Compatible avec le wizard existant + extension pour les 14 sections
 */

export interface LandingPageTheme {
  logo?: string;
  colors: {
    primary: string;
    primaryDark: string;
    bgDark: string;
    bgLight: string;
    textDark: string;
    textLight: string;
    accentGreen: string;
    accentRed: string;
  };
  fonts: {
    family: string;
    heading: string;  // weight
    body: string;     // weight
  };
}

export interface HeroContent {
  preHeadline: string;
  headline: {
    line1: string;
    line2: string;  // Sera en gradient
    line3: string;
  };
  subheadline: string;
  benefits: string[];
  cta: {
    text: string;
    price: string;
  };
  testimonialSnippet: {
    stars: number;
    text: string;
    author: string;
  };
}

export interface AgitationContent {
  headline: string;
  subheadline: string;
  painPoints: Array<{
    icon: string;
    text: string;
  }>;
}

export interface SolutionTimeframeContent {
  headline: string;
  stats: Array<{
    value: string;
    label: string;
  }>;
  socialProof: string;
  secretBox: {
    title: string;
    content: string;
  };
}

export interface PedagogyContent {
  headline: string;
  subheadline: string;
  pillars: Array<{
    number: number;
    title: string;
    description: string;
    details: string;
  }>;
  shockPhrase: string;
}

export interface ProgramContent {
  headline: string;
  subheadline: string;
  aiTypes: Array<{
    type: string;
    purpose: string;
    tasks: string[];
  }>;
  results: string[];
  weeks: Array<{
    number: number;
    title: string;
    days: Array<{
      day: string;
      title: string;
      content: string;
    }>;
  }>;
  deliverables: string[];
}

export interface TestimonialsContent {
  headline: string;
  stars: number;
  items: Array<{
    quote: string;
    author: {
      name: string;
      role: string;
      photo: string;
    };
  }>;
  cta: string;
}

export interface FAQContent {
  headline: string;
  questions: string[];
  cta: string;
}

export interface BonusContent {
  headline: string;
  subheadline: string;
  items: Array<{
    number: number;
    title: string;
    value: string;
    description: string;
    content: string;
  }>;
  cta: string;
}

export interface GuaranteeContent {
  title: string;
  description: string;
  riskPhrase: string;
}

export interface InstructorContent {
  headline: string;
  name: string;
  photo: string;
  credentials: string[];
  mission: string;
  difference: string;
}

export interface UpsellContent {
  headline: string;
  description: string;
  benefits: string[];
  cta: string;
}

export interface PricingContent {
  headline: string;
  subheadline: string;
  offers: Array<{
    name: string;
    price: number;
    ribbon: string;
    ribbonColor: string;
    features: string[];
    cta: string;
  }>;
}

export interface FAQFinalContent {
  questions: Array<{
    icon: string;
    question: string;
    answer: string;
  }>;
}

export interface FooterContent {
  logo: string;
  copyright: string;
  links: Array<{
    text: string;
    url: string;
  }>;
}

export interface LandingPageContent {
  hero: HeroContent;
  agitation: AgitationContent;
  solutionTimeframe: SolutionTimeframeContent;
  pedagogy: PedagogyContent;
  program: ProgramContent;
  testimonials: TestimonialsContent;
  faq: FAQContent;
  bonus: BonusContent;
  guarantee: GuaranteeContent;
  instructor: InstructorContent;
  upsell?: UpsellContent;
  pricing: PricingContent;
  faqFinal: FAQFinalContent;
  footer: FooterContent;
}

export interface LandingPageConfig {
  theme: LandingPageTheme;
  content: LandingPageContent;
}

// Default theme (couleurs Kapsul)
export const defaultTheme: LandingPageTheme = {
  colors: {
    primary: "#d97706",
    primaryDark: "#f59e0b",
    bgDark: "#0a0e27",
    bgLight: "#fef8f3",
    textDark: "#1a1a1a",
    textLight: "#ffffff",
    accentGreen: "#10b981",
    accentRed: "#ef4444",
  },
  fonts: {
    family: "Inter",
    heading: "700",
    body: "400",
  },
};

// Helper pour créer un thème depuis les données du wizard
export function createThemeFromWizard(wizardData: {
  colors: string[];
  fonts: { heading: string; body: string };
  theme: "light" | "dark";
  trainerPhoto?: string;
}): LandingPageTheme {
  return {
    logo: undefined, // À définir plus tard
    colors: {
      primary: wizardData.colors[0] || defaultTheme.colors.primary,
      primaryDark: wizardData.colors[1] || defaultTheme.colors.primaryDark,
      bgDark: wizardData.theme === "dark" ? "#0a0e27" : "#1e1b4b",
      bgLight: wizardData.theme === "light" ? "#fef8f3" : "#ffffff",
      textDark: "#1a1a1a",
      textLight: "#ffffff",
      accentGreen: "#10b981",
      accentRed: "#ef4444",
    },
    fonts: {
      family: wizardData.fonts.heading,
      heading: "700",
      body: "400",
    },
  };
}
