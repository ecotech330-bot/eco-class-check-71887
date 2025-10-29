import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, User, TrendingUp } from "lucide-react";

interface Turma {
  id: string;
  nome: string;
  ano: string;
}

interface PresencaData {
  aluno_nome: string;
  total_presencas: number;
  total_faltas: number;
  percentual_presenca: number;
}

export default function RelatoriosDiretor() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>("todas");
  const [periodo, setPeriodo] = useState<string>("30");
  const [dados, setDados] = useState<PresencaData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTurmas();
  }, []);

  useEffect(() => {
    loadRelatorio();
  }, [turmaSelecionada, periodo]);

  const loadTurmas = async () => {
    const { data, error } = await supabase
      .from("turmas")
      .select("*")
      .order("nome");

    if (!error && data) {
      setTurmas(data);
    }
  };

  const loadRelatorio = async () => {
    setLoading(true);
    
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - parseInt(periodo));
    
    let alunosQuery = supabase
      .from("alunos")
      .select(`
        id,
        profiles!alunos_usuario_id_fkey (
          nome
        )
      `);

    if (turmaSelecionada !== "todas") {
      alunosQuery = alunosQuery.eq("turma_id", turmaSelecionada);
    }

    const { data: alunosData, error: alunosError } = await alunosQuery;

    if (alunosError || !alunosData) {
      setLoading(false);
      return;
    }

    const { data: presencasData, error: presencasError } = await supabase
      .from("presencas")
      .select("aluno_id, status")
      .in("aluno_id", alunosData.map(a => a.id))
      .gte("data", dataInicio.toISOString().split('T')[0]);

    if (presencasError) {
      setLoading(false);
      return;
    }

    const relatorio: PresencaData[] = alunosData.map(aluno => {
      const presencasAluno = presencasData?.filter(p => p.aluno_id === aluno.id) || [];
      const presentes = presencasAluno.filter(p => p.status === "presente").length;
      const faltas = presencasAluno.filter(p => p.status === "ausente").length;
      const total = presentes + faltas;
      const percentual = total > 0 ? (presentes / total) * 100 : 0;

      return {
        aluno_nome: aluno.profiles.nome,
        total_presencas: presentes,
        total_faltas: faltas,
        percentual_presenca: Math.round(percentual),
      };
    });

    setDados(relatorio);
    setLoading(false);
  };

  const dadosGerais = dados.reduce(
    (acc, curr) => ({
      total_presencas: acc.total_presencas + curr.total_presencas,
      total_faltas: acc.total_faltas + curr.total_faltas,
    }),
    { total_presencas: 0, total_faltas: 0 }
  );

  const dadosPizza = [
    { name: "Presenças", value: dadosGerais.total_presencas, color: "#10b981" },
    { name: "Faltas", value: dadosGerais.total_faltas, color: "#ef4444" },
  ];

  const mediaPresenca = dados.length > 0
    ? Math.round(dados.reduce((acc, curr) => acc + curr.percentual_presenca, 0) / dados.length)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Relatórios de Presença</CardTitle>
          <CardDescription>
            Acompanhe a frequência dos alunos por turma e período
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Turma</label>
              <Select value={turmaSelecionada} onValueChange={setTurmaSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as turmas</SelectItem>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome} - {turma.ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Última semana</SelectItem>
                  <SelectItem value="30">Último mês</SelectItem>
                  <SelectItem value="90">Últimos 3 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando relatório...</p>
            </div>
          </CardContent>
        </Card>
      ) : dados.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Nenhum dado de presença encontrado para o período selecionado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Presenças</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{dadosGerais.total_presencas}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Faltas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{dadosGerais.total_faltas}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Média de Presença</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mediaPresenca}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosPizza}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosPizza.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Presença por Aluno (%)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dados}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="aluno_nome" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="percentual_presenca" fill="#10b981" name="% Presença" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalhamento por Aluno</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Aluno</th>
                      <th className="text-center p-2">Presenças</th>
                      <th className="text-center p-2">Faltas</th>
                      <th className="text-center p-2">% Presença</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.map((aluno, index) => (
                      <tr key={index} className="border-b hover:bg-accent/50">
                        <td className="p-2">{aluno.aluno_nome}</td>
                        <td className="text-center p-2 text-primary font-medium">
                          {aluno.total_presencas}
                        </td>
                        <td className="text-center p-2 text-destructive font-medium">
                          {aluno.total_faltas}
                        </td>
                        <td className="text-center p-2 font-medium">
                          {aluno.percentual_presenca}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
