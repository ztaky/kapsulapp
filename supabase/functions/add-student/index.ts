import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the requesting user is a coach of the organization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser } } = await supabase.auth.getUser(token);
    
    if (!requestingUser) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, fullName, organizationId } = await req.json();

    if (!email || !organizationId) {
      return new Response(JSON.stringify({ error: "Email et organization requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if requesting user is a coach of this organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("organization_id", organizationId)
      .single();

    if (membership?.role !== "coach") {
      // Also check if super_admin
      const { data: roleCheck } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", requestingUser.id)
        .eq("role", "super_admin")
        .single();

      if (!roleCheck) {
        return new Response(JSON.stringify({ error: "Accès refusé" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check student limit before adding
    const { data: limitCheck, error: limitError } = await supabase
      .rpc("check_student_limit", { _organization_id: organizationId });

    if (limitError) {
      console.error("Error checking student limit:", limitError);
      return new Response(JSON.stringify({ error: "Erreur lors de la vérification des limites" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const limit = limitCheck?.[0];
    if (limit && !limit.can_add) {
      console.log(`Student limit reached for org ${organizationId}: ${limit.current_count}/${limit.max_allowed}`);
      return new Response(JSON.stringify({ 
        error: `Limite d'étudiants atteinte (${limit.current_count}/${limit.max_allowed}). Passez à un plan supérieur pour ajouter plus d'étudiants.`,
        limitReached: true,
        currentCount: limit.current_count,
        maxAllowed: limit.max_allowed
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already exists by email
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .single();

    let userId: string;
    let isNewUser = false;

    if (existingProfile) {
      // User exists, check if already a member
      const { data: existingMember } = await supabase
        .from("organization_members")
        .select("id")
        .eq("user_id", existingProfile.id)
        .eq("organization_id", organizationId)
        .single();

      if (existingMember) {
        return new Response(JSON.stringify({ error: "Cet étudiant fait déjà partie de votre académie" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = existingProfile.id;
    } else {
      // Create new user with Supabase Admin API
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: fullName || "",
        },
      });

      if (createError || !newUser.user) {
        console.error("Error creating user:", createError);
        return new Response(JSON.stringify({ error: "Impossible de créer le compte utilisateur" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = newUser.user.id;
      isNewUser = true;

      // Send password reset email so user can set their password
      const { error: resetError } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email: email.toLowerCase(),
      });

      if (resetError) {
        console.error("Error sending recovery email:", resetError);
        // Don't fail the whole operation, user can use "forgot password" later
      }
    }

    // Add user as student to organization
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({
        user_id: userId,
        organization_id: organizationId,
        role: "student",
      });

    if (memberError) {
      console.error("Error adding member:", memberError);
      return new Response(JSON.stringify({ error: "Impossible d'ajouter l'étudiant à l'organisation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get updated count for response
    const { data: updatedLimit } = await supabase
      .rpc("check_student_limit", { _organization_id: organizationId });

    const newLimit = updatedLimit?.[0];

    console.log(`Student ${email} added to organization ${organizationId} by ${requestingUser.email}. Count: ${newLimit?.current_count}/${newLimit?.max_allowed || 'unlimited'}`);

    return new Response(JSON.stringify({ 
      success: true, 
      isNewUser,
      userId,
      message: isNewUser 
        ? "Étudiant créé et ajouté avec succès" 
        : "Étudiant ajouté avec succès",
      studentCount: newLimit?.current_count,
      maxStudents: newLimit?.max_allowed
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("add-student error:", error);
    return new Response(JSON.stringify({ error: "Erreur interne du serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});