import { FooterContent } from '@/config/landingPageSchema';
import { useTheme } from '@/theme/ThemeProvider';

interface FooterProps {
  content: FooterContent;
}

export function Footer({ content }: FooterProps) {
  const { theme } = useTheme();

  return (
    <footer 
      className="relative py-12 px-4"
      style={{ backgroundColor: theme.colors.bgDark }}
    >
      <div className="max-w-6xl mx-auto text-center">
        {/* Logo */}
        {content.logo && (
          <div className="mb-6">
            <img 
              src={content.logo} 
              alt="Logo"
              className="h-12 mx-auto"
            />
          </div>
        )}

        {/* Copyright */}
        <p 
          className="text-sm mb-6"
          style={{ color: theme.colors.textLight, opacity: 0.8 }}
        >
          {content.copyright}
        </p>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6">
          {content.links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              className="text-sm hover:underline transition-all"
              style={{ color: theme.colors.textLight, opacity: 0.8 }}
            >
              {link.text}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
