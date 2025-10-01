import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Package, Clock, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-block p-4 rounded-full bg-primary/10 mb-4">
            <BookOpen className="w-12 h-12 text-primary" />
          </div>
          
          <h1 className="text-5xl font-bold tracking-tight">
            Equipment Loan Management System
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline equipment borrowing for your school. Track, manage, and organize resources efficiently.
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-16">
            <div className="space-y-3 p-6 rounded-lg border bg-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Easy Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Monitor all borrowed items and their status in real-time
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-lg border bg-card">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold text-lg">Overdue Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Automatic notifications when items need to be returned
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-lg border bg-card">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-success" />
              </div>
              <h3 className="font-semibold text-lg">Secure Access</h3>
              <p className="text-sm text-muted-foreground">
                Role-based permissions for students and staff
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
