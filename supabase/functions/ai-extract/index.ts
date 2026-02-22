import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, existingTags } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const tagList = (existingTags || []).join(", ");

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
            content: `You are a contact information extractor. Given text (from voice transcription, pasted notes, or conversation), extract structured contact information.

IMPORTANT TAG RULES:
- The user already has these tags: [${tagList}]
- ALWAYS prefer reusing existing tags over creating new ones.
- If the context suggests a tag similar to an existing one (e.g. "Gym" when "Sports" exists, or "Coworker" when "Work" exists), use the existing tag instead.
- Only create a new tag if there is truly no similar existing tag.
- Tags can be about ANY life area: hobbies, social groups, sports, travel, music, community, school, neighbors — not just work.
- Estimate a relationship/priority strength from 0-100 based on how close or important the relationship seems from context.

Call the extract_contacts function with the extracted data.`,
          },
          { role: "user", content: text },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_contacts",
              description: "Extract structured contact information from text",
              parameters: {
                type: "object",
                properties: {
                  contacts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Full name" },
                        company: { type: "string", description: "Company or organization" },
                        jobTitle: { type: "string", description: "Job title or role" },
                        email: { type: "string", description: "Email address" },
                        phone: { type: "string", description: "Phone number" },
                        location: { type: "string", description: "City, state, or country" },
                        notes: { type: "string", description: "Any additional context or notes about the person" },
                        suggestedTags: {
                          type: "array",
                          items: { type: "string" },
                          description: "Category tags — prefer reusing from existing tags list. Can be lifestyle, hobby, social, or professional tags.",
                        },
                        relationshipStrength: {
                          type: "number",
                          description: "Estimated priority/relationship strength 0-100 based on context closeness",
                        },
                      },
                      required: ["name"],
                    },
                  },
                },
                required: ["contacts"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_contacts" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
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

    const contacts = JSON.parse(toolCall.function.arguments).contacts;

    return new Response(JSON.stringify({ contacts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-extract error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
