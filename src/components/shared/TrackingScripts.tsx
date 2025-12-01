import { useEffect } from "react";
import { useCookieConsent } from "@/hooks/useCookieConsent";

interface TrackingScriptsProps {
  gtmContainerId?: string;
  facebookPixelId?: string;
}

export function TrackingScripts({ gtmContainerId, facebookPixelId }: TrackingScriptsProps) {
  const { preferences, hasConsented, isLoaded } = useCookieConsent();

  // Load GTM if analytics is accepted
  useEffect(() => {
    if (!isLoaded || !hasConsented || !preferences?.analytics || !gtmContainerId) {
      return;
    }

    // Check if already loaded
    if (document.querySelector(`script[src*="googletagmanager.com/gtm.js?id=${gtmContainerId}"]`)) {
      return;
    }

    // GTM script
    const script = document.createElement("script");
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmContainerId}');
    `;
    document.head.appendChild(script);

    // GTM noscript iframe
    const noscript = document.createElement("noscript");
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`;
    iframe.height = "0";
    iframe.width = "0";
    iframe.style.display = "none";
    iframe.style.visibility = "hidden";
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);

    console.log("[Tracking] GTM loaded:", gtmContainerId);
  }, [isLoaded, hasConsented, preferences?.analytics, gtmContainerId]);

  // Load Facebook Pixel if marketing is accepted
  useEffect(() => {
    if (!isLoaded || !hasConsented || !preferences?.marketing || !facebookPixelId) {
      return;
    }

    // Check if already loaded
    if ((window as any).fbq) {
      return;
    }

    // Facebook Pixel script
    const script = document.createElement("script");
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${facebookPixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    // Facebook Pixel noscript
    const noscript = document.createElement("noscript");
    const img = document.createElement("img");
    img.height = 1;
    img.width = 1;
    img.style.display = "none";
    img.src = `https://www.facebook.com/tr?id=${facebookPixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);

    console.log("[Tracking] Facebook Pixel loaded:", facebookPixelId);
  }, [isLoaded, hasConsented, preferences?.marketing, facebookPixelId]);

  return null;
}

// Hook to track custom events
export function useTrackEvent() {
  const { preferences, hasConsented } = useCookieConsent();

  const trackGTMEvent = (event: string, data?: Record<string, any>) => {
    if (!hasConsented || !preferences?.analytics) return;
    
    const dataLayer = (window as any).dataLayer;
    if (dataLayer) {
      dataLayer.push({ event, ...data });
    }
  };

  const trackFBEvent = (event: string, data?: Record<string, any>) => {
    if (!hasConsented || !preferences?.marketing) return;
    
    const fbq = (window as any).fbq;
    if (fbq) {
      fbq("track", event, data);
    }
  };

  // Conversion: Lead (inscription réussie)
  const trackLead = (email?: string) => {
    trackGTMEvent("generate_lead", { method: "email", email });
    trackFBEvent("Lead", { content_name: "signup", content_category: "registration" });
    console.log("[Tracking] Lead event fired", { email });
  };

  // Conversion: Purchase (paiement fondateur)
  const trackPurchase = (value: number, currency: string = "EUR", transactionId?: string) => {
    trackGTMEvent("purchase", { value, currency, transaction_id: transactionId });
    trackFBEvent("Purchase", { value, currency, content_name: "founder_offer" });
    console.log("[Tracking] Purchase event fired", { value, currency, transactionId });
  };

  // Conversion: AddToCart (clic sur offre)
  const trackAddToCart = (productName: string, value: number, currency: string = "EUR") => {
    trackGTMEvent("add_to_cart", { items: [{ item_name: productName, price: value }], value, currency });
    trackFBEvent("AddToCart", { content_name: productName, value, currency });
    console.log("[Tracking] AddToCart event fired", { productName, value, currency });
  };

  // Conversion: InitiateCheckout (début du checkout)
  const trackInitiateCheckout = (productName: string, value: number, currency: string = "EUR") => {
    trackGTMEvent("begin_checkout", { items: [{ item_name: productName, price: value }], value, currency });
    trackFBEvent("InitiateCheckout", { content_name: productName, value, currency });
    console.log("[Tracking] InitiateCheckout event fired", { productName, value, currency });
  };

  return { 
    trackGTMEvent, 
    trackFBEvent, 
    trackLead, 
    trackPurchase, 
    trackAddToCart, 
    trackInitiateCheckout 
  };
}
