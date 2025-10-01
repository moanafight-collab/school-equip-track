import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, endOfDay } from "date-fns";

interface BorrowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dueDate: Date) => void;
  itemName: string;
  isSubmitting?: boolean;
}

export const BorrowDialog = ({ open, onOpenChange, onConfirm, itemName, isSubmitting = false }: BorrowDialogProps) => {
  const handleConfirm = () => {
    // Automatically set due date to end of day (11:59 PM)
    const dueDate = endOfDay(new Date());
    onConfirm(dueDate);
  };

  const dueDate = endOfDay(new Date());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Borrow Item</DialogTitle>
          <DialogDescription>
            You are about to borrow: <strong>{itemName}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This item must be returned by the end of today.
            </p>
            <p className="text-sm font-medium">
              Due: {format(dueDate, "PPP 'at' p")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Confirm Borrow"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};