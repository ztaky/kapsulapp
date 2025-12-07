import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { KapsulPublicFooter } from "@/components/shared/KapsulPublicFooter";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted">
      <div className="text-center flex-1 flex flex-col items-center justify-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page introuvable</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Retour à l'accueil
        </a>
      </div>
      <KapsulPublicFooter variant="compact" className="pb-8" />
    </div>
  );
};

export default NotFound;
