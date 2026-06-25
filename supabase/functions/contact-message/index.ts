import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ContactPayload = {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  source_page?: string;
  user_agent?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function clean(value: unknown, max = 3000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function validate(payload: ContactPayload) {
  const name = clean(payload.name, 120);
  const email = clean(payload.email, 254).toLowerCase();
  const phone = clean(payload.phone, 40);
  const subject = clean(payload.subject, 120);
  const message = clean(payload.message, 3000);
  const source_page = clean(payload.source_page, 500);
  const user_agent = clean(payload.user_agent, 500);

  if (name.length < 2) return { error: "Jina lazima liwe na angalau herufi 2." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Barua pepe si sahihi." };
  if (message.length < 5) return { error: "Ujumbe hauwezi kuwa tupu." };

  return {
    value: {
      name,
      email,
      phone: phone || null,
      subject: subject || null,
      message,
      source_page: source_page || null,
      user_agent: user_agent || null,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Server configuration is incomplete." }, 500);
    }

    const payload = await req.json() as ContactPayload;
    const result = validate(payload);

    if ("error" in result) return jsonResponse({ error: result.error }, 422);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("contact_messages")
      .insert(result.value)
      .select("id, created_at")
      .single();

    if (error) {
      console.error("contact_messages insert failed", error);
      return jsonResponse({ error: "Ujumbe haukuweza kuhifadhiwa. Tafadhali jaribu tena." }, 500);
    }

    return jsonResponse({
      success: true,
      message: "Ujumbe umepokelewa. Tutakujibu ndani ya saa 4 za kazi.",
      id: data.id,
      created_at: data.created_at,
    }, 201);
  } catch (error) {
    console.error("contact-message error", error);
    return jsonResponse({ error: "Ombi halikuweza kuchakatwa. Tafadhali jaribu tena." }, 400);
  }
});
