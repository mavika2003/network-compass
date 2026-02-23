import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { contacts, existingConnections, userPrompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const contactSummary = contacts.map((c: any) => ({
      id: c.id,
      name: c.name,
      tags: c.categoryTags,
      company: c.company,
      jobTitle: c.jobTitle,
      strength: c.relationshipStrength,
    }));

    // Send existing connections with names so AI can reference them for remove/modify
    const existingWithNames = (existingConnections || []).map((c: any) => {
      const a = contacts.find((ct: any) => ct.id === c.contactAId);
      const b = contacts.find((ct: any) => ct.id === c.contactBId);
      return {
        id: c.id,
        contactAId: c.contactAId,
        contactBId: c.contactBId,
        contactAName: a?.name || "Unknown",
        contactBName: b?.name || "Unknown",
        relationshipType: c.relationshipType,
      };
    });

    const existingPairs = existingWithNames.map((c: any) => `${c.contactAId}-${c.contactBId}`);

    const systemPrompt = userPrompt
      ? `You are a relationship manager. The user has given you a SPECIFIC instruction: "${userPrompt}".

Interpret this instruction and return the appropriate actions. You can:
- "add" new connections between contacts
- "remove" existing connections
- "modify" existing connections (change their relationship type)

For remove/modify, reference the existing connections list provided. Match contacts by name when the user refers to them.
ONLY perform actions that directly match the user's instruction. Do NOT add general connections unless asked.
Return up to 20 actions.`
      : `You are a relationship analyst. Given a list of contacts with their tags, companies, job titles, and relationship strengths, suggest meaningful NEW connections between them. Only suggest connections that DON'T already exist. Focus on:
1. Contacts sharing the same tags (most important)
2. Contacts at the same company
3. Contacts with complementary roles (e.g. mentor-mentee)
Return up to 10 suggestions. Use action type "add" for all suggestions.`;

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
          {
            role: "user",
            content: `Contacts:\n${JSON.stringify(contactSummary, null, 2)}\n\nExisting connections:\n${JSON.stringify(existingWithNames, null, 2)}\n\nExisting pairs to skip for new adds:\n${JSON.stringify(existingPairs)}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "manage_connections",
              description: "Return connection actions (add, remove, or modify)",
              parameters: {
                type: "object",
                properties: {
                  actions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["add", "remove", "modify"], description: "Action type" },
                        contactAId: { type: "string", description: "ID of first contact" },
                        contactBId: { type: "string", description: "ID of second contact" },
                        relationshipType: { type: "string", enum: ["friend", "colleague", "mutual", "mentor"], description: "Relationship type (required for add/modify)" },
                        reason: { type: "string", description: "Brief reason for this action" },
                      },
                      required: ["type", "contactAId", "contactBId", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["actions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "manage_connections" } },
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
    console.error("ai-connections error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
