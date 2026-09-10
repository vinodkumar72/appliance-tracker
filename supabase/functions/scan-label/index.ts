// Supabase Edge Function: scan-label
// Receives a photo of an appliance label, extracts structured details with
// Claude vision, and returns them for form prefill.
//
// Deploy: Supabase dashboard → Edge Functions → Deploy new function →
//   name it exactly "scan-label", paste this file, Deploy.
// Secret:  Edge Functions → Secrets → add ANTHROPIC_API_KEY.

import Anthropic from "npm:@anthropic-ai/sdk";
import { z } from "npm:zod";
import { zodOutputFormat } from "npm:@anthropic-ai/sdk/helpers/zod";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APPLIANCE_TYPES = [
  "refrigerator",
  "hvac",
  "water-heater",
  "dishwasher",
  "washer",
  "dryer",
  "oven-range",
  "microwave",
  "garbage-disposal",
  "other",
] as const;

const LabelExtraction = z.object({
  brand: z.string().nullable(),
  model: z.string().nullable(),
  serialNumber: z.string().nullable(),
  applianceType: z.enum(APPLIANCE_TYPES).nullable(),
  suggestedName: z.string().nullable(),
});

const PROMPT = `This photo shows the rating/identification label of a household appliance.
Extract exactly what is printed on the label:
- brand: the manufacturer name (e.g. "Whirlpool", "GE", "Rheem")
- model: the model number as printed (often labeled MOD, MODEL, M/N)
- serialNumber: the serial number as printed (often labeled SER, SERIAL, S/N)
- applianceType: your best guess of what kind of appliance this label belongs to
- suggestedName: a short human-friendly name like "Whirlpool refrigerator"
Use null for anything you cannot read or that is not on the label.
Transcribe model and serial numbers character-for-character — do not "correct" them.`;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { imageBase64, mediaType } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return jsonResponse({ error: "imageBase64 is required" }, 400);
    }
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return jsonResponse(
        { error: "ANTHROPIC_API_KEY secret is not configured on this function" },
        500,
      );
    }

    const client = new Anthropic({ apiKey });
    const response = await client.messages.parse({
      // Haiku: vision-capable and ~10x cheaper than Opus — right-sized for
      // label extraction. Output is a tiny JSON object, so a small cap.
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType ?? "image/jpeg",
                data: imageBase64,
              },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(LabelExtraction) },
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return jsonResponse({ error: "Could not read the label from this photo" }, 422);
    }
    return jsonResponse(response.parsed_output);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: message }, 500);
  }
});
