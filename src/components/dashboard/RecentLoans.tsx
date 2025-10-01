import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Loan {
  id: string;
  borrowed_at: string;
  due_date: string;
  status: string;
  items: { name: string };
  profiles: { full_name: string };
}

interface RecentLoansProps {
  loans: Loan[];
}

export const RecentLoans = ({ loans }: RecentLoansProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-primary text-primary-foreground";
      case "returned":
        return "bg-success text-success-foreground";
      case "overdue":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loans.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recent loans</p>
          ) : (
            loans.map((loan) => (
              <div key={loan.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{loan.items.name}</p>
                  <p className="text-xs text-muted-foreground">{loan.profiles.full_name}</p>
                </div>
                <div className="text-right space-y-1">
                  <Badge className={getStatusColor(loan.status)}>{loan.status}</Badge>
                  <p className="text-xs text-muted-foreground">
                    Due: {format(new Date(loan.due_date), "MMM d")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};