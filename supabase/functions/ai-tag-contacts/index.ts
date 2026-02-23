import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { contacts, existingTags } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const contactSummary = contacts.map((c: any) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      jobTitle: c.jobTitle,
      email: c.email,
      notes: c.notes,
      location: c.location,
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a contact categorization expert. Given contact details, suggest 1-3 category tags per contact.

IMPORTANT RULES:
1. STRONGLY prefer reusing tags from the existing tags list: ${JSON.stringify(existingTags || [])}
2. Only create a NEW tag if absolutely no existing tag fits the contact's profile
3. Tags should be broad categories (e.g., "Work", "Friends", "Family", "Tech", "Investors") not specific descriptions
4. Also estimate a relationship strength score from 0-100 based on how much info is available (more data = higher score)
5. If you create new tags, keep them to single words or short phrases (max 2 words)`,
          },
          {
            role: "user",
            content: `Contacts to tag:\n${JSON.stringify(contactSummary, null, 2)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "tag_contacts",
              description: "Return suggested tags and relationship strength for each contact",
              parameters: {
                type: "object",
                properties: {
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", description: "Contact ID" },
                        suggestedTags: { type: "array", items: { type: "string" }, description: "1-3 category tags" },
                        relationshipStrength: { type: "number", description: "0-100 relationship strength estimate" },
                      },
                      required: ["id", "suggestedTags", "relationshipStrength"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["results"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "tag_contacts" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-tag-contacts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
