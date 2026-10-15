// Cloudinary helpers shared by the edge functions. Kept free of Deno globals
// so they can be unit-tested with Node.

export type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

const sha1Hex = async (input: string) => {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// https://cloudinary.com/documentation/authentication_signatures
// Params are sorted by key, joined as k=v with &, then the secret is appended.
export const signParams = (params: Record<string, string | number>, apiSecret: string) => {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return sha1Hex(toSign + apiSecret);
};

// Each user's uploads go into their own folder, so ownership can be checked
// from the public_id alone.
export const userFolder = (userId: string) => `users/${userId}`;

// https://res.cloudinary.com/<cloud>/image/upload/v1712345678/users/<id>/abc.jpg
//   -> "users/<id>/abc"
export const extractPublicId = (url: string): string | null => {
  const match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i);
  return match ? decodeURIComponent(match[1]) : null;
};

// Deletes up to 100 images per request with the Admin API.
// Returns the number of public_ids Cloudinary reported as deleted.
export const deleteImages = async (publicIds: string[], config: CloudinaryConfig) => {
  let deleted = 0;
  for (let i = 0; i < publicIds.length; i += 100) {
    const batch = publicIds.slice(i, i + 100);
    const params = new URLSearchParams();
    batch.forEach((id) => params.append("public_ids[]", id));

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/resources/image/upload?${params}`,
      {
        method: "DELETE",
        headers: { Authorization: `Basic ${btoa(`${config.apiKey}:${config.apiSecret}`)}` },
      }
    );
    if (!response.ok) {
      console.error("Cloudinary delete failed:", response.status, await response.text());
      continue;
    }
    const result = await response.json();
    deleted += Object.values(result.deleted ?? {}).filter((s) => s === "deleted").length;
  }
  return deleted;
};
