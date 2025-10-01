import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, isPast } from "date-fns";
import { Package2 } from "lucide-react";

interface BorrowedEquipment {
  loan_id: string;
  item_id: string;
  equipment_name: string;
  borrowed_by_name: string;
  borrowed_at: string;
  due_date: string;
  status: string;
}

interface BorrowedEquipmentTableProps {
  borrowedEquipment: BorrowedEquipment[];
  onReturn: (itemId: string) => void;
}

export const BorrowedEquipmentTable = ({ borrowedEquipment, onReturn }: BorrowedEquipmentTableProps) => {
  const isOverdue = (dueDate: string, status: string) => {
    return status === "active" && isPast(new Date(dueDate));
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    if (isOverdue(dueDate, status)) {
      return <Badge className="bg-destructive text-destructive-foreground">Overdue</Badge>;
    }
    switch (status) {
      case "active":
        return <Badge className="bg-primary text-primary-foreground">Active</Badge>;
      case "returned":
        return <Badge className="bg-success text-success-foreground">Returned</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package2 className="h-5 w-5" />
          Borrowed Equipment
        </CardTitle>
      </CardHeader>
      <CardContent>
        {borrowedEquipment.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No equipment currently borrowed
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Borrowed By</TableHead>
                  <TableHead>Borrowed At</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {borrowedEquipment.map((item) => (
                  <TableRow 
                    key={item.loan_id}
                    className={isOverdue(item.due_date, item.status) ? "bg-destructive/10" : ""}
                  >
                    <TableCell className="font-medium">{item.equipment_name}</TableCell>
                    <TableCell>{item.borrowed_by_name}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(item.borrowed_at), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(item.due_date), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status, item.due_date)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.status === "active" && (
                        <Button
                          onClick={() => onReturn(item.item_id)}
                          variant="default"
                          size="sm"
                        >
                          Mark as Returned
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
