import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to track AI credits
async function trackAICredits(organizationId: string): Promise<{ success: boolean; error?: string; nearLimit?: boolean }> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const { data, error } = await supabase.rpc('increment_ai_credits', {
      _organization_id: organizationId,
      _month_year: monthYear,
      _amount: 1
    });

    if (error) {
      console.error('[generate-interactive-tool] Error tracking AI credits:', error);
      return { success: false, error: error.message };
    }

    const result = data?.[0];
    if (result && !result.success) {
      return { success: false, error: 'AI_CREDITS_LIMIT_REACHED' };
    }

    const creditsUsed = result?.new_count || 0;
    const creditsLimit = result?.credits_limit || null;
    const nearLimit = creditsLimit ? (creditsUsed / creditsLimit) >= 0.8 : false;

    console.log(`[generate-interactive-tool] AI credits: ${creditsUsed}/${creditsLimit || 'unlimited'} (nearLimit: ${nearLimit})`);
    return { success: true, nearLimit };
  } catch (error) {
    console.error('[generate-interactive-tool] Error in trackAICredits:', error);
    return { success: false, error: 'Internal error' };
  }
}

const SYSTEM_PROMPT = `Tu es un expert en création d'outils interactifs pédagogiques HTML/CSS/JavaScript pour des formations en ligne.

RÈGLES STRICTES :
1. Génère UNIQUEMENT du HTML valide avec CSS inline et JavaScript inline
2. L'outil doit être ENTIÈREMENT autonome (pas de dépendances externes, pas de CDN)
3. Design moderne, professionnel et responsive avec des couleurs agréables
4. Interface accessible et intuitive pour tous les utilisateurs
5. Pas de frameworks, juste du HTML/CSS/JS pur
6. Le code doit être sécurisé (pas d'eval, pas de innerHTML non sanitisé pour les entrées utilisateur)
7. Utilise des styles inline ou une balise <style> dans le HTML
8. Le JavaScript doit être dans une balise <script> à la fin
9. Inclus des validations d'entrées utilisateur
10. Ajoute des feedbacks visuels clairs (succès, erreur, états de chargement)

FORMAT DE SORTIE :
Retourne UNIQUEMENT le code HTML complet, sans explication, sans markdown, sans backticks.
Le code doit commencer directement par <style> ou <div>.

===== EXEMPLES CONCRETS =====

EXEMPLE 1 - Quiz Interactif :
<style>
  .quiz-container { font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; }
  .quiz-question { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
  .quiz-options { display: flex; flex-direction: column; gap: 10px; }
  .quiz-option { background: #f8f9fa; border: 2px solid #e9ecef; padding: 15px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
  .quiz-option:hover { border-color: #667eea; background: #f0f1ff; }
  .quiz-option.selected { border-color: #667eea; background: #e8eaff; }
  .quiz-option.correct { border-color: #28a745; background: #d4edda; }
  .quiz-option.incorrect { border-color: #dc3545; background: #f8d7da; }
  .quiz-btn { background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin-top: 15px; }
  .quiz-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .quiz-result { padding: 20px; border-radius: 12px; margin-top: 20px; text-align: center; font-weight: bold; }
  .quiz-result.success { background: #d4edda; color: #155724; }
  .quiz-result.failure { background: #f8d7da; color: #721c24; }
</style>
<div class="quiz-container">
  <div id="quiz-content"></div>
</div>
<script>
  const questions = [
    { q: "Quelle est la capitale de la France ?", options: ["Lyon", "Paris", "Marseille", "Bordeaux"], correct: 1 },
    { q: "Combien font 2 + 2 ?", options: ["3", "4", "5", "6"], correct: 1 }
  ];
  let currentQ = 0, score = 0, selected = null;
  function render() {
    if (currentQ >= questions.length) {
      const pct = Math.round((score / questions.length) * 100);
      document.getElementById('quiz-content').innerHTML = '<div class="quiz-result ' + (pct >= 50 ? 'success' : 'failure') + '">Score : ' + score + '/' + questions.length + ' (' + pct + '%)</div><button class="quiz-btn" onclick="restart()">Recommencer</button>';
      return;
    }
    const q = questions[currentQ];
    let html = '<div class="quiz-question"><strong>Question ' + (currentQ + 1) + '/' + questions.length + '</strong><p>' + q.q + '</p></div><div class="quiz-options">';
    q.options.forEach((o, i) => { html += '<div class="quiz-option" onclick="selectOption(' + i + ')" id="opt-' + i + '">' + o + '</div>'; });
    html += '</div><button class="quiz-btn" id="validateBtn" onclick="validate()" disabled>Valider</button>';
    document.getElementById('quiz-content').innerHTML = html;
  }
  function selectOption(i) { selected = i; document.querySelectorAll('.quiz-option').forEach((el, idx) => el.classList.toggle('selected', idx === i)); document.getElementById('validateBtn').disabled = false; }
  function validate() { const q = questions[currentQ]; document.querySelectorAll('.quiz-option').forEach((el, i) => { el.classList.add(i === q.correct ? 'correct' : (i === selected ? 'incorrect' : '')); el.style.pointerEvents = 'none'; }); if (selected === q.correct) score++; document.getElementById('validateBtn').textContent = 'Suivant'; document.getElementById('validateBtn').onclick = () => { currentQ++; selected = null; render(); }; }
  function restart() { currentQ = 0; score = 0; selected = null; render(); }
  render();
</script>

EXEMPLE 2 - Calculateur avec Résultat :
<style>
  .calc-container { font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; }
  .calc-title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; text-align: center; }
  .calc-group { margin-bottom: 20px; }
  .calc-label { display: block; font-weight: 600; color: #555; margin-bottom: 8px; }
  .calc-input { width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: border-color 0.2s; }
  .calc-input:focus { outline: none; border-color: #4CAF50; }
  .calc-btn { width: 100%; background: linear-gradient(135deg, #4CAF50, #45a049); color: white; border: none; padding: 15px; border-radius: 8px; font-size: 18px; cursor: pointer; transition: transform 0.2s; }
  .calc-btn:hover { transform: scale(1.02); }
  .calc-result { margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #e8f5e9, #c8e6c9); border-radius: 12px; text-align: center; }
  .calc-result-value { font-size: 36px; font-weight: bold; color: #2e7d32; }
  .calc-result-label { color: #558b2f; margin-top: 5px; }
  .calc-error { color: #d32f2f; font-size: 14px; margin-top: 5px; }
</style>
<div class="calc-container">
  <div class="calc-title">📊 Calculateur d'IMC</div>
  <div class="calc-group">
    <label class="calc-label">Poids (kg)</label>
    <input type="number" id="weight" class="calc-input" placeholder="Ex: 70" min="20" max="300">
    <div id="weight-error" class="calc-error"></div>
  </div>
  <div class="calc-group">
    <label class="calc-label">Taille (cm)</label>
    <input type="number" id="height" class="calc-input" placeholder="Ex: 175" min="100" max="250">
    <div id="height-error" class="calc-error"></div>
  </div>
  <button class="calc-btn" onclick="calculate()">Calculer mon IMC</button>
  <div id="result" class="calc-result" style="display:none;"></div>
</div>
<script>
  function calculate() {
    const w = parseFloat(document.getElementById('weight').value);
    const h = parseFloat(document.getElementById('height').value);
    let valid = true;
    document.getElementById('weight-error').textContent = '';
    document.getElementById('height-error').textContent = '';
    if (!w || w < 20 || w > 300) { document.getElementById('weight-error').textContent = 'Entrez un poids valide (20-300 kg)'; valid = false; }
    if (!h || h < 100 || h > 250) { document.getElementById('height-error').textContent = 'Entrez une taille valide (100-250 cm)'; valid = false; }
    if (!valid) return;
    const imc = (w / Math.pow(h / 100, 2)).toFixed(1);
    let interp = '';
    if (imc < 18.5) interp = 'Insuffisance pondérale';
    else if (imc < 25) interp = 'Corpulence normale';
    else if (imc < 30) interp = 'Surpoids';
    else interp = 'Obésité';
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div class="calc-result-value">' + imc + '</div><div class="calc-result-label">' + interp + '</div>';
  }
</script>

EXEMPLE 3 - Checklist Interactive :
<style>
  .checklist-container { font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; }
  .checklist-header { background: linear-gradient(135deg, #ff6b6b, #ee5a5a); color: white; padding: 20px; border-radius: 12px 12px 0 0; }
  .checklist-title { font-size: 20px; font-weight: bold; margin: 0; }
  .checklist-progress { margin-top: 10px; background: rgba(255,255,255,0.3); border-radius: 10px; height: 8px; }
  .checklist-progress-bar { background: white; height: 100%; border-radius: 10px; transition: width 0.3s; }
  .checklist-items { background: #fff; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px; }
  .checklist-item { display: flex; align-items: center; padding: 15px 20px; border-bottom: 1px solid #f0f0f0; cursor: pointer; transition: background 0.2s; }
  .checklist-item:hover { background: #f9f9f9; }
  .checklist-item:last-child { border-bottom: none; }
  .checklist-checkbox { width: 24px; height: 24px; border: 2px solid #ddd; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .checklist-item.checked .checklist-checkbox { background: #4CAF50; border-color: #4CAF50; }
  .checklist-item.checked .checklist-checkbox::after { content: '✓'; color: white; font-weight: bold; }
  .checklist-item.checked .checklist-text { text-decoration: line-through; color: #999; }
  .checklist-text { flex: 1; }
</style>
<div class="checklist-container">
  <div class="checklist-header"><h2 class="checklist-title">✅ Ma liste de tâches</h2><div class="checklist-progress"><div class="checklist-progress-bar" id="progress"></div></div><div id="progress-text" style="margin-top:5px;font-size:14px;">0/5 complétés</div></div>
  <div class="checklist-items" id="items"></div>
</div>
<script>
  const tasks = ['Réviser le chapitre 1', 'Faire les exercices', 'Regarder la vidéo', 'Prendre des notes', 'Faire le quiz final'];
  let checked = new Array(tasks.length).fill(false);
  function render() {
    const count = checked.filter(Boolean).length;
    document.getElementById('progress').style.width = (count / tasks.length * 100) + '%';
    document.getElementById('progress-text').textContent = count + '/' + tasks.length + ' complétés';
    document.getElementById('items').innerHTML = tasks.map((t, i) => '<div class="checklist-item ' + (checked[i] ? 'checked' : '') + '" onclick="toggle(' + i + ')"><div class="checklist-checkbox"></div><span class="checklist-text">' + t + '</span></div>').join('');
  }
  function toggle(i) { checked[i] = !checked[i]; render(); }
  render();
</script>

===== FIN DES EXEMPLES =====

Utilise ces exemples comme inspiration pour créer des outils similaires ou plus élaborés selon la demande.
Adapte toujours le style et les couleurs au contexte de la formation.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, organizationId, category, lessonContext, courseContext } = await req.json();

    if (!description) {
      return new Response(
        JSON.stringify({ error: 'Description requise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Track AI credits if organizationId is provided
    let nearLimit = false;
    if (organizationId) {
      const creditsResult = await trackAICredits(organizationId);
      if (!creditsResult.success && creditsResult.error === 'AI_CREDITS_LIMIT_REACHED') {
        return new Response(
          JSON.stringify({ error: 'Limite de crédits IA atteinte', code: 'AI_CREDITS_LIMIT_REACHED' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      nearLimit = creditsResult.nearLimit || false;
    }

    // Build contextual prompt
    let contextPrompt = '';
    if (courseContext) {
      contextPrompt += `\n\nCONTEXTE DU COURS:\n- Titre: ${courseContext.title || 'Non spécifié'}`;
      if (courseContext.description) contextPrompt += `\n- Description: ${courseContext.description}`;
      if (courseContext.specialty) contextPrompt += `\n- Spécialité: ${courseContext.specialty}`;
    }
    if (lessonContext) {
      contextPrompt += `\n\nCONTEXTE DE LA LEÇON:\n- Titre: ${lessonContext.title || 'Non spécifié'}`;
      if (lessonContext.objective) contextPrompt += `\n- Objectif: ${lessonContext.objective}`;
      if (lessonContext.content) contextPrompt += `\n- Contenu (extrait): ${lessonContext.content.substring(0, 500)}...`;
    }

    // Category-specific instructions
    let categoryInstructions = '';
    switch (category) {
      case 'quiz':
        categoryInstructions = `\n\nTYPE D'OUTIL DEMANDÉ: Quiz Interactif
