import { LandingPageConfig } from '@/config/landingPageSchema';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { Hero } from './sections/Hero';
import { Agitation } from './sections/Agitation';
import { SolutionTimeframe } from './sections/SolutionTimeframe';
import { Pedagogy } from './sections/Pedagogy';
import { Program } from './sections/Program';

interface LandingPageTemplateProps {
  config: LandingPageConfig;
}

export function LandingPageTemplate({ config }: LandingPageTemplateProps) {
  const { theme, content } = config;

  return (
    <ThemeProvider theme={theme}>
      <div className="landing-page-container">
        {/* Section 1 - Hero */}
        <Hero content={content.hero} />

        {/* Section 2 - Agitation */}
        <Agitation content={content.agitation} />

        {/* Section 3 - Solution Timeframe */}
        <SolutionTimeframe content={content.solutionTimeframe} />

        {/* Section 4 - Pedagogy */}
        <Pedagogy content={content.pedagogy} />

        {/* Section 5 - Program */}
        <Program content={content.program} />

        {/* Section 6 - Testimonials */}
        {/* TODO: À ajouter */}

        {/* Section 7 - FAQ */}
        {/* TODO: À ajouter */}

        {/* Section 8 - Bonus */}
        {/* TODO: À ajouter */}

        {/* Section 9 - Guarantee */}
        {/* TODO: À ajouter */}

        {/* Section 10 - Instructor */}
        {/* TODO: À ajouter */}

        {/* Section 11 - Upsell (optionnel) */}
        {content.upsell && (
          <div>
            {/* TODO: À ajouter */}
          </div>
        )}

        {/* Section 12 - Pricing */}
        {/* TODO: À ajouter */}

        {/* Section 13 - FAQ Final */}
        {/* TODO: À ajouter */}

        {/* Section 14 - Footer */}
        {/* TODO: À ajouter */}
      </div>
    </ThemeProvider>
  );
}
