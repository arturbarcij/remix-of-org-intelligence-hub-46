import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are an organizational intelligence analyst. Your job is to classify incoming signals (messages, meeting notes, emails) to understand their intent, urgency, and affected stakeholders.

Analyze the signal content and extract:
1. Primary intent (decision, task, fyi, risk, or conflict)
2. Confidence score (0-1)
3. Secondary intents if applicable
4. People mentioned with their roles and relevant citations
5. Teams affected
6. Topics/themes discussed
7. Systems or tools mentioned
8. Urgency level (critical, high, medium, low)

Be precise and cite specific text from the signal to support your classifications.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signal } = await req.json();
    
    if (!signal?.content) {
      return new Response(
        JSON.stringify({ error: "Signal content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `Classify this organizational signal:

Title: ${signal.title || "Untitled"}
Source: ${signal.source || "Unknown"}
Type: ${signal.type || "unknown"}
Content: ${signal.content}

Provide a comprehensive classification.`;

    console.log("Classifying signal:", signal.title || signal.id);

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
        tools: [
          {
            type: "function",
            function: {
              name: "classify_signal",
              description: "Classify an organizational signal by intent, urgency, and stakeholders",
              parameters: {
                type: "object",
                properties: {
                  primary: {
                    type: "object",
                    properties: {
                      intent: {
                        type: "string",
                        enum: ["decision", "task", "fyi", "risk", "conflict"],
                        description: "The primary intent of the signal",
                      },
                      confidence: {
                        type: "number",
                        minimum: 0,
                        maximum: 1,
                        description: "Confidence score for the primary classification",
                      },
                    },
                    required: ["intent", "confidence"],
                  },
                  secondary: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        intent: {
                          type: "string",
                          enum: ["decision", "task", "fyi", "risk", "conflict"],
                        },
                        confidence: { type: "number" },
                      },
                      required: ["intent", "confidence"],
                    },
                    description: "Secondary intents if applicable",
                  },
                  urgency: {
                    type: "string",
                    enum: ["critical", "high", "medium", "low"],
                    description: "Urgency level of the signal",
                  },
                  people: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        role: { type: "string" },
                        citation: { type: "string", description: "Relevant quote from the signal" },
                      },
                      required: ["name", "citation"],
                    },
                    description: "People mentioned in the signal",
                  },
                  teams: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        citation: { type: "string" },
                      },
                      required: ["name", "citation"],
                    },
                    description: "Teams affected by or mentioned in the signal",
                  },
                  topics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        citation: { type: "string" },
                      },
                      required: ["name", "citation"],
                    },
                    description: "Topics or themes in the signal",
                  },
                  systems: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        citation: { type: "string" },
                      },
                      required: ["name", "citation"],
                    },
                    description: "Systems or tools mentioned",
                  },
                  summary: {
                    type: "string",
                    description: "Brief 1-2 sentence summary of the signal",
                  },
                },
                required: ["primary", "urgency", "people", "teams", "topics", "summary"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_signal" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI classification failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Invalid AI response format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const classification = JSON.parse(toolCall.function.arguments);
    console.log("Classification complete:", classification.primary.intent, classification.urgency);

    return new Response(JSON.stringify({ classification }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Classification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
