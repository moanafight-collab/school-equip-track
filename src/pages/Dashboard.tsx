import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentLoans } from "@/components/dashboard/RecentLoans";
import { EquipmentCard } from "@/components/equipment/EquipmentCard";
import { BorrowDialog } from "@/components/equipment/BorrowDialog";
import { AddEquipmentDialog } from "@/components/equipment/AddEquipmentDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Search, Plus } from "lucide-react";
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
  const [addEquipmentDialogOpen, setAddEquipmentDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch user's profile to get profile.id
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      // Fetch user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      const isStudent = roleData?.role === "student";

      // Build loans query based on role
      let loansQuery = supabase
        .from("loans")
        .select("*, items(name), profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(5);

      // Students only see their own loans
      if (isStudent && profileData) {
        loansQuery = loansQuery.eq("borrower_id", profileData.id);
      }

      const [itemsRes, loansRes] = await Promise.all([
        supabase.from("items").select("*").order("name"),
        loansQuery,
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
    if (!profile || !selectedItem || borrowing) return;

    setBorrowing(true);
    try {
      // Double-check item status and if there's an active loan
      const { data: itemCheck } = await supabase
        .from("items")
        .select("status")
        .eq("id", selectedItem.id)
        .single();

      if (itemCheck?.status !== "available") {
        toast.error("This item is no longer available");
        setBorrowDialogOpen(false);
        fetchData();
        return;
      }

      // Check for active loans
      const { data: activeLoan } = await supabase
        .from("loans")
        .select("id")
        .eq("item_id", selectedItem.id)
        .eq("status", "active")
        .maybeSingle();

      if (activeLoan) {
        toast.error("This item is already borrowed");
        setBorrowDialogOpen(false);
        fetchData();
        return;
      }

      // Create loan and update item status in a transaction-like manner
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
      toast.error(error.message || "Failed to borrow item");
    } finally {
      setBorrowing(false);
    }
  };

  const handleAddEquipment = async (data: { name: string; category: string; description: string; serialNumber: string }) => {
    try {
      const { error } = await supabase.from("items").insert({
        name: data.name,
        category: data.category,
        description: data.description || null,
        serial_number: data.serialNumber || null,
        status: "available",
      });

      if (error) throw error;

      toast.success("Equipment added successfully");
      setAddEquipmentDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteEquipment = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this equipment?")) return;

    try {
      const { error } = await supabase.from("items").delete().eq("id", itemId);

      if (error) throw error;

      toast.success("Equipment deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReturnItem = async (itemId: string) => {
    try {
      // Find active loan for this item
      const { data: activeLoan, error: loanFindError } = await supabase
        .from("loans")
        .select("id")
        .eq("item_id", itemId)
        .eq("status", "active")
        .maybeSingle();

      if (loanFindError) throw loanFindError;

      if (activeLoan) {
        // Update loan status
        const { error: loanError } = await supabase
          .from("loans")
          .update({ 
            status: "returned",
            returned_at: new Date().toISOString()
          })
          .eq("id", activeLoan.id);

        if (loanError) throw loanError;
      }

      // Update item status
      const { error: itemError } = await supabase
        .from("items")
        .update({ status: "available" })
        .eq("id", itemId);

      if (itemError) throw itemError;

      toast.success("Item marked as returned");
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Equipment Inventory</h2>
                {(userRole === "staff" || userRole === "admin") && (
                  <Button onClick={() => setAddEquipmentDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Equipment
                  </Button>
                )}
              </div>
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
                    canBorrow={userRole === "student"}
                    isStaff={userRole === "staff" || userRole === "admin"}
                    onDelete={userRole === "staff" || userRole === "admin" ? handleDeleteEquipment : undefined}
                    onReturn={userRole === "staff" || userRole === "admin" ? handleReturnItem : undefined}
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
          isSubmitting={borrowing}
        />
      )}

      <AddEquipmentDialog
        open={addEquipmentDialogOpen}
        onOpenChange={setAddEquipmentDialogOpen}
        onConfirm={handleAddEquipment}
      />
    </div>
  );
};

export default Dashboard;