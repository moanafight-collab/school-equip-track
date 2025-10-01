import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, addHours } from "date-fns";

interface BorrowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dueDate: Date) => void;
  itemName: string;
}

export const BorrowDialog = ({ open, onOpenChange, onConfirm, itemName }: BorrowDialogProps) => {
  const handleConfirm = () => {
    // Automatically set due date to 8 hours from now
    const dueDate = addHours(new Date(), 8);
    onConfirm(dueDate);
  };

  const dueDate = addHours(new Date(), 8);

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
              This item must be returned within 8 hours.
            </p>
            <p className="text-sm font-medium">
              Due: {format(dueDate, "PPP 'at' p")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm Borrow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};