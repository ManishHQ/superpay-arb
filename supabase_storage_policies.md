# Supabase Storage Policies for Avatars Bucket

## 🎯 **Add These Policies in Your Supabase Dashboard**

Go to: **Storage** → **Policies** → **AVATARS** → **New policy**

### 1. **INSERT Policy** (Allow Public Upload)

```sql
-- Policy Name: "Public can upload avatars"
-- Operation: INSERT
-- Target roles: public

-- Policy Definition:
true
```

### 2. **UPDATE Policy** (Allow Public Update)

```sql
-- Policy Name: "Public can update avatars"
-- Operation: UPDATE
-- Target roles: public

-- Policy Definition:
true
```

### 3. **DELETE Policy** (Allow Public Delete)

```sql
-- Policy Name: "Public can delete avatars"
-- Operation: DELETE
-- Target roles: public

-- Policy Definition:
true
```

## 📋 **Step-by-Step Instructions:**

1. **Go to Supabase Dashboard** → **Storage** → **Policies**
2. **Click on AVATARS bucket**
3. **Click "New policy"**
4. **For INSERT policy:**
   - Policy name: `Public can upload avatars`
   - Select **INSERT** operation
   - Target roles: **public**
   - Policy definition: `true`
   - Click **Save**

5. **Repeat for UPDATE policy:**
   - Policy name: `Public can update avatars`
   - Select **UPDATE** operation
   - Target roles: **public**
   - Policy definition: `true`
   - Click **Save**

6. **Repeat for DELETE policy:**
   - Policy name: `Public can delete avatars`
   - Select **DELETE** operation
   - Target roles: **public**
   - Policy definition: `true`
   - Click **Save**

## ✅ **Final Result Should Show:**

- ✅ **SELECT**: Public can view avatars
- ✅ **INSERT**: Public can upload avatars
- ✅ **UPDATE**: Public can update avatars
- ✅ **DELETE**: Public can delete avatars

## 🚀 **After Adding Policies:**

Try uploading an avatar again - it should work perfectly!
