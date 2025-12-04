import { LandingPageConfig } from '@/config/landingPageSchema';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { Hero } from './sections/Hero';
import { Agitation } from './sections/Agitation';
import { SolutionTimeframe } from './sections/SolutionTimeframe';
import { Pedagogy } from './sections/Pedagogy';
import { Program } from './sections/Program';
import { Testimonials } from './sections/Testimonials';
import { FAQ } from './sections/FAQ';
import { Bonus } from './sections/Bonus';
import { Guarantee } from './sections/Guarantee';
import { Instructor } from './sections/Instructor';
import { Pricing } from './sections/Pricing';
import { FAQFinal } from './sections/FAQFinal';
import { Footer } from './sections/Footer';

interface LandingPageTemplateProps {
  config: LandingPageConfig;
  trainerPhoto?: string; // Photo from trainerInfo for backward compatibility
  enabledSections?: string[]; // Sections to display
  landingSlug?: string; // Slug for legal page links
}

// Map editor section IDs to template section IDs
const SECTION_ID_MAP: Record<string, string[]> = {
  'hero': ['hero'],
  'problem': ['agitation'],
  'method': ['solutionTimeframe', 'pedagogy'],
  'transformation': ['guarantee'],
  'program': ['program'],
  'bonus': ['bonus'],
  'trainer': ['instructor'],
  'testimonials': ['testimonials'],
  'faq': ['faq', 'faqFinal'],
  'pricing': ['pricing'],
  'final_cta': [],
  'footer': ['footer'],
};

// Default all sections enabled
const ALL_TEMPLATE_SECTIONS = [
  'hero', 'agitation', 'solutionTimeframe', 'pedagogy', 'program',
  'testimonials', 'faq', 'bonus', 'guarantee', 'instructor',
  'upsell', 'pricing', 'faqFinal', 'footer'
];

export function LandingPageTemplate({ config, trainerPhoto, enabledSections, landingSlug }: LandingPageTemplateProps) {
  const { theme, content } = config;
  
  // Convert editor section IDs to template section IDs
  const getEnabledTemplateSections = () => {
    if (!enabledSections) return ALL_TEMPLATE_SECTIONS;
    
    const templateSections = new Set<string>();
    // Always include hero, bonus and footer
    templateSections.add('hero');
    templateSections.add('bonus');
    templateSections.add('footer');
    
    enabledSections.forEach(editorSection => {
      const mappedSections = SECTION_ID_MAP[editorSection];
      if (mappedSections) {
        mappedSections.forEach(s => templateSections.add(s));
      } else {
        // Direct match if no mapping exists
        templateSections.add(editorSection);
      }
    });
    
    return Array.from(templateSections);
  };
  
  const activeSections = getEnabledTemplateSections();
  const isEnabled = (sectionId: string) => activeSections.includes(sectionId);

  return (
    <ThemeProvider theme={theme}>
      <div className="landing-page-container font-inter" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
        {/* Section 1 - Hero (always shown) */}
        <Hero content={content.hero} />

        {/* Section 2 - Agitation */}
        {isEnabled('agitation') && content.agitation && (
          <Agitation content={content.agitation} />
        )}

        {/* Section 3 - Solution Timeframe */}
        {isEnabled('solutionTimeframe') && content.solutionTimeframe && (
          <SolutionTimeframe content={content.solutionTimeframe} />
        )}

        {/* Section 4 - Pedagogy */}
        {isEnabled('pedagogy') && content.pedagogy && (
          <Pedagogy content={content.pedagogy} />
        )}

        {/* Section 5 - Program */}
        {isEnabled('program') && content.program && (
          <Program content={content.program} />
        )}

        {/* Section 6 - Testimonials */}
        {isEnabled('testimonials') && content.testimonials && (
          <Testimonials content={content.testimonials} />
        )}

        {/* Section 7 - FAQ */}
        {isEnabled('faq') && content.faq && (
          <FAQ content={content.faq} />
        )}

        {/* Section 8 - Bonus */}
        {isEnabled('bonus') && content.bonus && (
          <Bonus content={content.bonus} />
        )}

        {/* Section 9 - Guarantee */}
        {isEnabled('guarantee') && content.guarantee && (
          <Guarantee content={content.guarantee} />
        )}

        {/* Section 10 - Instructor */}
        {isEnabled('instructor') && content.instructor && (
          <Instructor content={content.instructor} trainerPhoto={trainerPhoto} />
        )}

        {/* Section 11 - Upsell (optionnel) */}
        {isEnabled('upsell') && content.upsell && (
          <section className="relative py-24 md:py-32 px-4" style={{ backgroundColor: '#fef8f3' }}>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">{content.upsell.headline}</h2>
              <p className="text-xl mb-8">{content.upsell.description}</p>
              <ul className="space-y-2 mb-8">
                {content.upsell.benefits.map((b, i) => (
                  <li key={i} className="text-lg">✓ {b}</li>
                ))}
              </ul>
              <button className="px-8 py-4 rounded-full text-xl font-bold">{content.upsell.cta}</button>
            </div>
          </section>
        )}

        {/* Section 12 - Pricing */}
        {isEnabled('pricing') && content.pricing && (
          <Pricing content={content.pricing} landingSlug={landingSlug} />
        )}

        {/* Section 13 - FAQ Final */}
        {isEnabled('faqFinal') && content.faqFinal && (
          <FAQFinal content={content.faqFinal} />
        )}

        {/* Section 14 - Footer */}
        {isEnabled('footer') && content.footer && (
          <Footer content={content.footer} landingSlug={landingSlug} />
        )}
      </div>
    </ThemeProvider>
  );
}
