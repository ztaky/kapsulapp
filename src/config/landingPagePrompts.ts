/**
 * Prompts optimisés pour générer le contenu de chaque section
 * Compatible avec Gemini 3
 */

import { WizardData } from "@/components/landing/LandingPageWizard";

// Context global à injecter dans chaque prompt
export function buildGlobalContext(wizardData: WizardData): string {
  return `
CONTEXTE CLIENT :
- Nom formation : ${wizardData.courseName || "Formation"}
- ICP : ${wizardData.targetAudience}
- Formateur : ${wizardData.trainerName}
- Bio formateur : ${wizardData.trainerBio}

RÈGLES COPYWRITING :
- Ton : Direct, factuel, urgent sans être agressif
- Tutoiement systématique
- Phrases courtes (max 20 mots)
- Bénéfices > Features
- Chiffres concrets quand possible
- Zéro jargon technique
- Émotions : frustration → espoir → action

IMPORTANT : Retourne UNIQUEMENT un objet JSON valide, sans markdown, sans commentaires.
`;
}

// PROMPT SECTION HERO
export function getHeroPrompt(wizardData: WizardData): string {
  const globalContext = buildGlobalContext(wizardData);
  
  return `${globalContext}

Génère le contenu de la section HERO pour cette landing page.

OBJECTIF : Capturer l'attention immédiate + clarifier la promesse.

STRUCTURE JSON ATTENDUE :
{
  "preHeadline": "Une phrase d'accroche qui qualifie l'audience (Pour les X qui Y)",
  "headline": {
    "line1": "Timeframe précis (14 jours, 30 jours...)",
    "line2": "Résultat transformation concret (sera en gradient visuel)",
    "line3": "Bénéfice chiffré ou amplification (multiplier X par Y)"
  },
  "subheadline": "Méthode unique. Différenciateur. Garantie ou preuve.",
  "benefits": [
    "Bénéfice 1 avec chiffre ou timeframe (15-20h/semaine)",
    "Bénéfice 2 amplification impact (décupler, transformer)",
    "Bénéfice 3 social proof ou résultat (testé par X entrepreneurs)"
  ],
  "cta": {
    "text": "Action + Résultat + Timeframe (Je crée mon X en Y jours)",
    "price": "497€"
  },
  "testimonialSnippet": {
    "stars": 5,
    "text": "Citation courte impact (10-15 mots max)",
    "author": "Prénom, secteur activité"
  }
}

EXEMPLES :
PreHeadline: "Pour les dirigeants débordés qui veulent se mettre à l'IA mais ne savent pas par où commencer"
Headline line2: "Assistant IA & Co-Créateur IA"
Benefit: "Un assistant IA opérationnel qui te libère 15-20h/semaine dès le jour 8"

GÉNÈRE LE JSON MAINTENANT :`;
}

// PROMPT SECTION AGITATION
export function getAgitationPrompt(wizardData: WizardData): string {
  const globalContext = buildGlobalContext(wizardData);
  
  return `${globalContext}

Génère le contenu de la section AGITATION.

OBJECTIF : Amplifier la douleur + créer urgence de changement.

STRUCTURE JSON ATTENDUE :
{
  "headline": "Question rhétorique qui expose 2 douleurs (OU/ET pattern)",
  "subheadline": "Parenthèse empathique qui normalise la confusion",
  "painPoints": [
    {
      "icon": "warning",
      "text": "Pain point avec chiffre concret (40h/semaine, 5698 emails...)"
    }
    // ... 5 autres (total 6)
  ]
}

RÈGLES PAIN POINTS :
- Utiliser "Tu" direct + verbe présent
- Inclure chiffre ou métrique quand possible
- Format : Situation + Amplification + Conséquence

COUVRIR CES 6 THÈMES :
1. Surcharge opérationnelle (emails, admin)
2. Manque de temps stratégique (prospection, création)
3. Création contenu difficile
4. Veille concurrentielle anxiogène
5. Connaissance théorique IA mais pas pratique
6. Peur de se faire dépasser / obsolescence

EXEMPLE :
"Boîte email à 5698 messages - Tu n'es plus capable de répondre aux urgents et tu passes à côté de clients potentiels"

GÉNÈRE LE JSON MAINTENANT :`;
}

