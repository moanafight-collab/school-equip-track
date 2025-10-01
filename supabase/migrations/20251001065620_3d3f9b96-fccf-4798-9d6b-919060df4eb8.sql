-- Add DELETE policy for items table (staff and admin only)
CREATE POLICY "Staff and admin can delete items"
ON public.items
FOR DELETE
USING (has_role(auth.uid(), 'staff'::user_role) OR has_role(auth.uid(), 'admin'::user_role));

-- Add a function to check if an item has an active loan
CREATE OR REPLACE FUNCTION public.item_has_active_loan(item_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.loans
    WHERE item_id = item_uuid
      AND status = 'active'
  )
$$;

-- Add a policy to prevent borrowing items with active loans
-- This is a safety check in addition to the application logic
CREATE POLICY "Cannot borrow items with active loans"
ON public.loans
FOR INSERT
WITH CHECK (NOT item_has_active_loan(item_id));