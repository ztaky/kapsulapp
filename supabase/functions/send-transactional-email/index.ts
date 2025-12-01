import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TransactionalEmailRequest {
  type: "welcome_purchase" | "invoice" | "course_reminder" | "founder_welcome";
  organizationId?: string;
  recipientEmail: string;
  recipientName?: string;
  courseName?: string;
  coursePrice?: number;
  purchaseDate?: string;
  paymentId?: string;
  courseUrl?: string;
  // Founder specific
  amount?: number;
}

interface OrganizationBranding {
  name: string;
  logo_url: string | null;
  brand_color: string | null;
  contact_email: string | null;
  slug: string;
}

function generateWelcomeEmailHtml(
  branding: OrganizationBranding,
  recipientName: string,
  courseName: string,
  courseUrl: string
): string {
  const brandColor = branding.brand_color || "#d97706";
  const academyName = branding.name;
  const logoUrl = branding.logo_url;
  const supportEmail = branding.contact_email || `contact@${branding.slug}.kapsulapp.io`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue dans votre formation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${brandColor} 0%, ${adjustColor(brandColor, -20)} 100%); padding: 40px 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${academyName}" style="max-height: 60px; margin-bottom: 16px;">` : ''}
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Bienvenue ! 🎉</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0; font-size: 16px;">Votre accès est maintenant actif</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Bonjour${recipientName ? ` <strong>${recipientName}</strong>` : ''} !
              </p>
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Félicitations pour votre inscription à <strong style="color: ${brandColor};">"${courseName}"</strong> ! 
                Vous avez fait un excellent choix pour développer vos compétences.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="${courseUrl}" style="display: inline-block; background: linear-gradient(135deg, ${brandColor} 0%, ${adjustColor(brandColor, -20)} 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px ${brandColor}40;">
                      🚀 Commencer ma formation
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Next Steps Section -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="color: #1e293b; font-size: 18px; font-weight: 700; margin: 0 0 16px;">📋 Vos prochaines étapes</h2>
                    
                    <!-- Step 1 -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                      <tr>
                        <td width="40" valign="top">
                          <div style="width: 28px; height: 28px; background: ${brandColor}; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 600; font-size: 14px;">1</div>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="color: #334155; font-size: 15px; margin: 0; font-weight: 600;">Accédez à votre espace apprenant</p>
                          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">Connectez-vous et découvrez le programme complet de la formation.</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Step 2 -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                      <tr>
                        <td width="40" valign="top">
                          <div style="width: 28px; height: 28px; background: ${brandColor}; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 600; font-size: 14px;">2</div>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="color: #334155; font-size: 15px; margin: 0; font-weight: 600;">Commencez par le premier module</p>
                          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">Suivez les leçons dans l'ordre pour une progression optimale.</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Step 3 -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                      <tr>
                        <td width="40" valign="top">
                          <div style="width: 28px; height: 28px; background: ${brandColor}; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 600; font-size: 14px;">3</div>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="color: #334155; font-size: 15px; margin: 0; font-weight: 600;">Utilisez l'assistant IA</p>
                          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">Notre tuteur virtuel est là pour répondre à toutes vos questions.</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Step 4 -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="40" valign="top">
                          <div style="width: 28px; height: 28px; background: ${brandColor}; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 600; font-size: 14px;">4</div>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="color: #334155; font-size: 15px; margin: 0; font-weight: 600;">Pratiquez et progressez</p>
                          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">Appliquez ce que vous apprenez et suivez votre avancement.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Tips Section -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, ${brandColor}10 0%, ${brandColor}05 100%); border-radius: 12px; border-left: 4px solid ${brandColor};">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: ${brandColor}; font-size: 14px; font-weight: 700; margin: 0 0 8px;">💡 Conseil pour réussir</p>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0;">
                      Réservez des créneaux réguliers dans votre agenda pour suivre la formation. 
                      Même 20 minutes par jour peuvent faire une grande différence !
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                Des questions ? Contactez-nous à <a href="mailto:${supportEmail}" style="color: ${brandColor}; text-decoration: none;">${supportEmail}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-radius: 0 0 16px 16px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 13px; margin: 0;">
                © ${new Date().getFullYear()} ${academyName} • Propulsé par Kapsul
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateInvoiceEmailHtml(
  branding: OrganizationBranding,
  recipientName: string,
  courseName: string,
  coursePrice: number,
  purchaseDate: string,
  paymentId: string
): string {
  const brandColor = branding.brand_color || "#d97706";
  const academyName = branding.name;
  const logoUrl = branding.logo_url;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de paiement</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${brandColor} 0%, ${adjustColor(brandColor, -20)} 100%); padding: 40px 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${academyName}" style="max-height: 60px; margin-bottom: 16px;">` : ''}
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Confirmation de paiement</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Bonjour${recipientName ? ` <strong>${recipientName}</strong>` : ''} !
              </p>
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Merci pour votre achat ! Voici le récapitulatif de votre commande :
              </p>
              
              <!-- Invoice Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #64748b; font-size: 14px;">Formation</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                          <span style="color: #334155; font-size: 14px; font-weight: 600;">${courseName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #64748b; font-size: 14px;">Date</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                          <span style="color: #334155; font-size: 14px;">${purchaseDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #64748b; font-size: 14px;">N° Transaction</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                          <span style="color: #334155; font-size: 12px; font-family: monospace;">${paymentId}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0 0;">
                          <span style="color: #334155; font-size: 16px; font-weight: 700;">Total</span>
                        </td>
                        <td style="padding: 12px 0 0; text-align: right;">
                          <span style="color: ${brandColor}; font-size: 20px; font-weight: 700;">${coursePrice.toFixed(2)} €</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Ce document fait office de confirmation de paiement.<br>
                Conservez-le pour vos archives.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-radius: 0 0 16px 16px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 13px; margin: 0;">
                © ${new Date().getFullYear()} ${academyName} • Propulsé par Kapsul
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateFounderWelcomeEmailHtml(
  recipientName: string,
  amount: number
): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue dans la famille Fondateurs Kapsul</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fef7f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef7f0;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(249, 115, 22, 0.15);">
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); padding: 50px 40px 40px; border-radius: 16px 16px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">Bienvenue, Fondateur !</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 16px 0 0; font-size: 16px;">Vous faites partie des premiers à nous faire confiance</p>
            </td>
          </tr>
          
          <!-- Founder Badge -->
          <tr>
            <td align="center" style="padding: 0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); color: white; padding: 12px 32px; border-radius: 50px; font-weight: 700; font-size: 14px; letter-spacing: 1px; margin-top: -20px; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);">
                ✨ FONDATEUR ✨
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
                Bonjour${recipientName ? ` <strong>${recipientName}</strong>` : ''} !
              </p>
              <p style="color: #334155; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
                Merci infiniment pour votre confiance ! En rejoignant Kapsul en tant que <strong style="color: #f97316;">Fondateur</strong>, vous bénéficiez d'avantages exclusifs et permanents.
              </p>
              
              <!-- Benefits Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #fff7ed 0%, #fdf2f8 100%); border-radius: 12px; margin-bottom: 30px; border: 1px solid #fed7aa;">
                <tr>
                  <td style="padding: 28px;">
                    <h2 style="color: #1e293b; font-size: 18px; font-weight: 700; margin: 0 0 20px;">🎁 Vos avantages Fondateur à vie</h2>
                    
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="color: #f97316; font-size: 18px; margin-right: 12px;">⚡</span>
                          <span style="color: #334155; font-size: 15px;"><strong>Accès lifetime</strong> à Kapsul</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="color: #f97316; font-size: 18px; margin-right: 12px;">👑</span>
                          <span style="color: #334155; font-size: 15px;"><strong>0% de commission</strong> sur vos ventes, à vie</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="color: #f97316; font-size: 18px; margin-right: 12px;">🎯</span>
                          <span style="color: #334155; font-size: 15px;"><strong>Support prioritaire</strong></span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="color: #f97316; font-size: 18px; margin-right: 12px;">✨</span>
                          <span style="color: #334155; font-size: 15px;"><strong>Badge Fondateur exclusif</strong></span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="color: #f97316; font-size: 18px; margin-right: 12px;">🚀</span>
                          <span style="color: #334155; font-size: 15px;"><strong>Accès anticipé</strong> aux nouvelles fonctionnalités</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="https://kapsul.app/start" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 20px rgba(249, 115, 22, 0.4);">
                      🚀 Créer mon académie
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Payment confirmation -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #64748b; font-size: 14px;">Montant payé</td>
                        <td style="text-align: right; color: #334155; font-size: 18px; font-weight: 700;">${amount.toFixed(2)} €</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-size: 14px; padding-top: 8px;">Type</td>
                        <td style="text-align: right; color: #f97316; font-size: 14px; font-weight: 600; padding-top: 8px;">Paiement unique - Accès à vie</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                Des questions ? Écrivez-nous à <a href="mailto:hello@kapsul.app" style="color: #f97316; text-decoration: none;">hello@kapsul.app</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-radius: 0 0 16px 16px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 13px; margin: 0;">
                © ${new Date().getFullYear()} Kapsul • Merci de faire partie de l'aventure ! 🧡
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Helper function to darken/lighten a hex color
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: TransactionalEmailRequest = await req.json();
    console.log("Received transactional email request:", request);

    // Handle founder_welcome separately (no organization required)
    if (request.type === "founder_welcome") {
      const subject = "🎉 Bienvenue dans la famille Fondateurs Kapsul !";
      const html = generateFounderWelcomeEmailHtml(
        request.recipientName || "",
        request.amount || 297
      );

      console.log(`Sending founder_welcome email to ${request.recipientEmail}`);

      const emailResponse = await resend.emails.send({
        from: "Kapsul <noreply@kapsulapp.io>",
        reply_to: "hello@kapsul.app",
        to: [request.recipientEmail],
        subject: subject,
        html: html,
      });

      console.log("Founder welcome email sent successfully:", emailResponse);

      return new Response(
        JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For other email types, fetch organization branding
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (!request.organizationId) {
      return new Response(
        JSON.stringify({ error: "Organization ID required for this email type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select("name, logo_url, brand_color, contact_email, slug")
      .eq("id", request.organizationId)
      .single();

    if (orgError || !org) {
      console.error("Error fetching organization:", orgError);
      return new Response(
        JSON.stringify({ error: "Organization not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const branding: OrganizationBranding = org;
    console.log("Organization branding:", branding);

    let subject: string;
    let html: string;

    const siteUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "") || "https://kapsulapp.io";
    const courseUrl = request.courseUrl || `${siteUrl}/school/${branding.slug}/learning`;

    switch (request.type) {
      case "welcome_purchase":
        subject = `🎉 Bienvenue dans "${request.courseName}" !`;
        html = generateWelcomeEmailHtml(
          branding,
          request.recipientName || "",
          request.courseName || "votre formation",
          courseUrl
        );
        break;

      case "invoice":
        subject = `Confirmation de paiement - ${request.courseName}`;
        html = generateInvoiceEmailHtml(
          branding,
          request.recipientName || "",
          request.courseName || "Formation",
          request.coursePrice || 0,
          request.purchaseDate || new Date().toLocaleDateString("fr-FR"),
          request.paymentId || "N/A"
        );
        break;

      case "course_reminder":
        subject = `N'oubliez pas votre formation "${request.courseName}" !`;
        html = generateWelcomeEmailHtml(
          branding,
          request.recipientName || "",
          request.courseName || "votre formation",
          courseUrl
        );
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid email type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Send email with branded "From" and "Reply-To"
    const fromName = `${branding.name} via Kapsul`;
    const replyTo = branding.contact_email || undefined;

    console.log(`Sending ${request.type} email to ${request.recipientEmail}`);
    console.log(`From: ${fromName}, Reply-To: ${replyTo}`);

    const emailResponse = await resend.emails.send({
      from: `${fromName} <noreply@kapsulapp.io>`,
      reply_to: replyTo,
      to: [request.recipientEmail],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-transactional-email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
