import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  senderName: string;
  senderEmail: string;
  message: string;
  organizationName: string;
  organizationEmail: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ContactRequest = await req.json();
    console.log("Sending school contact email from:", data.senderEmail, "to:", data.organizationEmail);

    // Validate inputs
    if (!data.senderName || !data.senderEmail || !data.message || !data.organizationEmail) {
      throw new Error("Missing required fields");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.senderEmail) || !emailRegex.test(data.organizationEmail)) {
      throw new Error("Invalid email format");
    }

    // Send email to the organization
    const emailResponse = await resend.emails.send({
      from: "Kapsul <lea@support.kapsulapp.io>",
      to: [data.organizationEmail],
      reply_to: data.senderEmail,
      subject: `📬 Nouveau message de contact - ${data.organizationName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
            .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f97316; margin: 20px 0; }
            .info-row { display: flex; margin-bottom: 10px; }
            .info-label { font-weight: bold; width: 80px; color: #64748b; }
            .reply-button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
            .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📬 Nouveau message de contact</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">via ${data.organizationName}</p>
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Vous avez reçu un nouveau message depuis votre page académie :</p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <div class="info-row">
                  <span class="info-label">Nom :</span>
                  <span>${data.senderName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email :</span>
                  <span><a href="mailto:${data.senderEmail}">${data.senderEmail}</a></span>
                </div>
              </div>
              
              <h3 style="margin-bottom: 10px;">Message :</h3>
              <div class="message-box">
                <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
              </div>
              
              <a href="mailto:${data.senderEmail}" class="reply-button">Répondre à ${data.senderName}</a>
            </div>
            <div class="footer">
              <p>Ce message a été envoyé via Kapsul</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Contact email sent successfully:", emailResponse);

    // Send confirmation to the sender
    await resend.emails.send({
      from: "Kapsul <lea@support.kapsulapp.io>",
      to: [data.senderEmail],
      subject: `✅ Message envoyé à ${data.organizationName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
            .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; }
            .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">✅ Message envoyé !</h1>
            </div>
            <div class="content">
              <p>Bonjour ${data.senderName},</p>
              <p>Votre message a bien été envoyé à <strong>${data.organizationName}</strong>.</p>
              
              <h3 style="margin-bottom: 10px;">Récapitulatif de votre message :</h3>
              <div class="message-box">
                <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
              </div>
              
              <p>Vous recevrez une réponse directement par email.</p>
            </div>
            <div class="footer">
              <p>Ce message a été envoyé via Kapsul</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-school-contact function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