// PROMPT SECTION SOLUTION TIMEFRAME
export function getSolutionTimeframePrompt(wizardData: WizardData): string {
  const globalContext = buildGlobalContext(wizardData);
  
  return `${globalContext}

Génère le contenu de la section SOLUTION TIMEFRAME.

OBJECTIF : Rassurer sur la faisabilité + prouver rapidité résultats.

STRUCTURE JSON ATTENDUE :
{
  "headline": "En [durée], résultat transformation concrète",
  "stats": [
    { "value": "30 minutes", "label": "par jour" },
    { "value": "10 min", "label": "de théorie" },
    { "value": "20 min", "label": "de pratique" },
    { "value": "Résultats concrets", "label": "dès le jour 1" }
  ],
  "socialProof": "+300 entrepreneurs formés",
  "secretBox": {
    "title": "Le secret ?",
    "content": "Explication pédagogie unique (1-2 phrases)"
  }
}

EXEMPLE Secret Box :
"Ma pédagogie unique élimine ce qui bloque 90% des gens : la peur de mal faire et la surinformation théorique"

GÉNÈRE LE JSON MAINTENANT :`;
}

// PROMPT SECTION PÉDAGOGIE
export function getPedagogyPrompt(wizardData: WizardData): string {
  const globalContext = buildGlobalContext(wizardData);
  
  return `${globalContext}

Génère le contenu de la section PÉDAGOGIE (3 piliers).

OBJECTIF : Expliquer POURQUOI ta méthode fonctionne mieux.

STRUCTURE JSON ATTENDUE :
{
  "headline": "Pourquoi mes clients maîtrisent [skill] 3x plus vite que la moyenne ?",
  "subheadline": "Les 3 piliers de ma pédagogie",
  "pillars": [
    {
      "number": 1,
      "title": "Nom pilier 1 (2-3 mots)",
      "description": "Ce qui bloque la majorité (1 phrase)",
      "details": "Comment TOI tu résous ce blocage (2-3 phrases)"
    },
    {
      "number": 2,
      "title": "Nom pilier 2",
      "description": "Blocage",
      "details": "Solution"
    },
    {
      "number": 3,
      "title": "Nom pilier 3",
      "description": "Blocage",
      "details": "Solution"
    }
  ],
  "shockPhrase": "Pendant que les autres formations [mauvaise approche], toi tu [bonne approche] dès le jour 1."
}

LES 3 PILIERS DOIVENT COUVRIR :
1. Aspect PSYCHOLOGIQUE (peur, confiance)
2. Aspect MÉTHODOLOGIQUE (théorie vs pratique)
3. Aspect PERSONNALISATION (cas génériques vs ton business)

EXEMPLE Pilier 1 :
Title: "Zéro peur"
Description: "L'IA peut être intimidante. 73% des entrepreneurs n'osent pas se lancer."
Details: "Dans ma formation, on démystifie l'IA dès le jour 1. Tu comprends que c'est juste un outil, comme Excel."

GÉNÈRE LE JSON MAINTENANT :`;
}

// PROMPT SECTION PROGRAMME
export function getProgramPrompt(wizardData: WizardData): string {
  const globalContext = buildGlobalContext(wizardData);
  
  return `${globalContext}

Génère le contenu de la section PROGRAMME DÉTAILLÉ.

OBJECTIF : Montrer le chemin concret + créer envie avec livrables.

STRUCTURE JSON ATTENDUE :
{
  "headline": "Qu'est-ce qu'un [deliverable] concrètement",
  "subheadline": "Voici exactement ce que tu vas pouvoir faire après ces 14 jours",
  "aiTypes": [
    {
      "type": "TON ASSISTANT IA",
      "purpose": "pour tes tâches quotidiennes",
      "tasks": ["Tâche 1", "Tâche 2", "Tâche 3", "Tâche 4"]
    },
    {
      "type": "TON CO-CRÉATEUR IA",
      "purpose": "pour amplifier ton impact",
      "tasks": ["Tâche 1", "Tâche 2", "Tâche 3", "Tâche 4"]
    }
  ],
  "results": [
    "Résultat chiffré 1 (15-20h gagnées)",
    "Résultat chiffré 2 (31 tâches automatisées)",
    "Résultat chiffré 3 (60% productivité)",
    "Résultat qualitatif (clarté, sérénité)"
  ],
  "weeks": [
    {
      "number": 1,
      "title": "L'IA devient ton assistant opérationnel",
      "days": [
        {
          "day": "1-2",
          "title": "Les fondations",
          "content": "Ce que tu vas faire concrètement (2-3 phrases)"
        }
        // ... autres jours
      ]
    },
    {
      "number": 2,
      "title": "L'IA devient ton partenaire créatif",
      "days": []
    }
  ],
  "deliverables": [
    "Livrable 1 (ton X opérationnel)",
    "Livrable 2 (tes Y en BOOST)",
    "Livrable 3 (ton workflow automatisé)",
    "Livrable 4 (ta stratégie Z)",
    "Livrable 5 (ton avantage compétitif)"
  ]
}

Génère 7 jours par semaine (total 14 jours).

GÉNÈRE LE JSON MAINTENANT :`;
}

