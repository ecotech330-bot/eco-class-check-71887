import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface CadastrarAlunoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Turma {
  id: string;
  nome: string;
  ano: string;
}

export default function CadastrarAluno({ open, onOpenChange, onSuccess }: CadastrarAlunoProps) {
  const [loading, setLoading] = useState(false);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      loadTurmas();
    }
  }, [open]);

  const loadTurmas = async () => {
    const { data, error } = await supabase
      .from("turmas")
      .select("id, nome, ano")
      .order("nome");

    if (error) {
      toast.error("Erro ao carregar turmas");
      return;
    }

    setTurmas(data || []);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const nome = formData.get("nome") as string;
      const email = formData.get("email") as string;
      const senha = formData.get("senha") as string;
      const matricula = formData.get("matricula") as string;
      const turmaId = formData.get("turma_id") as string;

      // 1. Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            nome,
            tipo: "aluno",
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário");

      // 2. Fazer upload da foto se existir
      let fotoUrl = null;
      if (fotoFile) {
        const fileExt = fotoFile.name.split(".").pop();
        const fileName = `${authData.user.id}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("fotos")
          .upload(fileName, fotoFile, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("fotos")
            .getPublicUrl(fileName);
          fotoUrl = urlData.publicUrl;
        }
      }

      // 3. Criar registro na tabela alunos
      const { error: alunoError } = await supabase.from("alunos").insert({
        usuario_id: authData.user.id,
        matricula,
        turma_id: turmaId || null,
        foto_url: fotoUrl,
      });

      if (alunoError) throw alunoError;

      toast.success("Aluno cadastrado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao cadastrar aluno:", error);
      toast.error(error.message || "Erro ao cadastrar aluno");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              name="nome"
              type="text"
              placeholder="Nome do aluno"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha *</Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="matricula">Matrícula *</Label>
            <Input
              id="matricula"
              name="matricula"
              type="text"
              placeholder="Ex: 2025001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="turma_id">Turma</Label>
            <Select name="turma_id">
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma turma (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.nome} - {turma.ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="foto">Foto do Aluno</Label>
            <div className="flex items-center gap-2">
              <Input
                id="foto"
                type="file"
                accept="image/*"
                onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
                className="flex-1"
              />
              <Upload className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
