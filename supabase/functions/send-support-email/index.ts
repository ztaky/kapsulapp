import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "ticket_created" | "ticket_reply" | "ticket_status_changed";
  ticketId: string;
  recipientEmail: string;
  recipientName?: string;
  ticketSubject: string;
  ticketStatus?: string;
  replyContent?: string;
  fromAdmin?: boolean;
}

const getEmailContent = (data: EmailRequest) => {
  switch (data.type) {
    case "ticket_created":
      return {
        subject: `🎫 Ticket créé : ${data.ticketSubject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
              .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
              .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Nouveau ticket créé</h1>
              </div>
              <div class="content">
                <p>Bonjour ${data.recipientName || "Admin"},</p>
                <p>Un nouveau ticket de support a été créé :</p>
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f97316;">
                  <h3 style="margin: 0 0 10px 0;">${data.ticketSubject}</h3>
                </div>
                <p>Notre équipe va traiter votre demande dans les plus brefs délais.</p>
              </div>
              <div class="footer">
                <p>© Kapsul - Plateforme de formation en ligne</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "ticket_reply":
      return {
        subject: `💬 Nouvelle réponse sur votre ticket : ${data.ticketSubject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
              .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0; }
              .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Nouvelle réponse</h1>
              </div>
              <div class="content">
                <p>Bonjour ${data.recipientName || ""},</p>
                <p>${data.fromAdmin ? "Un administrateur" : "L'utilisateur"} a répondu à votre ticket :</p>
                <h3>${data.ticketSubject}</h3>
                <div class="message-box">
                  <p style="margin: 0; white-space: pre-wrap;">${data.replyContent}</p>
                </div>
                <p>Connectez-vous pour voir la conversation complète.</p>
              </div>
              <div class="footer">
                <p>© Kapsul - Plateforme de formation en ligne</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "ticket_status_changed":
      return {
        subject: `📋 Statut mis à jour : ${data.ticketSubject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
              .status-badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
              .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Statut du ticket mis à jour</h1>
              </div>
              <div class="content">
                <p>Bonjour ${data.recipientName || ""},</p>
                <p>Le statut de votre ticket a été mis à jour :</p>
                <h3>${data.ticketSubject}</h3>
                <p>Nouveau statut : <span class="status-badge">${data.ticketStatus}</span></p>
              </div>
              <div class="footer">
                <p>© Kapsul - Plateforme de formation en ligne</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    default:
      throw new Error("Unknown email type");
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: EmailRequest = await req.json();
    console.log("Sending support email:", data.type, "to:", data.recipientEmail);

    const emailContent = getEmailContent(data);

    const emailResponse = await resend.emails.send({
      from: "Kapsul Support <lea@support.kapsulapp.io>",
      to: [data.recipientEmail],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-support-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
