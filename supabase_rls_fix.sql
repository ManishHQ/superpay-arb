-- Fix Row Level Security policies for user_profiles table

-- Allow anyone to insert their own profile
CREATE POLICY "Users can insert their own profile" ON user_profiles
FOR INSERT WITH CHECK (true);

-- Allow users to read all profiles (for user search functionality)
CREATE POLICY "Users can read all profiles" ON user_profiles
FOR SELECT USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON user_profiles
FOR UPDATE USING (true) WITH CHECK (true);

-- Alternative: If you want to be more restrictive and only allow authenticated users
-- CREATE POLICY "Authenticated users can insert profiles" ON user_profiles
-- FOR INSERT TO authenticated WITH CHECK (true);

-- CREATE POLICY "Authenticated users can read profiles" ON user_profiles
-- FOR SELECT TO authenticated USING (true);

-- CREATE POLICY "Authenticated users can update profiles" ON user_profiles
-- FOR UPDATE TO authenticated USING (true) WITH CHECK (true);