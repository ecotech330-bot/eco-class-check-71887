import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QrCode, Camera, CheckCircle2 } from "lucide-react";
import QRCode from "qrcode";

export default function RegistrarPresencaQR() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [alunoData, setAlunoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlunoData();
  }, []);

  const loadAlunoData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: aluno, error } = await supabase
        .from("alunos")
        .select(`
          id,
          qr_code_token,
          matricula,
          profiles!alunos_usuario_id_fkey (nome)
        `)
        .eq("usuario_id", userData.user.id)
        .single();

      if (error) throw error;

      setAlunoData(aluno);
      
      // Gerar QR Code com o token
      if (aluno.qr_code_token) {
        const qrDataUrl = await QRCode.toDataURL(aluno.qr_code_token, {
          width: 300,
          margin: 2,
        });
        setQrCodeUrl(qrDataUrl);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar seus dados");
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarPresenca = async () => {
    if (!alunoData) return;

    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const hoje = new Date().toISOString().split("T")[0];
      const agora = new Date().toTimeString().split(" ")[0];

      const { error } = await supabase.from("presencas").insert({
        aluno_id: alunoData.id,
        registrado_por: userData.user.id,
        metodo: "qr",
        status: "presente",
        data: hoje,
        hora: agora,
      });

      if (error) throw error;

      toast.success("Presença registrada com sucesso!");
    } catch (error: any) {
      console.error("Erro ao registrar presença:", error);
      toast.error(error.message || "Erro ao registrar presença");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Registrar Presença
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Mostre este QR Code ao professor ou registre sua presença manualmente
            </p>
            
            {qrCodeUrl && (
              <div className="flex justify-center">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code de Presença" 
                  className="border-4 border-primary rounded-lg"
                />
              </div>
            )}

            <div className="space-y-2">
              <p className="font-medium">
                {alunoData?.profiles?.nome}
              </p>
              <p className="text-sm text-muted-foreground">
                Matrícula: {alunoData?.matricula}
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleRegistrarPresenca}
              disabled={loading}
              size="lg"
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? "Registrando..." : "Registrar Presença Manualmente"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
