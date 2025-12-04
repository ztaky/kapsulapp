import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnrollmentNotificationRequest {
  studentEmail: string;
  studentName: string | null;
  courseTitles: string[];
  organizationName: string;
  organizationSlug: string;
  coachName: string | null;
  frontendUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      studentEmail,
      studentName,
      courseTitles,
      organizationName,
      organizationSlug,
      coachName,
      frontendUrl,
    }: EnrollmentNotificationRequest = await req.json();

    console.log("Sending enrollment notification to:", studentEmail);
    console.log("Courses:", courseTitles);
    console.log("Frontend URL:", frontendUrl);

    const coursesList = courseTitles
      .map((title) => `<li style="margin-bottom: 8px;">📚 ${title}</li>`)
      .join("");

    // Use frontendUrl from request, fallback to a sensible default
    const baseUrl = frontendUrl?.replace(/\/$/, "") || "https://kapsul.lovable.app";
    const loginUrl = `${baseUrl}/school/${organizationSlug}/student`;

    console.log("Generated login URL:", loginUrl);

    const emailResponse = await resend.emails.send({
      from: `${organizationName} <onboarding@resend.dev>`,
      to: [studentEmail],
      subject: `🎉 Vous avez accès à ${courseTitles.length > 1 ? "de nouvelles formations" : "une nouvelle formation"} !`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f97316, #ec4899); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">
              🎉 Bonne nouvelle !
            </h1>
          </div>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="margin: 0 0 16px 0; font-size: 16px;">
              Bonjour ${studentName || ""},
            </p>
            <p style="margin: 0 0 16px 0; font-size: 16px;">
              ${coachName ? `<strong>${coachName}</strong> vous a accordé l'accès` : "Vous avez maintenant accès"} ${courseTitles.length > 1 ? "aux formations suivantes" : "à la formation suivante"} sur <strong>${organizationName}</strong> :
            </p>
            
            <ul style="background: white; border-radius: 8px; padding: 16px 16px 16px 32px; margin: 0 0 16px 0; list-style: none;">
              ${coursesList}
            </ul>
          </div>
          
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316, #ec4899); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Accéder à mes formations
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">
              ${organizationName}
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending enrollment notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
