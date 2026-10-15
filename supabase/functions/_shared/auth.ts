import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

// Returns the user who made the request, or null if the JWT is missing/invalid
export const getRequestUser = async (req: Request) => {
  const userSupabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
  );
  const {
    data: { user },
  } = await userSupabase.auth.getUser();
  return user;
};

export const getAdminClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

export const getCloudinaryConfig = () => ({
  cloudName: Deno.env.get("CLOUDINARY_CLOUD_NAME") ?? "",
  apiKey: Deno.env.get("CLOUDINARY_API_KEY") ?? "",
  apiSecret: Deno.env.get("CLOUDINARY_API_SECRET") ?? "",
});
