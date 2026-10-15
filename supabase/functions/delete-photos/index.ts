// Deletes photos the user removed from their profile.
// Body: { urls: string[] }. Only deletes photos inside the user's own upload
// folder that are no longer on their profile.
import {
  getAdminClient,
  getCloudinaryConfig,
  getRequestUser,
  jsonResponse,
} from "../_shared/auth.ts";
import { deleteImages, extractPublicId, userFolder } from "../_shared/cloudinary.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const user = await getRequestUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { urls } = await req.json();
    if (!Array.isArray(urls)) return jsonResponse({ error: "urls must be an array" }, 400);

    const { data: profile, error } = await getAdminClient()
      .from("profiles")
      .select("profile_image_urls")
      .eq("user_id", user.id)
      .single();
    if (error) throw error;

    const current = new Set(profile?.profile_image_urls ?? []);
    const ownPrefix = `${userFolder(user.id)}/`;
    const publicIds = urls
      .filter((url: unknown) => typeof url === "string" && !current.has(url))
      .map((url: string) => extractPublicId(url))
      .filter((id): id is string => !!id && id.startsWith(ownPrefix));

    const deleted = publicIds.length
      ? await deleteImages(publicIds, getCloudinaryConfig())
      : 0;
    return jsonResponse({ deleted });
  } catch (error) {
    console.error("delete-photos failed:", error.message);
    return jsonResponse({ error: error.message }, 400);
  }
});
