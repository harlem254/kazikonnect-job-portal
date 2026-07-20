const supabase = require("./supabase");

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || "profile-images";

/**
 * Upload an image file to Supabase Storage
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} fileName - The name for the file in storage
 * @param {string} contentType - The MIME type of the file
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
const uploadImageToSupabase = async (fileBuffer, fileName, contentType) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading to Supabase Storage:", error);
    throw error;
  }
};

/**
 * Delete an image from Supabase Storage
 * @param {string} fileName - The name of the file to delete
 * @returns {Promise<void>}
 */
const deleteImageFromSupabase = async (fileName) => {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      console.error("Supabase storage delete error:", error);
      throw new Error(`Failed to delete from Supabase: ${error.message}`);
    }
  } catch (error) {
    console.error("Error deleting from Supabase Storage:", error);
    throw error;
  }
};

module.exports = {
  uploadImageToSupabase,
  deleteImageFromSupabase,
  BUCKET_NAME,
};
