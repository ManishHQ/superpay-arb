# Supabase Storage Setup Instructions

## 1. Create Storage Bucket

1. Go to your **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Set the following:
   - **Name**: `avatars`
   - **Public bucket**: ✅ **Yes** (checked)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**:
     ```
     image/jpeg,image/jpg,image/png,image/webp
     ```

## 2. Set up RLS Policies

After creating the bucket, go to **Storage** → **Policies** and add these policies:

### Policy 1: Allow authenticated users to upload

- **Policy name**: `Authenticated users can upload avatars`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  bucket_id = 'avatars'
  ```

### Policy 2: Allow authenticated users to update

- **Policy name**: `Authenticated users can update avatars`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  bucket_id = 'avatars'
  ```
- **WITH CHECK expression**:
  ```sql
  bucket_id = 'avatars'
  ```

### Policy 3: Allow authenticated users to delete

- **Policy name**: `Authenticated users can delete avatars`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  bucket_id = 'avatars'
  ```

### Policy 4: Allow public read access

- **Policy name**: `Public can view avatars`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **USING expression**:
  ```sql
  bucket_id = 'avatars'
  ```

## 3. Alternative: SQL Setup

Or run this SQL in your **SQL Editor**:

```sql
-- Create storage bucket (if using SQL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can update avatars" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can delete avatars" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');
```

Once you complete these steps, the avatar upload will work with Supabase Storage!
