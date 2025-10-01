-- Fix all critical security vulnerabilities

-- 1. Create user_roles table for proper role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Create security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Drop old unsafe policies on profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 5. Drop policies on items table that depend on role column
DROP POLICY IF EXISTS "Staff and admin can insert items" ON public.items;
DROP POLICY IF EXISTS "Staff and admin can update items" ON public.items;

-- 6. Drop policies on loans table that depend on role column
DROP POLICY IF EXISTS "Users can view their own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can create loans" ON public.loans;
DROP POLICY IF EXISTS "Staff and admin can update loans" ON public.loans;

-- 7. Drop policies on notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- 8. Now safe to remove role column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- 9. Create new secure policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile name"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 10. Recreate items policies using has_role function
CREATE POLICY "Staff and admin can insert items"
  ON public.items FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Staff and admin can update items"
  ON public.items FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin')
  );

-- 11. Recreate loans policies using has_role function
CREATE POLICY "Users can view their own loans"
  ON public.loans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = borrower_id AND user_id = auth.uid()
    )
    OR
    public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can create loans"
  ON public.loans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = borrower_id AND user_id = auth.uid()
    )
    OR
    public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Staff and admin can update loans"
  ON public.loans FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin')
  );

-- 12. Fix notifications RLS policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = notifications.user_id 
        AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = notifications.user_id 
        AND profiles.user_id = auth.uid()
    )
  );

-- 13. Create policies for user_roles table
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

-- 14. Fix database functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email
  );
  
  -- Insert role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_overdue_loans()
RETURNS void AS $$
BEGIN
  UPDATE public.loans
  SET status = 'overdue'
  WHERE status = 'active'
    AND due_date < now()
    AND returned_at IS NULL;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- 15. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);