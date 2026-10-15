// TODO(M1): replace the unsigned preset with signed uploads (see docs/TECHNICAL_DESIGN.md §5)
const CLOUDINARY_CLOUD_NAME = "dvhqbvsyb";
const CLOUDINARY_UPLOAD_PRESET = "campus_crush_unsigned";

// Uploads a local image ({ uri, mimeType }) and returns its https URL
export const uploadToCloudinary = async ({ uri, mimeType }) => {
  const extension = uri.split(".").pop()?.toLowerCase() || "jpg";
  const type =
    mimeType || `image/${extension === "jpg" ? "jpeg" : extension}`;

  const formData = new FormData();
  formData.append("file", { uri, type, name: `upload.${extension}` });
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  const data = await response.json();
  if (!data.secure_url) {
    throw new Error(data.error?.message || "Image upload failed");
  }
  return data.secure_url;
};

// Asks Cloudinary for a resized version so cards don't download full-size photos
export const resizedImageUrl = (url, width) =>
  url?.includes("/image/upload/")
    ? url.replace("/image/upload/", `/image/upload/c_fill,g_face,w_${width},q_auto,f_auto/`)
    : url;
