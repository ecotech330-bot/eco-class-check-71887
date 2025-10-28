import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { QrCode, UserCheck, ArrowLeft, CheckCircle } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface Turma {
  id: string;
  nome: string;
  ano: string;
}

interface Aluno {
  id: string;
  matricula: string;
  qr_code_token: string;
  usuario_id: string;
  profiles: {
    nome: string;
  };
}

interface RegistrarPresencaProps {
  turma: Turma;
  onBack: () => void;
}

export default function RegistrarPresenca({ turma, onBack }: RegistrarPresencaProps) {
  const { user } = useAuth();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [presencas, setPresencas] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    loadAlunos();
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [turma.id]);

  const loadAlunos = async () => {
    const { data, error } = await supabase
      .from("alunos")
      .select(`
        id,
        matricula,
        qr_code_token,
        usuario_id,
        profiles!alunos_usuario_id_fkey (
          nome
        )
      `)
      .eq("turma_id", turma.id);

    if (!error && data) {
      setAlunos(data as any);
    }
  };

  const startQRScanner = () => {
    setScanning(true);
    
    const qrScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    qrScanner.render(onScanSuccess, onScanFailure);
    setScanner(qrScanner);
  };

  const stopQRScanner = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    try {
      // QR code token is just the UUID string
      const qrToken = decodedText.trim();
      
      const aluno = alunos.find(a => a.qr_code_token === qrToken);
      
      if (!aluno) {
        toast({
          title: "Aluno não encontrado",
          description: "Este QR code não pertence a nenhum aluno desta turma.",
          variant: "destructive",
        });
        return;
      }

      await registrarPresencaIndividual(aluno);
    } catch (error) {
      toast({
        title: "Erro ao processar QR Code",
        description: "QR Code inválido.",
        variant: "destructive",
      });
    }
  };

  const onScanFailure = (error: any) => {
    // Silently ignore scan failures
  };

  const registrarPresencaIndividual = async (aluno: Aluno) => {
    const { error } = await supabase
      .from("presencas")
      .insert({
        aluno_id: aluno.id,
        registrado_por: user?.id,
        metodo: "qr",
        status: "presente",
        data: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().split(' ')[0],
      });

    if (error) {
      toast({
        title: "Erro ao registrar presença",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "✅ Presença registrada",
      description: `${aluno.profiles.nome} - ${aluno.matricula}`,
    });

    setPresencas(prev => new Set([...prev, aluno.id]));
  };

  const togglePresencaManual = (alunoId: string) => {
    const newPresencas = new Set(presencas);
    if (newPresencas.has(alunoId)) {
      newPresencas.delete(alunoId);
    } else {
      newPresencas.add(alunoId);
    }
    setPresencas(newPresencas);
  };

  const salvarChamadaManual = async () => {
    const presencasArray = Array.from(presencas);
    
    if (presencasArray.length === 0) {
      toast({
        title: "Nenhuma presença selecionada",
        description: "Selecione pelo menos um aluno presente.",
        variant: "destructive",
      });
      return;
    }

    const registros = presencasArray.map(alunoId => ({
      aluno_id: alunoId,
      registrado_por: user?.id,
      metodo: "manual" as const,
      status: "presente" as const,
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().split(' ')[0],
    }));

    const { error } = await supabase
      .from("presencas")
      .insert(registros);

    if (error) {
      toast({
        title: "Erro ao salvar chamada",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Chamada salva com sucesso",
      description: `${presencasArray.length} presença(s) registrada(s).`,
    });

    setPresencas(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{turma.nome}</h2>
          <p className="text-muted-foreground">Ano: {turma.ano}</p>
        </div>
      </div>

      <Tabs defaultValue="qr" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="qr">
            <QrCode className="w-4 h-4 mr-2" />
            Chamada QR Code
          </TabsTrigger>
          <TabsTrigger value="manual">
            <UserCheck className="w-4 h-4 mr-2" />
            Chamada Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Escaneamento de QR Code</CardTitle>
              <CardDescription>
                Peça aos alunos para mostrarem seus QR codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!scanning ? (
                <Button onClick={startQRScanner} className="w-full" size="lg">
                  <QrCode className="w-5 h-5 mr-2" />
                  Iniciar Scanner
                </Button>
              ) : (
                <>
                  <div id="qr-reader" className="w-full"></div>
                  <Button onClick={stopQRScanner} variant="destructive" className="w-full">
                    Parar Scanner
                  </Button>
                </>
              )}

              {presencas.size > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      Presenças Registradas: {presencas.size}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {alunos
                        .filter(a => presencas.has(a.id))
                        .map(aluno => (
                          <li key={aluno.id} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            <span>{aluno.profiles.nome} - {aluno.matricula}</span>
                          </li>
                        ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Alunos</CardTitle>
              <CardDescription>
                Marque os alunos presentes manualmente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {alunos.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum aluno cadastrado nesta turma.
                </p>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {alunos.map((aluno) => (
                      <div
                        key={aluno.id}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          id={aluno.id}
                          checked={presencas.has(aluno.id)}
                          onCheckedChange={() => togglePresencaManual(aluno.id)}
                        />
                        <label
                          htmlFor={aluno.id}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">{aluno.profiles.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            Matrícula: {aluno.matricula}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-muted-foreground">
                      {presencas.size} de {alunos.length} alunos presentes
                    </span>
                    <Button onClick={salvarChamadaManual} disabled={presencas.size === 0}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Salvar Chamada
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
