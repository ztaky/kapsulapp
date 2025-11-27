import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  type: "ticket_created" | "ticket_reply" | "ticket_status_changed";
  ticketId: string;
  recipientEmail: string;
  recipientName?: string;
  ticketSubject: string;
  ticketStatus?: string;
  replyContent?: string;
  fromAdmin?: boolean;
}

export async function sendSupportEmail(params: SendEmailParams) {
  try {
    const response = await supabase.functions.invoke("send-support-email", {
      body: params,
    });

    if (response.error) {
      console.error("Error sending support email:", response.error);
      return { success: false, error: response.error };
    }

    console.log("Support email sent successfully");
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error invoking send-support-email function:", error);
    return { success: false, error };
  }
}

export async function getAdminEmails(): Promise<{ email: string; name: string | null }[]> {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select(`
        user_id,
        profiles:user_id (email, full_name)
      `)
      .eq("role", "super_admin");

    if (error) throw error;

    return (data || []).map((item: any) => ({
      email: item.profiles?.email || "",
      name: item.profiles?.full_name || null,
    })).filter(item => item.email);
  } catch (error) {
    console.error("Error fetching admin emails:", error);
    return [];
  }
}
