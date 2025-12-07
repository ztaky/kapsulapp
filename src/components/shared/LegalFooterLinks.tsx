import { Link } from "react-router-dom";

interface LegalFooterLinksProps {
  variant: "kapsul" | "coach";
  organizationSlug?: string;
  organizationName?: string;
  className?: string;
}

export function LegalFooterLinks({ 
  variant, 
  organizationSlug, 
  organizationName,
  className = "" 
}: LegalFooterLinksProps) {
  if (variant === "kapsul") {
    return (
      <div className={`flex items-center justify-center gap-4 text-xs text-muted-foreground ${className}`}>
        <span>© {new Date().getFullYear()} Kapsul</span>
        <span className="text-border">|</span>
        <Link to="/mentions-legales" className="hover:text-foreground transition-colors">
          Mentions légales
        </Link>
        <Link to="/confidentialite" className="hover:text-foreground transition-colors">
          Confidentialité
        </Link>
        <Link to="/cgv" className="hover:text-foreground transition-colors">
          CGV
        </Link>
      </div>
    );
  }

  if (!organizationSlug) return null;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {organizationName && (
        <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider mb-1">
          {organizationName}
        </span>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Link 
          to={`/school/${organizationSlug}/legal/mentions_legales`} 
          className="hover:text-foreground transition-colors"
        >
          Mentions légales
        </Link>
        <Link 
          to={`/school/${organizationSlug}/legal/politique_confidentialite`} 
          className="hover:text-foreground transition-colors"
        >
          Confidentialité
        </Link>
        <Link 
          to={`/school/${organizationSlug}/legal/cgv`} 
          className="hover:text-foreground transition-colors"
        >
          CGV
        </Link>
      </div>
    </div>
  );
}
