import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_IP = "185.158.133.1";

interface DnsRecord {
  type: string;
  name: string;
  data: string;
}

async function checkDnsRecords(domain: string): Promise<{
  aRecordValid: boolean;
  wwwRecordValid: boolean;
  txtRecordValid: boolean;
  details: { type: string; status: string; expected: string; found: string }[];
}> {
  const details: { type: string; status: string; expected: string; found: string }[] = [];
  let aRecordValid = false;
  let wwwRecordValid = false;
  let txtRecordValid = false;

  try {
    // Check A record for root domain using DNS-over-HTTPS (Cloudflare)
    const aResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`,
      { headers: { Accept: "application/dns-json" } }
    );
    const aData = await aResponse.json();
    console.log(`A record response for ${domain}:`, JSON.stringify(aData));

    if (aData.Answer && aData.Answer.length > 0) {
      const aRecords = aData.Answer.filter((r: any) => r.type === 1).map((r: any) => r.data);
      aRecordValid = aRecords.includes(LOVABLE_IP);
      details.push({
        type: "A (@)",
        status: aRecordValid ? "valid" : "invalid",
        expected: LOVABLE_IP,
        found: aRecords.join(", ") || "Non trouvé",
      });
    } else {
      details.push({
        type: "A (@)",
        status: "missing",
        expected: LOVABLE_IP,
        found: "Non configuré",
      });
    }

    // Check A record for www subdomain
    const wwwResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=www.${domain}&type=A`,
      { headers: { Accept: "application/dns-json" } }
    );
    const wwwData = await wwwResponse.json();
    console.log(`A record response for www.${domain}:`, JSON.stringify(wwwData));

    if (wwwData.Answer && wwwData.Answer.length > 0) {
      const wwwRecords = wwwData.Answer.filter((r: any) => r.type === 1).map((r: any) => r.data);
      wwwRecordValid = wwwRecords.includes(LOVABLE_IP);
      details.push({
        type: "A (www)",
        status: wwwRecordValid ? "valid" : "invalid",
        expected: LOVABLE_IP,
        found: wwwRecords.join(", ") || "Non trouvé",
      });
    } else {
      details.push({
        type: "A (www)",
        status: "missing",
        expected: LOVABLE_IP,
        found: "Non configuré",
      });
    }

    // Check TXT record for verification
    const txtResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=_lovable.${domain}&type=TXT`,
      { headers: { Accept: "application/dns-json" } }
    );
    const txtData = await txtResponse.json();
    console.log(`TXT record response for _lovable.${domain}:`, JSON.stringify(txtData));

    const expectedTxt = `lovable_verify=${domain}`;
    if (txtData.Answer && txtData.Answer.length > 0) {
      const txtRecords = txtData.Answer
        .filter((r: any) => r.type === 16)
        .map((r: any) => r.data.replace(/"/g, ""));
      txtRecordValid = txtRecords.some((txt: string) => txt.includes(expectedTxt));
      details.push({
        type: "TXT (_lovable)",
        status: txtRecordValid ? "valid" : "invalid",
        expected: expectedTxt,
        found: txtRecords.join(", ") || "Non trouvé",
      });
    } else {
      details.push({
        type: "TXT (_lovable)",
        status: "missing",
        expected: expectedTxt,
        found: "Non configuré",
      });
    }
  } catch (error) {
    console.error("Error checking DNS records:", error);
    throw error;
  }

  return { aRecordValid, wwwRecordValid, txtRecordValid, details };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, domain } = await req.json();

    if (!organizationId || !domain) {
      return new Response(
        JSON.stringify({ error: "organizationId and domain are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Verifying DNS for domain: ${domain}, org: ${organizationId}`);

    // Check DNS records
    const dnsResult = await checkDnsRecords(domain);
    console.log("DNS verification result:", JSON.stringify(dnsResult));

    // Determine overall status
    const isVerified = dnsResult.aRecordValid && dnsResult.wwwRecordValid && dnsResult.txtRecordValid;
    const status = isVerified ? "verified" : "pending";

    // Update organization with verification status
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const updateData: any = {
      custom_domain_status: status,
    };

    if (isVerified) {
      updateData.custom_domain_verified_at = new Date().toISOString();
    }

    const { error: updateError } = await supabaseClient
      .from("organizations")
      .update(updateData)
      .eq("id", organizationId);

    if (updateError) {
      console.error("Error updating organization:", updateError);
      throw updateError;
    }

    console.log(`DNS verification complete for ${domain}. Status: ${status}`);

    return new Response(
      JSON.stringify({
        success: true,
        status,
        isVerified,
        details: dnsResult.details,
        checks: {
          aRecord: dnsResult.aRecordValid,
          wwwRecord: dnsResult.wwwRecordValid,
          txtRecord: dnsResult.txtRecordValid,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in verify-dns function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
