// Parse a free-text property description into structured fields using Lovable AI.
// Called by the owner from the property form.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const MODEL = 'google/gemini-2.5-flash';

const SYSTEM_PROMPT = `Tu es un assistant qui extrait des données structurées d'une description de bien immobilier en Afrique de l'Ouest (Burkina Faso, Mali, Ghana, etc.).
Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans texte autour.
Devine prudemment ; si une info n'est pas claire, mets null pour les chiffres ou false pour les booléens et ajoute le champ à "missing_fields".
Le titre suggéré doit être court (max 60 caractères) et accrocheur.`;

const RESPONSE_SCHEMA_HINT = `Format JSON attendu :
{
  "type": "villa_meublee|appartement|studio|maison|bureau|local|chambre|hotel|residence",
  "title_suggestion": "string",
  "bedrooms": number|null,
  "bathrooms": number|null,
  "surface_area": number|null,
  "price": number|null,
  "price_type": "nuit|mois",
  "quartier": "string|null",
  "furnished": boolean,
  "amenities": {
    "climatisation": boolean,
    "wifi": boolean,
    "groupe_electrogene": boolean,
    "vigile": boolean,
    "cloture": boolean,
    "piscine": boolean,
    "parking": boolean,
    "eau_courante": boolean,
    "jardin": boolean,
    "cameras": boolean,
    "panneaux_solaires": boolean,
    "terrasse": boolean,
    "cuisine_equipee": boolean,
    "tv": boolean,
    "machine_laver": boolean
  },
  "confidence": "high|medium|low",
  "missing_fields": ["string"]
}`;

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
    if (text.length < 20) {
      return new Response(JSON.stringify({ error: 'Description trop courte (min 20 caractères).' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
          { role: 'system', content: `${SYSTEM_PROMPT}\n\n${RESPONSE_SCHEMA_HINT}` },
          { role: 'user', content: `Description : "${text}"` },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      const status = aiRes.status;
      let msg = 'AI request failed';
      if (status === 429) msg = 'Trop de requêtes IA. Réessayez dans quelques instants.';
      else if (status === 402) msg = 'Crédits IA épuisés. Ajoutez des crédits depuis votre espace Lovable.';
      return new Response(JSON.stringify({ error: msg, detail: errText }), {
        status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await aiRes.json();
    const content = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed: any;
    try { parsed = JSON.parse(content); }
    catch {
      // Try to extract first {...} block
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }

    return new Response(JSON.stringify({ result: parsed }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
