-- Drop the view as it bypasses RLS
DROP VIEW IF EXISTS public.borrowed_equipment_view;

-- We'll query the data directly in the application code with proper RLS policies instead