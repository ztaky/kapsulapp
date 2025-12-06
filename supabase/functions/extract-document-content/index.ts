import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, fileName, fileType } = await req.json();
    
    console.log(`Extracting content from: ${fileName} (${fileType})`);

    if (!fileUrl) {
      return new Response(
        JSON.stringify({ error: 'File URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the file content
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      console.error(`Failed to fetch file: ${fileResponse.status}`);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch file', extractedText: '' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);
    
    let extractedText = '';
    const extension = fileName.split('.').pop()?.toLowerCase() || fileType;

    // Use Lovable AI (Gemini) for document extraction - it supports multimodal input
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: 'API key not configured', extractedText: '' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For text-based files, try to extract text directly
    if (['txt', 'md', 'csv'].includes(extension)) {
      const decoder = new TextDecoder('utf-8');
      extractedText = decoder.decode(fileBytes);
      console.log(`Extracted ${extractedText.length} characters from text file`);
    } 
    // For documents, use AI to extract content
    else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
      // Convert to base64 for AI processing
      const base64Content = btoa(String.fromCharCode(...fileBytes));
      
      // Determine MIME type
      const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
      };

      const mimeType = mimeTypes[extension] || 'application/octet-stream';
      
      console.log(`Sending ${extension} file to AI for extraction (${fileBytes.length} bytes)`);

      // Use Gemini for document understanding
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Tu es un extracteur de contenu. Extrais et retourne UNIQUEMENT le texte/contenu principal du document fourni. 
              - Pour les PDF/Word: extrais tout le texte
              - Pour les Excel: extrais les données sous forme de texte structuré
              - Pour les PowerPoint: extrais le texte de chaque slide
              - Pour les images: décris le contenu et extrais tout texte visible
              
              Retourne le contenu brut sans commentaires ni formatage supplémentaire. Si tu ne peux pas extraire le contenu, retourne une chaîne vide.`
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Extrais le contenu textuel de ce fichier "${fileName}":`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Content}`
                  }
                }
              ]
            }
          ],
          max_tokens: 4000,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        extractedText = aiData.choices?.[0]?.message?.content || '';
        console.log(`AI extracted ${extractedText.length} characters`);
      } else {
        const errorText = await aiResponse.text();
        console.error(`AI extraction failed: ${aiResponse.status} - ${errorText}`);
        
        // For rate limits or payment issues, return empty but don't fail
        if (aiResponse.status === 429 || aiResponse.status === 402) {
          return new Response(
            JSON.stringify({ 
              error: aiResponse.status === 429 ? 'Rate limit exceeded' : 'Payment required',
              extractedText: '' 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Limit extracted text to prevent token overflow
    const MAX_CHARS = 10000;
    if (extractedText.length > MAX_CHARS) {
      extractedText = extractedText.substring(0, MAX_CHARS) + '\n\n[... contenu tronqué pour respecter les limites ...]';
      console.log(`Text truncated to ${MAX_CHARS} characters`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        extractedText,
        fileName,
        charactersExtracted: extractedText.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error extracting document content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', extractedText: '' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
