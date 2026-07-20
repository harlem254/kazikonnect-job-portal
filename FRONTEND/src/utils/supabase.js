import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

const BUCKET_NAME = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'profile-images';

/**
 * Get the public URL for an image stored in Supabase Storage
 * @param {string} fileName - The name of the file in the bucket
 * @returns {string} - The public URL of the file
 */
export const getSupabaseImageUrl = (fileName) => {
  if (!fileName || !supabase) return '';
  
  // If the fileName is already a full URL, return it as-is
  if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
    return fileName;
  }
  
  try {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting Supabase image URL:', error);
    return fileName; // Fallback to original value
  }
};

export default supabase;
