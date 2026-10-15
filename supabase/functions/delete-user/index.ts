// Deletes the signed-in user's account: Cloudinary photos, profile row (which
// cascades to swipes, matches, messages and push tokens) and the auth user.
import {
  getAdminClient,
  getCloudinaryConfig,
  getRequestUser,
  jsonResponse,
} from "../_shared/auth.ts";
import { deleteImages, extractPublicId } from "../_shared/cloudinary.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const user = await getRequestUser(req);
    if (!user) return jsonResponse({ error: "User not found" }, 401);

    const adminSupabase = getAdminClient();

    // 1. Delete the user's photos from Cloudinary
    const { data: profile, error: profileSelectError } = await adminSupabase
      .from("profiles")
      .select("profile_image_urls")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profileSelectError) throw profileSelectError;

    const publicIds = (profile?.profile_image_urls ?? [])
      .map((url: string) => extractPublicId(url))
      .filter(Boolean);
    if (publicIds.length > 0) {
      // Don't block account deletion if Cloudinary is unavailable
      try {
        const deleted = await deleteImages(publicIds, getCloudinaryConfig());
        console.log(`Deleted ${deleted}/${publicIds.length} images for ${user.id}`);
      } catch (e) {
        console.error("Cloudinary cleanup failed:", e.message);
      }
    }

    // 2. Delete the profile row (cascades to the user's other data)
    const { error: profileDeleteError } = await adminSupabase
      .from("profiles")
      .delete()
      .eq("user_id", user.id);
    if (profileDeleteError) throw profileDeleteError;

    // 3. Delete the auth user
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(user.id);
    if (authError) throw authError;

    return jsonResponse({ message: "User and all associated data deleted successfully" });
  } catch (error) {
    console.error("delete-user failed:", error.message);
    return jsonResponse({ error: error.message }, 400);
  }
});
