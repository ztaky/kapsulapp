import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chunk-based base64 conversion to avoid stack overflow on large files
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, fileName, fileType } = await req.json();
    
    console.log(`Extracting content from: ${fileName} (${fileType})`);

    if (!fileUrl) {
      return new Response(
        JSON.stringify({ error: 'File URL is required', extractedText: '' }),
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
    
    console.log(`File fetched: ${fileBytes.length} bytes`);

    // Check file size limit (10MB for AI processing)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (fileBytes.length > MAX_SIZE) {
      console.log(`File too large for AI processing: ${fileBytes.length} bytes`);
      return new Response(
        JSON.stringify({ 
          error: 'File too large for processing (max 10MB)', 
          extractedText: '' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
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
    // For images, use OCR with AI
    else if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'tif'].includes(extension)) {
      // Use chunk-based base64 conversion to prevent stack overflow
      const base64Content = uint8ArrayToBase64(fileBytes);
      console.log(`Base64 conversion complete: ${base64Content.length} characters`);
      
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'tiff': 'image/tiff',
        'tif': 'image/tiff',
      };

      const mimeType = mimeTypes[extension] || 'image/jpeg';
      
      console.log(`Performing OCR on image: ${fileName}`);

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
              content: `Tu es un expert OCR (Reconnaissance Optique de Caractères). Analyse cette image et extrais:
              1. TOUT le texte visible (titres, paragraphes, légendes, labels, annotations)
              2. Description du contenu visuel important (graphiques, diagrammes, schémas)
              3. Structure du document si applicable
              
              Retourne le contenu de manière structurée. Si c'est un document, retranscris le texte fidèlement.
              Si c'est une image avec peu de texte, décris aussi le contenu visuel pertinent pour un cours.`
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Effectue un OCR complet et une analyse de cette image "${fileName}":`
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
        console.log(`OCR extracted ${extractedText.length} characters`);
      } else {
        const errorText = await aiResponse.text();
        console.error(`OCR failed: ${aiResponse.status} - ${errorText}`);
        
        // Handle rate limits and payment errors for OCR
        if (aiResponse.status === 429) {
          return new Response(
            JSON.stringify({ 
              error: 'Rate limit exceeded. Please try again later.', 
              extractedText: '' 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (aiResponse.status === 402) {
          return new Response(
            JSON.stringify({ 
              error: 'AI credits exhausted. Please add more credits.', 
              extractedText: '' 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }
    // For documents (PDF, DOCX, etc.), use AI to extract content
    else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
      // Use chunk-based base64 conversion to prevent stack overflow
      const base64Content = uint8ArrayToBase64(fileBytes);
      console.log(`Base64 conversion complete: ${base64Content.length} characters`);
      
      // Determine MIME type
      const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      };

      const mimeType = mimeTypes[extension] || 'application/octet-stream';
      
      console.log(`Sending ${extension} document to AI for extraction`);

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
              content: `Tu es un extracteur de contenu documentaire expert. Extrais et retourne le contenu principal du document:
              - Pour les PDF/Word: extrais tout le texte avec sa structure (titres, paragraphes, listes)
              - Pour les Excel: extrais les données sous forme de texte structuré (tableaux, valeurs)
              - Pour les PowerPoint: extrais le texte de chaque slide avec numérotation
              
              Retourne le contenu brut, structuré et lisible. Préserve la hiérarchie du document.`
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Extrais le contenu complet de ce document "${fileName}":`
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
        console.log(`Document extraction got ${extractedText.length} characters`);
      } else {
        const errorText = await aiResponse.text();
        console.error(`Document extraction failed: ${aiResponse.status} - ${errorText}`);
        
        if (aiResponse.status === 429) {
          return new Response(
            JSON.stringify({ 
              error: 'Rate limit exceeded. Please try again later.', 
              extractedText: '' 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (aiResponse.status === 402) {
          return new Response(
            JSON.stringify({ 
              error: 'AI credits exhausted. Please add more credits.', 
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
