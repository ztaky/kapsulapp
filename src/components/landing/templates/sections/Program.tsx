import { ProgramContent } from '@/config/landingPageSchema';
import { useTheme, getGradientStyle } from '@/theme/ThemeProvider';
import { CheckCircle2, Calendar, Bot } from 'lucide-react';

interface ProgramProps {
  content: ProgramContent;
}

export function Program({ content }: ProgramProps) {
  const { theme } = useTheme();
  const gradientStyle = getGradientStyle(theme);

  return (
    <section 
      className="relative py-24 md:py-32 px-4"
      style={{ backgroundColor: theme.colors.bgDark }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Headline */}
        <h2 
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6"
          style={{ color: theme.colors.textLight }}
        >
          {content.headline}
        </h2>

        {/* Subheadline */}
        <p 
          className="text-xl md:text-2xl text-center mb-16 max-w-4xl mx-auto"
          style={{ color: theme.colors.textLight, opacity: 0.9 }}
        >
          {content.subheadline}
        </p>

        {/* AI Types Section */}
        {content.aiTypes && content.aiTypes.length > 0 && (
          <div className="mb-16">
            <h3 
              className="text-2xl md:text-3xl font-bold mb-8 text-center flex items-center justify-center gap-3"
              style={{ color: theme.colors.textLight }}
            >
              <Bot className="w-8 h-8" style={{ color: theme.colors.primary }} />
              Les outils IA que tu vas maîtriser
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.aiTypes.map((ai, index) => (
                <div 
                  key={index}
                  className="p-6 rounded-2xl"
                  style={{ 
                    backgroundColor: `${theme.colors.primary}15`,
                    border: `1px solid ${theme.colors.primary}40`
                  }}
                >
                  <h4 
                    className="text-xl font-bold mb-2"
                    style={{ 
                      background: gradientStyle,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {ai.type}
                  </h4>
                  <p 
                    className="text-sm mb-4"
                    style={{ color: theme.colors.textLight, opacity: 0.8 }}
                  >
                    {ai.purpose}
                  </p>
                  <ul className="space-y-2">
                    {ai.tasks.map((task, taskIndex) => (
                      <li 
                        key={taskIndex} 
                        className="flex items-start gap-2 text-sm"
                        style={{ color: theme.colors.textLight, opacity: 0.9 }}
                      >
                        <CheckCircle2 
                          className="w-4 h-4 flex-shrink-0 mt-0.5" 
                          style={{ color: theme.colors.accentGreen }}
                        />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {content.results.map((result, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-6 rounded-2xl"
              style={{ 
                backgroundColor: `${theme.colors.textLight}08`,
                border: `1px solid ${theme.colors.textLight}15`
              }}
            >
              <CheckCircle2 
                className="w-6 h-6 flex-shrink-0 mt-1" 
                style={{ color: theme.colors.accentGreen }}
              />
              <p 
                className="text-base md:text-lg"
                style={{ color: theme.colors.textLight }}
              >
                {result}
              </p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="space-y-12">
          {content.weeks.map((week, weekIndex) => (
            <div key={weekIndex}>
              <h3 
                className="text-3xl md:text-4xl font-bold mb-8 flex items-center gap-3"
                style={{ 
                  background: gradientStyle,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                <Calendar className="w-8 h-8" style={{ color: theme.colors.primary }} />
                {week.title}
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {week.days.map((day, dayIndex) => (
                  <div 
                    key={dayIndex}
                    className="p-6 rounded-2xl"
                    style={{ 
                      backgroundColor: `${theme.colors.textLight}08`,
                      border: `1px solid ${theme.colors.textLight}15`
                    }}
                  >
                    <h4 
                      className="text-xl font-bold mb-3"
                      style={{ color: theme.colors.textLight }}
                    >
                      {day.day}
                    </h4>
                    <p 
                      className="text-base leading-relaxed"
                      style={{ color: theme.colors.textLight, opacity: 0.9 }}
                    >
                      {day.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Deliverables */}
        <div 
          className="mt-16 p-10 rounded-3xl" 
          style={{ backgroundColor: `${theme.colors.textLight}08` }}
        >
          <h3 
            className="text-3xl md:text-4xl font-bold mb-8 text-center"
            style={{ color: theme.colors.textLight }}
          >
            Ce que tu auras créé :
          </h3>
          <ul className="space-y-4 max-w-3xl mx-auto">
            {content.deliverables.map((deliverable, index) => (
              <li key={index} className="flex items-start gap-4">
                <CheckCircle2 
                  className="w-6 h-6 flex-shrink-0 mt-1" 
                  style={{ color: theme.colors.accentGreen }}
                />
                <span 
                  className="text-lg md:text-xl"
                  style={{ color: theme.colors.textLight }}
                >
                  {deliverable}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
