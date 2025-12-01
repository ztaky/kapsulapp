import { Link } from "react-router-dom";
import kapsulLogo from "@/assets/kapsul-logo.png";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { Cookie } from "lucide-react";

export function KapsulFooter() {
  const { resetConsent } = useCookieConsent();

  const handleManageCookies = () => {
    resetConsent();
    // Small delay to ensure state is updated before banner shows
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <footer className="bg-[#0F172A] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo & Description */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img src={kapsulLogo} alt="Kapsul" className="h-10 w-10" />
              <span className="text-xl font-bold text-white">KAPSUL</span>
            </div>
            <p className="text-white/60 leading-relaxed max-w-md">
              La plateforme tout-en-un pour créer et vendre vos formations en ligne. 
              Hébergez vos cours, gérez vos élèves et encaissez vos ventes sans complexité technique.
            </p>
          </div>

          {/* Produit */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
              Produit
            </h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/#features" 
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link 
                  to="/#pricing" 
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Tarifs
                </Link>
              </li>
              <li>
                <Link 
                  to="/faq" 
                  className="text-white/60 hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link 
                  to="/roadmap" 
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
              Légal
            </h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/mentions-legales" 
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link 
                  to="/confidentialite" 
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link 
                  to="/cgv" 
                  className="text-white/60 hover:text-white transition-colors"
                >
                  CGV
                </Link>
              </li>
              <li>
                <button 
                  onClick={handleManageCookies}
                  className="text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Cookie className="w-3.5 h-3.5" />
                  Gérer les cookies
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} Kapsul. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="mailto:contact@kapsulapp.io" 
                className="text-white/40 hover:text-white text-sm transition-colors"
              >
                contact@kapsulapp.io
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
