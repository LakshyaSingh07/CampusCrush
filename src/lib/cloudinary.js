import { supabase } from "./supabase";

// Uploads are signed by the `sign-upload` edge function and go into the
// user's own folder (users/<user id>/), so the Cloudinary API secret never
// ships in the app.
const getUploadSignature = async () => {
  const { data, error } = await supabase.functions.invoke("sign-upload");
  if (error || !data?.signature) {
    throw new Error("Couldn't start the upload. Please try again.");
  }
  return data;
};

const uploadOne = async ({ uri, mimeType }, signed) => {
  const extension = uri.split(".").pop()?.toLowerCase() || "jpg";
  const type =
    mimeType || `image/${extension === "jpg" ? "jpeg" : extension}`;

  const formData = new FormData();
  formData.append("file", { uri, type, name: `upload.${extension}` });
  formData.append("api_key", signed.apiKey);
  formData.append("timestamp", String(signed.timestamp));
  formData.append("folder", signed.folder);
  formData.append("signature", signed.signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
    { method: "POST", body: formData }
  );
  const data = await response.json();
  if (!data.secure_url) {
    throw new Error(data.error?.message || "Image upload failed");
  }
  return data.secure_url;
};

// Uploads local images ({ uri, mimeType }) in parallel and returns their
// https URLs in the same order.
export const uploadPhotos = async (photos) => {
  if (photos.length === 0) return [];
  const signed = await getUploadSignature();
  return Promise.all(photos.map((photo) => uploadOne(photo, signed)));
};

// Removes photos the user took off their profile. Best effort: a failure
// only leaves an unused file in Cloudinary.
export const deleteRemovedPhotos = async (urls) => {
  if (urls.length === 0) return;
  const { error } = await supabase.functions.invoke("delete-photos", {
    body: { urls },
  });
  if (error) console.warn("Couldn't delete removed photos:", error.message);
};

// Asks Cloudinary for a resized version so cards don't download full-size photos
export const resizedImageUrl = (url, width) =>
  url?.includes("/image/upload/")
    ? url.replace("/image/upload/", `/image/upload/c_fill,g_face,w_${width},q_auto,f_auto/`)
    : url;
