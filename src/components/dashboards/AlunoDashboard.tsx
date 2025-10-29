import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { QrCode, Calendar, TrendingUp, CheckCircle2 } from "lucide-react";
import QRCode from "qrcode";
import RegistrarPresencaQR from "@/components/aluno/RegistrarPresencaQR";

export default function AlunoDashboard() {
  const { user } = useAuth();
  const [aluno, setAluno] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [presencas, setPresencas] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadAlunoData();
    }
  }, [user]);

  const loadAlunoData = async () => {
    // Load aluno data
    const { data: alunoData } = await supabase
      .from("alunos")
      .select("*, turmas(nome)")
      .eq("usuario_id", user?.id)
      .single();

    if (alunoData) {
      setAluno(alunoData);
      
      // Generate QR Code
      const qrData = JSON.stringify({
        aluno_id: alunoData.id,
        token: alunoData.qr_code_token,
      });
      const qrUrl = await QRCode.toDataURL(qrData);
      setQrCodeUrl(qrUrl);

      // Load presencas
      const { data: presencasData } = await supabase
        .from("presencas")
        .select("*")
        .eq("aluno_id", alunoData.id)
        .order("data", { ascending: false })
        .limit(10);

      if (presencasData) {
        setPresencas(presencasData);
      }
    }
  };

  if (!aluno) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Nenhum registro de aluno encontrado. Entre em contato com a direção.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalPresencas = presencas.filter((p) => p.status === "presente").length;
  const totalAusencias = presencas.filter((p) => p.status === "ausente").length;
  const frequencia = presencas.length > 0 
    ? Math.round((totalPresencas / presencas.length) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Minha Área</h1>

      <Tabs defaultValue="presenca" className="space-y-4">
        <TabsList>
          <TabsTrigger value="presenca" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Registrar Presença
          </TabsTrigger>
          <TabsTrigger value="estatisticas" className="gap-2">
            <Calendar className="w-4 h-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presenca">
          <RegistrarPresencaQR />
        </TabsContent>

        <TabsContent value="estatisticas">
          <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Frequência</CardTitle>
            <TrendingUp className="w-4 h-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{frequencia}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalPresencas} presenças de {presencas.length} registros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Matrícula</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aluno.matricula}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Turma: {aluno.turmas?.nome || "Não atribuída"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ausências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalAusencias}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de faltas registradas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Meu QR Code
          </CardTitle>
          <CardDescription>
            Apresente este código para registrar sua presença
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {qrCodeUrl && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            Token: {aluno.qr_code_token?.substring(0, 8)}...
          </p>
        </CardContent>
      </Card>

      {/* Recent Presencas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Histórico Recente
          </CardTitle>
          <CardDescription>Suas últimas presenças registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {presencas.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma presença registrada ainda
            </p>
          ) : (
            <div className="space-y-2">
              {presencas.map((presenca) => (
                <div
                  key={presenca.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        presenca.status === "presente"
                          ? "bg-success"
                          : "bg-destructive"
                      }`}
                    />
                    <div>
                      <p className="font-medium">
                        {new Date(presenca.data).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {presenca.hora} • {presenca.metodo}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      presenca.status === "presente"
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {presenca.status === "presente" ? "Presente" : "Ausente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
