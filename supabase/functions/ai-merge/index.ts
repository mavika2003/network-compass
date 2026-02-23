import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { contacts } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const contactSummary = contacts.map((c: any) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      email: c.email,
      jobTitle: c.jobTitle,
      categoryTags: c.categoryTags,
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
            content: `You are a data deduplication expert. Given a list of contacts, identify likely duplicates that should be merged. Look for:
1. Very similar names (e.g. "Columbia" vs "Columbia University", "John Smith" vs "John W. Smith")
2. Same email addresses
3. Same company + very similar name
For each duplicate pair, choose which contact to KEEP (the one with more data or the more complete/formal name) and which to MERGE INTO it.
Only suggest HIGH-CONFIDENCE duplicates. Return an empty array if none found.`,
          },
          {
            role: "user",
            content: `Contacts:\n${JSON.stringify(contactSummary, null, 2)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_merges",
              description: "Return suggested contact merges",
              parameters: {
                type: "object",
                properties: {
                  merges: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        keepId: { type: "string", description: "ID of contact to keep" },
                        mergeId: { type: "string", description: "ID of contact to merge into the kept one" },
                        keepName: { type: "string", description: "Name of contact to keep" },
                        mergeName: { type: "string", description: "Name of contact being merged" },
                        reason: { type: "string", description: "Why these are duplicates" },
                      },
                      required: ["keepId", "mergeId", "keepName", "mergeName", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["merges"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_merges" } },
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
    console.error("ai-merge error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
