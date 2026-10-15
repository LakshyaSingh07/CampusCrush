// Returns a signature that lets the signed-in user upload photos to their own
// Cloudinary folder. Replaces the unsigned upload preset, which let anyone
// upload anything to the account.
import { getCloudinaryConfig, getRequestUser, jsonResponse } from "../_shared/auth.ts";
import { signParams, userFolder } from "../_shared/cloudinary.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const user = await getRequestUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    // Signatures are valid for one hour from this timestamp
    const timestamp = Math.round(Date.now() / 1000);
    const folder = userFolder(user.id);
    const signature = await signParams({ folder, timestamp }, apiSecret);

    return jsonResponse({ signature, timestamp, folder, apiKey, cloudName });
  } catch (error) {
    console.error("sign-upload failed:", error.message);
    return jsonResponse({ error: error.message }, 400);
  }
});