// PROMPT SECTION TÉMOIGNAGES
export function getTestimonialsPrompt(wizardData: WizardData): string {
  const globalContext = buildGlobalContext(wizardData);
  
  return `${globalContext}

Génère 6 témoignages crédibles.

OBJECTIF : Social proof authentique qui traite objections.

STRUCTURE JSON ATTENDUE :
{
  "headline": "Ils ont transformé leur business avec l'IA. Pourquoi pas toi ?",
  "stars": 5,
  "items": [
    {
      "quote": "Citation témoignage (25-40 mots)",
      "author": {
        "name": "Prénom",
        "role": "Métier Secteur",
        "photo": "placeholder"
      }
    }
    // ... 5 autres
  ],
  "cta": "Je rejoins les entrepreneurs qui ont changé leur quotidien avec l'IA"
}

LES 6 TÉMOIGNAGES DOIVENT TRAITER :
1. "Pas le temps" → Rapidité
2. "Trop technique" → Simplicité
3. "Mon secteur" → Secteur similaire
4. "Trop cher" → ROI
5. "Résultats pas garantis" → Transformation
6. "Je peux le faire seul" → Gain temps

EXEMPLE :
"J'étais sceptique vu mon planning de dingue. Mais 30 min/jour pendant 2 semaines, c'est gérable. Résultat : je gagne maintenant 12h/semaine."
Name: "Sarah", Role: "Coach Business"

GÉNÈRE LE JSON MAINTENANT :`;
}

// PROMPT SECTION FAQ
export function getFAQPrompt(wizardData: WizardData): string {
  const globalContext = buildGlobalContext(wizardData);
  
  return `${globalContext}

Génère 8 questions FAQ.

STRUCTURE JSON ATTENDUE :
{
  "headline": "Les Questions que tu te poses",
  "questions": [
    "Question 1 du point de vue client",
    "Question 2",
    // ... 6 autres
  ],
  "cta": "Je suis prêt(e) à gagner 20h/semaine avec l'IA"
}

LES 8 QUESTIONS OBLIGATOIRES :
1. "Je n'ai pas le temps de suivre une formation"
2. "C'est trop technique pour moi"
3. "C'est cher"
4. "L'IA va remplacer mon expertise"
5. "Et si j'ai déjà un business lancé ?"
6. "Je peux apprendre gratuitement sur YouTube"
7. "Il passe c'est trop tôt"
8. "Je vais commencer plus tard"

GÉNÈRE LE JSON MAINTENANT :`;
}

// PROMPT SECTION BONUS
export function getBonusPrompt(wizardData: WizardData): string {
  const globalContext = buildGlobalContext(wizardData);
  
  return `${globalContext}

Génère 4 bonus exclusifs.

STRUCTURE JSON ATTENDUE :
{
  "headline": "4 Bonus exclusifs offerts",
  "subheadline": "pour maximiser tes résultats",
  "items": [
    {
      "number": 1,
      "title": "Nom du bonus",
      "value": "197€",
      "description": "Bénéfice principal (1 phrase)",
      "content": "Contenu détaillé : X prompts, Y templates..."
    }
    // ... 3 autres
  ],
  "cta": "J'accède à la formation + 4 bonus"
}

LES 4 BONUS DOIVENT ÊTRE :
1. RESSOURCES : Templates/Prompts prêts à l'emploi
2. MASTERCLASS : Formation complémentaire
3. OUTILS : Liste outils IA + tutos
4. COMMUNAUTÉ : Accès groupe privé

Valeur entre 97€ et 297€ chacun.

GÉNÈRE LE JSON MAINTENANT :`;
}

// PROMPT SECTION GARANTIE
export function getGuaranteePrompt(wizardData: WizardData): string {
  const globalContext = buildGlobalContext(wizardData);
  
  return `${globalContext}

Génère le contenu GARANTIE.

STRUCTURE JSON ATTENDUE :
{
  "title": "Garantie 30 jours",
  "description": "Explication rassurante (2-3 phrases)",
  "riskPhrase": "Le seul risque : ne rien faire."
}

EXEMPLE :
Description: "Même si tu as accès aux 30 cours, même si tu appliques les méthodes... Si tu n'es pas satisfait, un email suffit. Remboursement intégral sans question."

GÉNÈRE LE JSON MAINTENANT :`;
}

