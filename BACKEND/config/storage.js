const supabase = require("./supabase");

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET;

if (!BUCKET_NAME) {
    console.warn(
        "⚠️  SUPABASE_STORAGE_BUCKET is not set in .env — image uploads will fail."
    );
}

/**
 * Upload an image buffer to Supabase Storage and return its public URL.
 * @param {Buffer} fileBuffer  - Raw file bytes from multer memoryStorage
 * @param {string} fileName    - Unique filename to store in the bucket
 * @param {string} contentType - MIME type (e.g. "image/jpeg")
 * @returns {Promise<string>}  - Full public URL of the uploaded file
 */
const uploadImageToSupabase = async (fileBuffer, fileName, contentType) => {
    // Validate bucket is configured
    if (!BUCKET_NAME) {
        throw new Error("SUPABASE_STORAGE_BUCKET environment variable is not set");
    }

    // Upload the file
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, fileBuffer, {
            contentType,
            upsert: true, // overwrite if same filename exists
        });

    if (uploadError) {
        console.error("Supabase storage upload error:", uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get the public URL — NOTE: this always returns a URL string even if
    // the bucket is private. Make sure your bucket has a public policy in
    // the Supabase dashboard: Storage → Bucket → Policies → Allow public reads.
    const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

    if (!data?.publicUrl) {
        throw new Error("Supabase did not return a public URL for the uploaded file");
    }

    console.log(`✅  Image uploaded to Supabase: ${data.publicUrl}`);
    return data.publicUrl;
};

/**
 * Delete an image from Supabase Storage by its filename.
 * @param {string} fileName - The filename (not full URL) stored in the bucket
 */
const deleteImageFromSupabase = async (fileName) => {
    if (!BUCKET_NAME) return;

    // If a full URL was passed instead of just the filename, extract the filename
    const name = fileName.includes("/")
        ? fileName.split("/").pop()
        : fileName;

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([name]);

    if (error) {
        console.error("Supabase storage delete error:", error);
        throw new Error(`Storage delete failed: ${error.message}`);
    }
};

module.exports = { uploadImageToSupabase, deleteImageFromSupabase, BUCKET_NAME };
