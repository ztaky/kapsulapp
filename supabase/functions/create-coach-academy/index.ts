import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Generate welcome email HTML
function generateWelcomeEmailHTML(coachName: string, academyName: string, academySlug: string, baseUrl: string, isFounder: boolean) {
  const studioUrl = `${baseUrl}/school/${academySlug}/studio`;
  
  const founderBadge = isFounder ? `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; padding: 8px 16px; background: linear-gradient(90deg, #f97316, #ec4899); border-radius: 9999px; color: white; font-weight: bold; font-size: 14px;">
        ✨ FONDATEUR
      </div>
    </div>
  ` : '';
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur Kapsul</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fdfbf7;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <img src="https://mwnrbccqteqslzbdrnuw.supabase.co/storage/v1/object/public/landing-page-references/kapsul-logo.png" alt="Kapsul" style="height: 48px; width: auto;" />
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background: white; border-radius: 24px; padding: 48px 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
              <!-- Emoji Header -->
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 64px;">🎉</span>
              </div>
              
              ${founderBadge}
              
              <!-- Title -->
              <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #1e293b; text-align: center; line-height: 1.3;">
                Bienvenue ${coachName || ''} !
              </h1>
              
              <p style="margin: 0 0 32px; font-size: 16px; color: #64748b; text-align: center; line-height: 1.6;">
                Votre académie <strong style="color: #ea580c;">${academyName}</strong> est prête. Voici les prochaines étapes pour lancer vos formations.
              </p>
              
              <!-- Steps -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                <!-- Step 1 -->
                <tr>
                  <td style="padding: 16px; background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%); border-radius: 16px; margin-bottom: 12px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="width: 48px; vertical-align: top;">
                          <div style="width: 40px; height: 40px; background: #3b82f6; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; text-align: center; line-height: 40px;">1</div>
                        </td>
                        <td style="vertical-align: top; padding-left: 12px;">
                          <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #1e293b;">Personnalisez votre académie</h3>
                          <p style="margin: 0; font-size: 14px; color: #64748b;">Ajoutez votre logo et choisissez votre couleur de marque</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 12px;"></td></tr>
                
                <!-- Step 2 -->
                <tr>
                  <td style="padding: 16px; background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%); border-radius: 16px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="width: 48px; vertical-align: top;">
                          <div style="width: 40px; height: 40px; background: #22c55e; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; text-align: center; line-height: 40px;">2</div>
                        </td>
                        <td style="vertical-align: top; padding-left: 12px;">
                          <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #1e293b;">Créez votre première formation</h3>
                          <p style="margin: 0; font-size: 14px; color: #64748b;">Structurez votre contenu en modules et leçons</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 12px;"></td></tr>
                
                <!-- Step 3 -->
                <tr>
                  <td style="padding: 16px; background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%); border-radius: 16px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="width: 48px; vertical-align: top;">
                          <div style="width: 40px; height: 40px; background: #a855f7; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; text-align: center; line-height: 40px;">3</div>
                        </td>
                        <td style="vertical-align: top; padding-left: 12px;">
                          <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #1e293b;">Connectez Stripe</h3>
                          <p style="margin: 0; font-size: 14px; color: #64748b;">Recevez vos paiements directement sur votre compte</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 12px;"></td></tr>
                
                <!-- Step 4 -->
                <tr>
                  <td style="padding: 16px; background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%); border-radius: 16px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="width: 48px; vertical-align: top;">
                          <div style="width: 40px; height: 40px; background: #f97316; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; text-align: center; line-height: 40px;">4</div>
                        </td>
                        <td style="vertical-align: top; padding-left: 12px;">
                          <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #1e293b;">Créez une page de vente</h3>
                          <p style="margin: 0; font-size: 14px; color: #64748b;">Générez une landing page avec notre IA</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${studioUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(90deg, #ea580c 0%, #db2777 100%); color: white; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.4);">
                      Accéder à mon Studio →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 20px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #94a3b8;">
                Des questions ? Répondez simplement à cet email.
              </p>
              <p style="margin: 0; font-size: 12px; color: #cbd5e1;">
                © ${new Date().getFullYear()} Kapsul - Votre plateforme de formations en ligne
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { academyName, slug, userId, isFounder } = await req.json();

    if (!academyName || !slug || !userId) {
      throw new Error('Missing required fields: academyName, slug, userId');
    }

    console.log('Creating academy:', { academyName, slug, userId, isFounder });

    // Get user email and name for welcome email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    // Determine plan limits based on founder status
    const planConfig = isFounder ? {
      is_founder_plan: true,
      max_students: 1000,  // Founders get 1000 students max
      max_coaches: 1,      // Founders get 1 coach (themselves)
    } : {
      is_founder_plan: false,
      max_students: null,  // Free/future plans - to be defined
      max_coaches: 1,
    };

    // 1. Create organization with plan limits
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: academyName,
        slug: slug,
        brand_color: '#ea580c', // Kapsul orange
        ...planConfig,
      })
      .select()
      .single();

    if (orgError) {
      console.error('Organization creation error:', orgError);
      throw orgError;
    }

    console.log('Organization created:', organization);

    // 2. Add user as coach
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organization.id,
        user_id: userId,
        role: 'coach',
      });

    if (memberError) {
      console.error('Member creation error:', memberError);
      throw memberError;
    }

    console.log('User added as coach');

    // 3. Create default design preferences
    const { error: prefsError } = await supabase
      .from('coach_design_preferences')
      .insert({
        organization_id: organization.id,
        preferred_colors: ['#ea580c', '#ec4899'],
        preferred_layout_style: 'queen',
        preferred_cta_style: 'gradient',
        preferred_fonts: {
          heading: 'Plus Jakarta Sans',
          body: 'Plus Jakarta Sans',
        },
      });

    if (prefsError) {
      console.error('Design preferences error:', prefsError);
      // Non-blocking error
    }

    // 4. Send welcome email
    if (profile?.email) {
      try {
        // Get base URL from request origin or fallback
        const origin = req.headers.get('origin') || 'https://kapsul.app';
        
        const emailHtml = generateWelcomeEmailHTML(
          profile.full_name || '',
          academyName,
          slug,
          origin,
          isFounder || false
        );

        const emailResponse = await resend.emails.send({
          from: 'Kapsul <onboarding@resend.dev>',
          to: [profile.email],
          subject: isFounder 
            ? `🎉 Bienvenue Fondateur ! Votre académie "${academyName}" est prête`
            : `🎉 Bienvenue sur Kapsul ! Votre académie "${academyName}" est prête`,
          html: emailHtml,
        });

        console.log('Welcome email sent:', emailResponse);
      } catch (emailError) {
        console.error('Welcome email error (non-blocking):', emailError);
        // Non-blocking - academy creation should still succeed
      }
    }

    console.log('Academy creation complete with plan:', planConfig);

    return new Response(
      JSON.stringify({ organization, slug }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error occurred' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});