-- Add borrowed_by column to items table for quick lookup
ALTER TABLE public.items
ADD COLUMN borrowed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_items_borrowed_by ON public.items(borrowed_by);

-- Create a view for staff to see all borrowed equipment with borrower details
CREATE OR REPLACE VIEW public.borrowed_equipment_view AS
SELECT 
  i.id as item_id,
  i.name as equipment_name,
  i.status,
  l.id as loan_id,
  l.borrowed_at,
  l.due_date,
  l.returned_at,
  l.status as loan_status,
  p.full_name as borrowed_by_name,
  p.id as borrower_profile_id,
  -- Check if overdue
  CASE 
    WHEN l.status = 'active' AND l.due_date < NOW() THEN true
    ELSE false
  END as is_overdue
FROM public.items i
INNER JOIN public.loans l ON i.id = l.item_id
INNER JOIN public.profiles p ON l.borrower_id = p.id
WHERE l.status = 'active'
ORDER BY l.borrowed_at DESC;

-- Grant access to the view
GRANT SELECT ON public.borrowed_equipment_view TO authenticated;