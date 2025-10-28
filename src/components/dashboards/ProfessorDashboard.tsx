import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { School, Users, CheckCircle, BarChart3 } from "lucide-react";
import RegistrarPresenca from "@/components/professor/RegistrarPresenca";
import RelatoriosPresenca from "@/components/professor/RelatoriosPresenca";

interface Turma {
  id: string;
  nome: string;
  ano: string;
  alunos: { count: number }[];
}

export default function ProfessorDashboard() {
  const { user } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<Turma | null>(null);
  const [activeTab, setActiveTab] = useState<string>("turmas");

  useEffect(() => {
    if (user) {
      loadTurmas();
    }
  }, [user]);

  const loadTurmas = async () => {
    const { data, error } = await supabase
      .from("turmas")
      .select("*, alunos(count)")
      .eq("professor_id", user?.id);

    if (!error && data) {
      setTurmas(data);
    }
  };

  const selecionarTurma = (turma: Turma) => {
    setTurmaSelecionada(turma);
    setActiveTab("chamada");
  };

  const voltarParaTurmas = () => {
    setTurmaSelecionada(null);
    setActiveTab("turmas");
  };

  if (turmaSelecionada && activeTab === "chamada") {
    return <RegistrarPresenca turma={turmaSelecionada} onBack={voltarParaTurmas} />;
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="turmas">
            <School className="w-4 h-4 mr-2" />
            Minhas Turmas
          </TabsTrigger>
          <TabsTrigger value="relatorios">
            <BarChart3 className="w-4 h-4 mr-2" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="turmas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Minhas Turmas</CardTitle>
              <CardDescription>
                Gerencie as presenças e acompanhe suas turmas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {turmas.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma turma atribuída ainda. Aguarde o diretor atribuir turmas para você.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {turmas.map((turma) => (
                    <Card key={turma.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <School className="w-5 h-5 text-primary" />
                          <CardTitle className="text-lg">{turma.nome}</CardTitle>
                        </div>
                        <CardDescription>Ano: {turma.ano}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{turma.alunos?.[0]?.count || 0} alunos</span>
                        </div>
                        <Button 
                          className="w-full" 
                          size="sm"
                          onClick={() => selecionarTurma(turma)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Registrar Presença
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios">
          <RelatoriosPresenca />
        </TabsContent>
      </Tabs>
    </div>
  );
}
