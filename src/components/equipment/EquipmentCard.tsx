import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package2, Trash2 } from "lucide-react";

interface EquipmentCardProps {
  item: {
    id: string;
    name: string;
    category: string;
    description?: string;
    status: string;
  };
  onBorrow: (id: string) => void;
  canBorrow: boolean;
  isStaff?: boolean;
  onDelete?: (id: string) => void;
  onReturn?: (id: string) => void;
}

export const EquipmentCard = ({ item, onBorrow, canBorrow, isStaff, onDelete, onReturn }: EquipmentCardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-success text-success-foreground">Available</Badge>;
      case "borrowed":
        return <Badge className="bg-primary text-primary-foreground">Borrowed</Badge>;
      case "maintenance":
        return <Badge className="bg-muted text-muted-foreground">Maintenance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{item.category}</p>
            </div>
          </div>
          {getStatusBadge(item.status)}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {item.description || "No description available"}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        {!isStaff ? (
          <Button
            onClick={() => onBorrow(item.id)}
            disabled={item.status !== "available" || !canBorrow}
            className="w-full"
          >
            {item.status === "available" ? "Borrow" : "Not Available"}
          </Button>
        ) : (
          <>
            {item.status === "borrowed" && onReturn && (
              <Button
                onClick={() => onReturn(item.id)}
                variant="default"
                className="flex-1"
              >
                Mark as Returned
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={() => onDelete(item.id)}
                variant="destructive"
                size="icon"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
};