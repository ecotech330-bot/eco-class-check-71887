import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import DiretorDashboard from "@/components/dashboards/DiretorDashboard";
import ProfessorDashboard from "@/components/dashboards/ProfessorDashboard";
import AlunoDashboard from "@/components/dashboards/AlunoDashboard";
import { Button } from "@/components/ui/button";
import { LogOut, GraduationCap } from "lucide-react";

export default function Dashboard() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">EduCheck</h1>
              <p className="text-sm text-muted-foreground">{profile.nome}</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut} size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="container mx-auto px-4 py-8">
        {profile.tipo === "diretor" && <DiretorDashboard />}
        {profile.tipo === "professor" && <ProfessorDashboard />}
        {profile.tipo === "aluno" && <AlunoDashboard />}
      </main>
    </div>
  );
}
