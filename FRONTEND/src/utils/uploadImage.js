import API from "./ApiPath";

/**
 * Upload an image file to the server and return its URL.
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} - The hosted image URL
 */
const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const response = await fetch(API.UPLOAD_IMAGE, {
    method: "POST",
    headers: user?.token
      ? { Authorization: `Bearer ${user.token}` }
      : {},
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Image upload failed");
  }

  const data = await response.json();
  return data.imageUrl;
};

export default uploadImage;
