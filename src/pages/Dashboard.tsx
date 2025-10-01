import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentLoans } from "@/components/dashboard/RecentLoans";
import { EquipmentCard } from "@/components/equipment/EquipmentCard";
import { BorrowDialog } from "@/components/equipment/BorrowDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Search } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    setProfile(profileData);

    // Fetch user role from user_roles table
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (roleData) {
      setUserRole(roleData.role);
    }
  };

  const fetchData = async () => {
    try {
      const [itemsRes, loansRes] = await Promise.all([
        supabase.from("items").select("*").order("name"),
        supabase
          .from("loans")
          .select("*, items(name), profiles(full_name)")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (itemsRes.data) setItems(itemsRes.data);
      if (loansRes.data) setLoans(loansRes.data);
    } catch (error: any) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleBorrowClick = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    setSelectedItem(item);
    setBorrowDialogOpen(true);
  };

  const handleBorrowConfirm = async (dueDate: Date) => {
    if (!profile || !selectedItem) return;

    try {
      const { error: loanError } = await supabase.from("loans").insert({
        item_id: selectedItem.id,
        borrower_id: profile.id,
        due_date: dueDate.toISOString(),
        status: "active",
      });

      if (loanError) throw loanError;

      const { error: itemError } = await supabase
        .from("items")
        .update({ status: "borrowed" })
        .eq("id", selectedItem.id);

      if (itemError) throw itemError;

      toast.success(`Successfully borrowed ${selectedItem.name}`);
      setBorrowDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalItems: items.length,
    borrowedItems: items.filter((i) => i.status === "borrowed").length,
    overdueItems: loans.filter((l) => l.status === "overdue").length,
    availableItems: items.filter((i) => i.status === "available").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Equipment Loan System</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {profile?.full_name} {userRole && `(${userRole})`}
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <DashboardStats {...stats} />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Available Equipment</h2>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search equipment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredItems.map((item) => (
                  <EquipmentCard
                    key={item.id}
                    item={item}
                    onBorrow={handleBorrowClick}
                    canBorrow={true}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <RecentLoans loans={loans} />
          </div>
        </div>
      </main>

      {selectedItem && (
        <BorrowDialog
          open={borrowDialogOpen}
          onOpenChange={setBorrowDialogOpen}
          onConfirm={handleBorrowConfirm}
          itemName={selectedItem.name}
        />
      )}
    </div>
  );
};

export default Dashboard;