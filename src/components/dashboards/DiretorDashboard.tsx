import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Users, School, Calendar, BarChart3, UserPlus, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function DiretorDashboard() {
  const [stats, setStats] = useState({
    totalAlunos: 0,
    totalProfessores: 0,
    totalTurmas: 0,
    presencasHoje: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: alunos } = await supabase.from("alunos").select("id", { count: "exact" });
    const { data: professores } = await supabase
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("tipo", "professor");
    const { data: turmas } = await supabase.from("turmas").select("id", { count: "exact" });
    const { data: presencas } = await supabase
      .from("presencas")
      .select("id", { count: "exact" })
      .eq("data", new Date().toISOString().split("T")[0]);

    setStats({
      totalAlunos: alunos?.length || 0,
      totalProfessores: professores?.length || 0,
      totalTurmas: turmas?.length || 0,
      presencasHoje: presencas?.length || 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalAlunos}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Professores</CardTitle>
            <BookOpen className="w-4 h-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{stats.totalProfessores}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Turmas</CardTitle>
            <School className="w-4 h-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{stats.totalTurmas}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Presenças Hoje</CardTitle>
            <Calendar className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{stats.presencasHoje}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="alunos">Alunos</TabsTrigger>
          <TabsTrigger value="professores">Professores</TabsTrigger>
          <TabsTrigger value="turmas">Turmas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard do Diretor</CardTitle>
              <CardDescription>
                Gerencie toda a escola em um só lugar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="h-auto py-6 flex-col gap-2" variant="outline">
                  <UserPlus className="w-8 h-8" />
                  <span>Cadastrar Novo Aluno</span>
                </Button>
                <Button className="h-auto py-6 flex-col gap-2" variant="outline">
                  <BarChart3 className="w-8 h-8" />
                  <span>Ver Relatórios</span>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Mais funcionalidades em breve...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alunos">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Alunos</CardTitle>
              <CardDescription>Lista de todos os alunos cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professores">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Professores</CardTitle>
              <CardDescription>Lista de todos os professores</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turmas">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Turmas</CardTitle>
              <CardDescription>Lista de todas as turmas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
