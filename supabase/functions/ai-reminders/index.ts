import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, name, company, job_title, category_tags, relationship_strength, last_contacted_at, notes, created_at")
      .eq("user_id", userId);

    if (!contacts || contacts.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date().toISOString();
    const contactSummary = contacts.map((c) =>
      `ID:${c.id} | ${c.name} | ${c.company || ''} | ${c.job_title || ''} | Tags:${(c.category_tags || []).join(',')} | Strength:${c.relationship_strength || 50} | LastContact:${c.last_contacted_at || 'never'} | Added:${c.created_at} | Notes:${c.notes || ''}`
    ).join("\n");

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
            content: `You are a relationship intelligence assistant. Analyze the user's contacts and suggest who they should reconnect with. Prioritize:
1. High relationship strength contacts not contacted recently
2. Contacts never contacted since being added
3. Strategic contacts (Investors, Work) that benefit from regular touchpoints
4. Contacts whose last interaction was more than 2 weeks ago

For each suggestion, provide a personalized reason and a suggested action (message, call, coffee, etc). Current date: ${now}`,
          },
          {
            role: "user",
            content: `My contacts:\n${contactSummary}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_reconnections",
              description: "Return reconnection suggestions",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        contactId: { type: "string" },
                        contactName: { type: "string" },
                        reason: { type: "string", description: "Why they should reconnect" },
                        suggestedAction: { type: "string", description: "What to do: message, call, coffee, email" },
                        urgency: { type: "string", enum: ["high", "medium", "low"] },
                        suggestedMessage: { type: "string", description: "A draft message the user could send" },
                      },
                      required: ["contactId", "contactName", "reason", "suggestedAction", "urgency"],
                    },
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_reconnections" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
    console.error("ai-reminders error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
