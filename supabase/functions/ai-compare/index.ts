import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { properties, priorities, freeText, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "compare") {
      systemPrompt = `Tu es un expert immobilier à Ouagadougou, Burkina Faso. Tu analyses des biens immobiliers pour aider les utilisateurs à prendre une décision. 
Tu dois comparer les biens fournis selon les critères donnés et produire un classement clair avec pourcentage de compatibilité.
Réponds TOUJOURS en JSON valide avec cette structure exacte:
{ "rankings": [{ "id": "...", "title": "...", "score": 85, "reasons": ["raison1", "raison2"] }], "summary": "conseil résumé en 2 phrases" }
Trie par score décroissant. Les scores doivent être entre 0 et 100.`;

      const propsDesc = properties.map((p: any) => 
        `ID:${p.id} | ${p.title} | ${p.type} | ${p.price} FCFA/mois | ${p.quartier} | ${p.bedrooms || '?'} ch | ${p.surface_area || '?'}m² | Confort:${p.comfort_rating || '?'}/5 | Sécurité:${p.security_rating || '?'}/5`
      ).join("\n");

      const criteriaDesc = priorities?.length
        ? `Priorités utilisateur: ${priorities.join(", ")}`
        : "Aucune priorité spécifique";

      userPrompt = `${criteriaDesc}\n\nBiens à comparer:\n${propsDesc}`;
    } else if (mode === "recommend") {
      systemPrompt = `Tu es un conseiller immobilier expert à Ouagadougou, Burkina Faso. L'utilisateur décrit ce qu'il cherche, et tu dois:
1. Reformuler sa demande en critères mesurables
2. Confirmer ta compréhension
3. Proposer une recommandation parmi les biens disponibles avec un score de compatibilité
Réponds TOUJOURS en JSON valide:
{ "understanding": "ce que j'ai compris de ta demande", "criteria": [{"label": "...", "value": "..."}], "recommendations": [{"id": "...", "title": "...", "score": 85, "explanation": "..."}], "tip": "conseil personnalisé" }`;

      const propsDesc = properties.map((p: any) => 
        `ID:${p.id} | ${p.title} | ${p.type} | ${p.price} FCFA/mois | ${p.quartier} | ${p.bedrooms || '?'} ch | ${p.surface_area || '?'}m² | Confort:${p.comfort_rating || '?'}/5 | Sécurité:${p.security_rating || '?'}/5`
      ).join("\n");

      const userInput = freeText || (priorities?.length ? `Mes priorités: ${priorities.join(", ")}` : "Je cherche le meilleur bien disponible");

      userPrompt = `Demande utilisateur: "${userInput}"\n\nBiens disponibles:\n${propsDesc}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans un moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    
    // Try to parse JSON from content
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      parsed = { error: "Format de réponse inattendu", raw: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-compare error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
