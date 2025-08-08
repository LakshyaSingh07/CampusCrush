import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // This is needed for CORS to allow requests from your app
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the user's authorization
    const userSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the user from the token
    const {
      data: { user },
    } = await userSupabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Create a Supabase client with the service_role key to bypass RLS
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // In a real app, you would also delete from swipes, matches, etc.
    // For now, we delete the main profile.
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .delete()
      .eq("user_id", user.id);

    if (profileError) {
      throw profileError;
    }

    // Finally, delete the user from the auth.users table
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(
      user.id
    );

    if (authError) {
      throw authError;
    }

    return new Response(
      JSON.stringify({ message: "User deleted successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
