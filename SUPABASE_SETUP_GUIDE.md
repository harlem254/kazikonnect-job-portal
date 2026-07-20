# Supabase Storage Setup Guide for Profile Images

This guide outlines the required Supabase Storage and RLS (Row Level Security) policies to ensure profile images work correctly in your job portal application.

## Bucket Configuration

### Create Storage Bucket
1. Go to your Supabase project dashboard
2. Navigate to **Storage** → **Buckets**
3. Create a new bucket named: `profile-images`
4. Make the bucket **Public** (this is critical for images to be accessible)

### Bucket Settings
- **Bucket Name**: `profile-images`
- **Public Bucket**: ✅ Enabled
- **File Size Limit**: 5MB (recommended)
- **Allowed MIME Types**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`

## RLS (Row Level Security) Policies

Since the bucket is public, you need to set up appropriate RLS policies to control who can upload and manage files.

### Policy 1: Allow Public Read Access
This policy allows anyone to view images (required for profile pictures to display).

```sql
-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Policy: Allow public read access to profile-images bucket
create policy "Allow public read access for profile-images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'profile-images');
```

### Policy 2: Allow Authenticated Users to Upload
This policy allows logged-in users to upload their profile pictures.

```sql
-- Policy: Allow authenticated users to upload to profile-images bucket
create policy "Allow authenticated users to upload to profile-images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-images' 
  and auth.uid()::text = (storage.foldername(name))[1]
);
```

### Policy 3: Allow Users to Delete Their Own Files
This policy allows users to delete only their own uploaded files.

```sql
-- Policy: Allow users to delete their own files
create policy "Allow users to delete their own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-images' 
  and auth.uid()::text = (storage.foldername(name))[1]
);
```

### Alternative: Simplified Policies (Less Secure)
If you want simpler policies (less secure but easier to manage):

```sql
-- Allow all authenticated users to upload
create policy "Allow authenticated uploads to profile-images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'profile-images');

-- Allow all authenticated users to delete
create policy "Allow authenticated deletes in profile-images"
on storage.objects for delete
to authenticated
using (bucket_id = 'profile-images');
```

## CORS Configuration

### For Supabase Storage (Browser Access)
Supabase Storage automatically handles CORS for public buckets. However, if you encounter CORS issues:

1. Go to **Storage** → **Settings** in your Supabase dashboard
2. Add your frontend URL to **CORS allowed origins**:
   - Development: `http://localhost:5173`
   - Production: `https://your-domain.com`

### For Your Backend API
Ensure your backend `.env` file includes the correct CORS origin:

```env
CORS_ORIGIN=http://localhost:5173,https://your-production-domain.com
```

## Environment Variables

### Backend (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_STORAGE_BUCKET=profile-images
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_STORAGE_BUCKET=profile-images
```

## Troubleshooting

### Images Not Displaying
1. **Check bucket is public**: Ensure the bucket visibility is set to "Public"
2. **Verify RLS policies**: Ensure the SELECT policy allows public access
3. **Check URL format**: The backend should return full public URLs, not just file paths
4. **Browser console**: Check for CORS errors in the browser console

### Upload Failing
1. **Check INSERT policy**: Ensure authenticated users have insert permissions
2. **Verify bucket name**: Ensure `VITE_SUPABASE_STORAGE_BUCKET` matches your bucket name
3. **File size**: Ensure files are under 5MB limit
4. **File type**: Ensure only allowed MIME types are uploaded

### 403 Forbidden Errors
1. **RLS policies**: Check that your RLS policies are correctly configured
2. **Service role key**: Backend should use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for uploads
3. **Anon key**: Frontend should use `SUPABASE_ANON_KEY` for public access

## Verification

To verify your setup is working:

1. **Test Upload**: Upload a test image through your application
2. **Check Bucket**: Verify the file appears in Supabase Storage dashboard
3. **Test URL**: Access the public URL directly in a browser
4. **Test Display**: Verify the image displays on your profile page

## Security Best Practices

1. **Use Service Role Key on Backend**: The backend should use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS when uploading
2. **Limit File Size**: Enforce 5MB limit to prevent storage abuse
3. **Validate File Types**: Only allow image MIME types (jpeg, jpg, png, webp)
4. **Monitor Storage**: Regularly check storage usage in Supabase dashboard
5. **Rate Limiting**: Consider implementing rate limiting on upload endpoints
