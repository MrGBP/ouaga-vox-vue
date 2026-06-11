// Parse a free-text property description into structured fields using Lovable AI.
// Called by the owner from the property form. Multilingual (fr/en).

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const MODEL = 'google/gemini-2.5-flash';

function buildSystemPrompt(countryCode: string, lang: 'fr' | 'en') {
  const isGH = countryCode === 'GH';
  const ctx = isGH
    ? `Country: Ghana. Currency GHS (₵). Furnished homes are commonly rented LONG TERM (6 months, 1 year+), so DEFAULT price_type to "mois" unless the description clearly mentions per-night/short-stay pricing.`
    : `Pays: ${countryCode === 'ML' ? 'Mali' : 'Burkina Faso'}. Devise FCFA. Les biens meublés sont le plus souvent loués à la nuitée (courte durée). Si la description parle clairement de "nuitée", "par nuit", "/nuit", "court séjour", "week-end" → price_type="nuit" et is_short_stay=true.`;

  if (lang === 'en') {
    return `You are an assistant that extracts structured data from a real-estate property description in West Africa (Ghana, Burkina Faso, Mali, etc.).
${ctx}

Reply ONLY with valid JSON, no markdown, no surrounding text.
Guess carefully; if unclear, use null for numbers / false for booleans and add the field to "missing_fields".

CRITICAL — description_cleaned:
- DO NOT paste back the user's raw text.
- Rewrite a clean, polished, well-punctuated description (60-180 words).
- Fix spelling, grammar, capitalisation, spacing.
- Keep the original meaning and key facts; remove price/contact details (they live in dedicated fields).
- Suggest improvements but stay faithful. The owner will validate before publishing.

Suggested title: short (max 60 chars), catchy, in the same language as the input.`;
  }

  return `Tu es un assistant qui extrait des données structurées d'une description de bien immobilier en Afrique de l'Ouest (Burkina Faso, Mali, Ghana, etc.).
${ctx}

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans texte autour.
Devine prudemment ; si une info n'est pas claire, mets null pour les chiffres ou false pour les booléens et ajoute le champ à "missing_fields".

IMPORTANT — description_cleaned :
- NE RECOPIE PAS le texte brut du propriétaire.
- Réécris une description propre, fluide, bien ponctuée (60-180 mots).
- Corrige l'orthographe, la grammaire, la casse, les espaces.
- Garde le sens et les faits clés ; retire prix/contacts (ils ont leurs propres champs).
- Propose des améliorations mais reste fidèle. Le propriétaire validera avant publication.

Titre suggéré : court (max 60 caractères), accrocheur, dans la langue du texte d'entrée.`;
}

const SCHEMA_HINT = `Expected JSON:
{
  "language": "fr|en",
  "type": "villa_meublee|appartement|appartement_meuble|studio|maison|bureau|local|chambre|hotel|residence",
  "title_suggestion": "string",
  "description_cleaned": "string (reformulated, corrected version of the user's text)",
  "bedrooms": number|null,
  "bathrooms": number|null,
  "surface_area": number|null,
  "price": number|null,
  "price_type": "nuit|mois",
  "is_short_stay": boolean,
  "rent_mode": "nuit|mois",
  "quartier": "string|null",
  "furnished": boolean,
  "amenities": {
    "climatisation": boolean, "wifi": boolean, "groupe_electrogene": boolean,
    "vigile": boolean, "cloture": boolean, "piscine": boolean, "parking": boolean,
    "eau_courante": boolean, "jardin": boolean, "cameras": boolean,
    "panneaux_solaires": boolean, "terrasse": boolean, "cuisine_equipee": boolean,
    "tv": boolean, "machine_laver": boolean
  },
  "confidence": "high|medium|low",
  "missing_fields": ["string"]
}`;

function detectLanguage(text: string): 'fr' | 'en' {
  const lower = ` ${text.toLowerCase()} `;
  const en = [' the ', ' and ', ' with ', ' bedroom', ' bathroom', ' kitchen', ' month', ' night', ' furnished', ' for rent', ' apartment '];
  const fr = [' le ', ' la ', ' les ', ' avec ', ' chambre', ' salle de bain', ' cuisine', ' mois', ' nuit', ' meublé', ' à louer', ' appartement '];
  let scoreEn = 0, scoreFr = 0;
  en.forEach(w => { if (lower.includes(w)) scoreEn++; });
  fr.forEach(w => { if (lower.includes(w)) scoreFr++; });
  return scoreEn > scoreFr ? 'en' : 'fr';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const text = String(body?.text ?? '').trim();
    const countryCode = String(body?.country_code ?? 'BF').toUpperCase();
    if (text.length < 20) {
      return new Response(JSON.stringify({ error: 'Description trop courte (min 20 caractères).' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lang: 'fr' | 'en' = countryCode === 'GH' ? 'en' : detectLanguage(text);
    const system = buildSystemPrompt(countryCode, lang) + '\n\n' + SCHEMA_HINT;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Lovable-API-Key': LOVABLE_API_KEY,
        'Content-Type': 'application/json',
        'X-Lovable-AIG-SDK': 'manual',
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: lang === 'en' ? `Description: "${text}"` : `Description : "${text}"` },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      const status = aiRes.status;
      let msg = 'AI request failed';
      if (status === 429) msg = lang === 'en' ? 'Too many AI requests. Try again in a moment.' : 'Trop de requêtes IA. Réessayez dans quelques instants.';
      else if (status === 402) msg = lang === 'en' ? 'AI credits exhausted. Add credits in your workspace.' : 'Crédits IA épuisés. Ajoutez des crédits depuis votre espace Lovable.';
      return new Response(JSON.stringify({ error: msg, detail: errText }), {
        status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await aiRes.json();
    const content = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed: any;
    try { parsed = JSON.parse(content); }
    catch {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }

    // Server-side guardrails: derive rent_mode if model omitted it
    if (!parsed.rent_mode) {
      if (countryCode === 'GH') parsed.rent_mode = parsed.is_short_stay ? 'nuit' : 'mois';
      else parsed.rent_mode = parsed.furnished ? (parsed.price_type === 'mois' ? 'mois' : 'nuit') : 'mois';
    }
    if (!parsed.language) parsed.language = lang;

    return new Response(JSON.stringify({ result: parsed }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