Crée un quiz avec :
- Plusieurs questions avec choix multiples
- Validation des réponses avec feedback visuel (vert pour correct, rouge pour incorrect)
- Calcul et affichage du score final
- Possibilité de recommencer
- Animations subtiles pour les transitions`;
        break;
      case 'calculator':
        categoryInstructions = `\n\nTYPE D'OUTIL DEMANDÉ: Calculateur
Crée un calculateur avec :
- Champs de saisie avec validation
- Calculs précis avec formules appropriées
- Affichage clair des résultats
- Interprétation des résultats si pertinent
- Gestion des erreurs de saisie`;
        break;
      case 'checklist':
        categoryInstructions = `\n\nTYPE D'OUTIL DEMANDÉ: Checklist/Tracker
Crée une checklist avec :
- Liste d'éléments à cocher
- Barre de progression visuelle
- Sauvegarde de l'état (localStorage si possible)
- Animations de validation
- Compteur d'éléments complétés`;
        break;
      case 'simulator':
        categoryInstructions = `\n\nTYPE D'OUTIL DEMANDÉ: Simulateur/Visualisation
Crée un simulateur avec :
- Contrôles interactifs (sliders, boutons)
- Visualisation dynamique des résultats
- Feedback en temps réel
- Explication des paramètres
- Interface intuitive`;
        break;
      case 'form':
        categoryInstructions = `\n\nTYPE D'OUTIL DEMANDÉ: Formulaire Interactif
Crée un formulaire avec :
- Champs de saisie variés (texte, select, radio, etc.)
- Validation en temps réel
- Messages d'erreur clairs
- Récapitulatif des réponses
- Design moderne et accessible`;
        break;
      case 'game':
        categoryInstructions = `\n\nTYPE D'OUTIL DEMANDÉ: Mini-jeu Éducatif
Crée un mini-jeu avec :
- Mécaniques de jeu simples mais engageantes
- Système de score ou progression
- Feedback immédiat sur les actions
- Possibilité de rejouer
- Aspect pédagogique clair`;
        break;
    }

    const userPrompt = `Crée un outil interactif pédagogique avec les spécifications suivantes :

${description}
${categoryInstructions}
${contextPrompt}

L'outil doit être intuitif, visuellement attrayant et parfaitement fonctionnel. Génère le code HTML complet.`;

    console.log('[generate-interactive-tool] Generating with context:', { 
      hasCategory: !!category, 
      hasCourseContext: !!courseContext, 
      hasLessonContext: !!lessonContext 
    });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 10000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requêtes atteinte, réessayez dans quelques minutes' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédits insuffisants, veuillez recharger votre compte' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Erreur du service IA');
    }

    const data = await response.json();
    let generatedCode = data.choices?.[0]?.message?.content || '';

    // Nettoyer le code (enlever les backticks markdown si présents)
    generatedCode = generatedCode
      .replace(/^```html?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();

    console.log('Generated tool code length:', generatedCode.length);

    return new Response(
      JSON.stringify({ code: generatedCode, nearLimit }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating tool:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});