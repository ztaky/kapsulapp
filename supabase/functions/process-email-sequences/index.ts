import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SequenceEnrollment {
  id: string;
  sequence_id: string;
  user_id: string;
  course_id: string | null;
  current_step: number;
  next_email_at: string | null;
  is_active: boolean;
}

interface SequenceStep {
  id: string;
  sequence_id: string;
  template_id: string;
  delay_hours: number;
  step_order: number;
}

interface EmailTemplate {
  id: string;
  subject: string;
  html_content: string;
  email_type: string;
}

interface Sequence {
  id: string;
  name: string;
  organization_id: string;
  is_active: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  try {
    console.log("Starting email sequence processing...");
    const now = new Date();

    // Get all active enrollments that are due for their next email
    const { data: dueEnrollments, error: enrollmentError } = await supabaseAdmin
      .from("sequence_enrollments")
      .select(`
        id,
        sequence_id,
        user_id,
        course_id,
        current_step,
        next_email_at,
        is_active
      `)
      .eq("is_active", true)
      .is("completed_at", null)
      .lte("next_email_at", now.toISOString());

    if (enrollmentError) {
      console.error("Error fetching enrollments:", enrollmentError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch enrollments" }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!dueEnrollments || dueEnrollments.length === 0) {
      console.log("No enrollments due for processing");
      return new Response(
        JSON.stringify({ processed: 0, message: "No enrollments due" }),
        { status: 200, headers: corsHeaders }
      );
    }

    console.log(`Found ${dueEnrollments.length} enrollments to process`);

    let processedCount = 0;
    let errorCount = 0;

    for (const enrollment of dueEnrollments as SequenceEnrollment[]) {
      try {
        console.log(`Processing enrollment ${enrollment.id}, step ${enrollment.current_step}`);

        // Get the sequence info
        const { data: sequence, error: seqError } = await supabaseAdmin
          .from("email_sequences")
          .select("id, name, organization_id, is_active")
          .eq("id", enrollment.sequence_id)
          .single();

        if (seqError || !sequence || !sequence.is_active) {
          console.log(`Sequence ${enrollment.sequence_id} not found or inactive, skipping`);
          continue;
        }

        // Get the step for current_step
        const { data: step, error: stepError } = await supabaseAdmin
          .from("email_sequence_steps")
          .select("id, template_id, delay_hours, step_order")
          .eq("sequence_id", enrollment.sequence_id)
          .eq("step_order", enrollment.current_step)
          .single();

        if (stepError || !step) {
          // No more steps, mark sequence as completed
          console.log(`No step found for order ${enrollment.current_step}, completing sequence`);
          await supabaseAdmin
            .from("sequence_enrollments")
            .update({
              is_active: false,
              completed_at: now.toISOString(),
            })
            .eq("id", enrollment.id);
          continue;
        }

        // Get template
        const { data: template, error: templateError } = await supabaseAdmin
          .from("email_templates")
          .select("id, subject, html_content, email_type")
          .eq("id", step.template_id)
          .single();

        if (templateError || !template) {
          console.error(`Template ${step.template_id} not found, skipping step`);
          errorCount++;
          continue;
        }

        // Get user info
        const { data: user, error: userError } = await supabaseAdmin
          .from("profiles")
          .select("email, full_name")
          .eq("id", enrollment.user_id)
          .single();

        if (userError || !user) {
          console.error(`User ${enrollment.user_id} not found, skipping`);
          errorCount++;
          continue;
        }

        // Get course info if available
        let courseName = "";
        if (enrollment.course_id) {
          const { data: course } = await supabaseAdmin
            .from("courses")
            .select("title")
            .eq("id", enrollment.course_id)
            .single();
          courseName = course?.title || "";
        }

        // Check email quota before sending
        const currentDate = new Date();
        const quotaMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        const { data: quotaResult, error: quotaError } = await supabaseAdmin.rpc('increment_email_usage', {
          _organization_id: sequence.organization_id,
          _month_year: quotaMonthYear,
          _amount: 1
        });

        if (quotaError) {
          console.error("Error checking email quota:", quotaError);
          // Continue anyway - don't block sequence due to quota check errors
        } else if (quotaResult && !quotaResult[0]?.success) {
          console.log(`Email quota exceeded for organization ${sequence.organization_id}, pausing enrollment ${enrollment.id}`);
          
          // Pause the enrollment due to quota exceeded
          await supabaseAdmin
            .from("sequence_enrollments")
            .update({
              is_active: false,
              completed_at: now.toISOString(),
            })
            .eq("id", enrollment.id);
          
          // Log the quota exceeded event
          await supabaseAdmin
            .from("email_sends")
            .insert({
              organization_id: sequence.organization_id,
              recipient_email: user.email,
              subject: `[QUOTA EXCEEDED] Sequence: ${sequence.name}`,
              status: "failed",
              error_message: "Email quota exceeded - sequence paused",
              metadata: { sequence_id: enrollment.sequence_id, quota_exceeded: true },
            });
          
          errorCount++;
          continue;
        }

        // Send email via send-transactional-email
        console.log(`Sending email to ${user.email} for sequence ${sequence.name}`);

        const emailResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-transactional-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              type: template.email_type || "custom",
              organizationId: sequence.organization_id,
              recipientEmail: user.email,
              recipientName: user.full_name || undefined,
              courseName: courseName || undefined,
              sequenceStepId: step.id,
              templateId: template.id,
            }),
          }
        );

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error(`Failed to send email: ${errorText}`);
          errorCount++;
          continue;
        }

        console.log(`Email sent successfully for enrollment ${enrollment.id}`);

        // Check if there's a next step
        const { data: nextStep } = await supabaseAdmin
          .from("email_sequence_steps")
          .select("step_order, delay_hours")
          .eq("sequence_id", enrollment.sequence_id)
          .eq("step_order", enrollment.current_step + 1)
          .single();

        if (nextStep) {
          // Calculate next email time
          const nextEmailAt = new Date(now.getTime() + nextStep.delay_hours * 60 * 60 * 1000);
          
          await supabaseAdmin
            .from("sequence_enrollments")
            .update({
              current_step: enrollment.current_step + 1,
              next_email_at: nextEmailAt.toISOString(),
            })
            .eq("id", enrollment.id);
            
          console.log(`Updated enrollment to step ${enrollment.current_step + 1}, next email at ${nextEmailAt.toISOString()}`);
        } else {
          // No more steps, mark as completed
          await supabaseAdmin
            .from("sequence_enrollments")
            .update({
              is_active: false,
              completed_at: now.toISOString(),
            })
            .eq("id", enrollment.id);
            
          console.log(`Sequence completed for enrollment ${enrollment.id}`);
        }

        processedCount++;
      } catch (enrollmentErr) {
        console.error(`Error processing enrollment ${enrollment.id}:`, enrollmentErr);
        errorCount++;
      }
    }

    console.log(`Processing complete. Processed: ${processedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        processed: processedCount,
        errors: errorCount,
        total: dueEnrollments.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-email-sequences:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