// PROMPT SECTION FORMATEUR
export function getInstructorPrompt(wizardData: WizardData): string {
  const globalContext = buildGlobalContext(wizardData);
  
  return `${globalContext}

Génère le contenu FORMATEUR.

STRUCTURE JSON ATTENDUE :
{
  "headline": "Qui suis-je ?",
  "name": "${wizardData.trainerName}",
  "photo": "${wizardData.trainerPhoto || "placeholder"}",
  "credentials": [
    "Crédibilité 1 (années expérience)",
    "Crédibilité 2 (nombre clients)",
    "Crédibilité 3 (résultat chiffré)",
    "Crédibilité 4 (différenciateur unique)"
  ],
  "mission": "Ma mission en 1-2 phrases",
  "difference": "Ma différence en 2-3 phrases"
}

Utilise la bio fournie : ${wizardData.trainerBio}

EXEMPLE Credentials :
"23 ans d'entrepreneuriat (et oui, j'ai connu les échecs qui forgent)"
"Formation de +300 entrepreneurs aux méthodes IA éthiques"

GÉNÈRE LE JSON MAINTENANT :`;
}

// PROMPT SECTION PRICING
export function getPricingPrompt(wizardData: WizardData): string {
  const globalContext = buildGlobalContext(wizardData);
  
  return `${globalContext}

Génère le contenu PRICING.

STRUCTURE JSON ATTENDUE :
{
  "headline": "Pricing",
  "subheadline": "Paiement en 3 fois sans frais disponible",
  "offers": [
    {
      "name": "FORMATION PRINCIPALE",
      "price": 497,
      "ribbon": "Best seller",
      "ribbonColor": "red",
      "features": [
        "Formation complète (accès à vie)",
        "30 minutes par jour",
        "Résultats dès le jour 1",
        "Support pendant 60 jours",
        "+ 4 bonus offerts (valeur 738€)"
      ],
      "cta": "Je choisis la formation"
    }
  ]
}

GÉNÈRE LE JSON MAINTENANT :`;
}

// PROMPT SECTION FAQ FINALE
export function getFAQFinalPrompt(wizardData: WizardData): string {
  const globalContext = buildGlobalContext(wizardData);
  
  return `${globalContext}

Génère 2 questions FAQ finales.

STRUCTURE JSON ATTENDUE :
{
  "questions": [
    {
      "icon": "1",
      "question": "Le paiement en 3 fois est-il vraiment sans frais ?",
      "answer": "Oui ! Aucun frais caché. (2-3 phrases)"
    },
    {
      "icon": "2",
      "question": "Puis-je obtenir un devis pour mon entreprise ?",
      "answer": "Garantie 30 jours satisfait ou remboursé."
    }
  ]
}

GÉNÈRE LE JSON MAINTENANT :`;
}

// PROMPT SECTION FOOTER
export function getFooterPrompt(wizardData: WizardData): string {
  return `
Génère le contenu FOOTER.

STRUCTURE JSON ATTENDUE :
{
  "logo": "logo_url",
  "copyright": "Copyright 2025",
  "links": [
    { "text": "Mentions Légales", "url": "#" },
    { "text": "Politique de Confidentialité", "url": "#" },
    { "text": "Conditions Générales de Vente", "url": "#" }
  ]
}

GÉNÈRE LE JSON MAINTENANT :`;
}

// Export d'une fonction pour générer tout le contenu d'un coup
export async function generateAllSections(
  wizardData: WizardData,
  geminiFunction: (prompt: string) => Promise<string>
) {
  const sections = {
    hero: await geminiFunction(getHeroPrompt(wizardData)),
    agitation: await geminiFunction(getAgitationPrompt(wizardData)),
    solutionTimeframe: await geminiFunction(getSolutionTimeframePrompt(wizardData)),
    pedagogy: await geminiFunction(getPedagogyPrompt(wizardData)),
    program: await geminiFunction(getProgramPrompt(wizardData)),
    testimonials: await geminiFunction(getTestimonialsPrompt(wizardData)),
    faq: await geminiFunction(getFAQPrompt(wizardData)),
    bonus: await geminiFunction(getBonusPrompt(wizardData)),
    guarantee: await geminiFunction(getGuaranteePrompt(wizardData)),
    instructor: await geminiFunction(getInstructorPrompt(wizardData)),
    pricing: await geminiFunction(getPricingPrompt(wizardData)),
    faqFinal: await geminiFunction(getFAQFinalPrompt(wizardData)),
    footer: await geminiFunction(getFooterPrompt(wizardData)),
  };

  return sections;
}
