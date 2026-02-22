import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // First, fetch all contacts for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, name, company, job_title, location, email, category_tags, notes, relationship_strength")
      .eq("user_id", userId);

    if (!contacts || contacts.length === 0) {
      return new Response(JSON.stringify({ matchedIds: [], summary: "No contacts found in your network." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contactSummary = contacts.map((c) =>
      `ID:${c.id} | ${c.name} | ${c.company || ''} | ${c.job_title || ''} | ${c.location || ''} | Tags:${(c.category_tags || []).join(',')} | Notes:${c.notes || ''}`
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
            content: `You are a smart contact search assistant. Given a natural language query and a list of contacts, find the matching contacts. Use fuzzy matching, semantic understanding, and inference. For example, "investors in NYC" should match contacts with Investors tag OR job titles like VC/Partner AND location containing NYC/New York.`,
          },
          {
            role: "user",
            content: `Query: "${query}"\n\nContacts:\n${contactSummary}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "search_results",
              description: "Return matching contact IDs and a brief summary",
              parameters: {
                type: "object",
                properties: {
                  matchedIds: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of matched contact IDs",
                  },
                  summary: {
                    type: "string",
                    description: "Brief natural language summary of the results",
                  },
                },
                required: ["matchedIds", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "search_results" } },
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
    console.error("ai-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
