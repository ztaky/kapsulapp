import { Link } from "react-router-dom";

interface CoachPublicFooterProps {
  variant?: "full" | "compact";
  organizationSlug: string;
  organizationName?: string;
  organizationLogo?: string | null;
  brandColor?: string;
  className?: string;
}

export function CoachPublicFooter({ 
  variant = "full",
  organizationSlug,
  organizationName,
  organizationLogo,
  brandColor = "#d97706",
  className = "" 
}: CoachPublicFooterProps) {
  const legalLinks = [
    { text: "Mentions légales", path: "mentions_legales" },
    { text: "Confidentialité", path: "politique_confidentialite" },
    { text: "CGV", path: "cgv" },
  ];

  // Compact variant - just legal links
  if (variant === "compact") {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {organizationName && (
          <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider mb-1">
            {organizationName}
          </span>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {legalLinks.map((link, index) => (
            <Link 
              key={index}
              to={`/school/${organizationSlug}/legal/${link.path}`} 
              className="hover:text-foreground transition-colors"
            >
              {link.text}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Full variant - complete footer with branding
  return (
    <footer className={`border-t bg-card py-8 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Branding */}
          <div className="flex items-center gap-2">
            {organizationLogo ? (
              <img 
                src={organizationLogo} 
                alt={organizationName || "Logo"} 
                className="h-6 w-6 object-contain"
              />
            ) : organizationName ? (
              <div 
                className="h-6 w-6 rounded flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: brandColor }}
              >
                {organizationName.charAt(0).toUpperCase()}
              </div>
            ) : null}
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {organizationName || ""}
            </span>
          </div>
          
          {/* Legal links */}
          <div className="flex flex-wrap gap-4 text-sm">
            {legalLinks.map((link, index) => (
              <Link 
                key={index}
                to={`/school/${organizationSlug}/legal/${link.path}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.text}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
