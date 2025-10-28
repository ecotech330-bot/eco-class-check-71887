import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CadastrarTurmaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Professor {
  id: string;
  nome: string;
}

export default function CadastrarTurma({ open, onOpenChange, onSuccess }: CadastrarTurmaProps) {
  const [loading, setLoading] = useState(false);
  const [professores, setProfessores] = useState<Professor[]>([]);

  useEffect(() => {
    if (open) {
      loadProfessores();
    }
  }, [open]);

  const loadProfessores = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nome")
      .eq("tipo", "professor")
      .order("nome");

    if (error) {
      toast.error("Erro ao carregar professores");
      return;
    }

    setProfessores(data || []);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const nome = formData.get("nome") as string;
      const ano = formData.get("ano") as string;
      const professorId = formData.get("professor_id") as string;

      const { error } = await supabase.from("turmas").insert({
        nome,
        ano,
        professor_id: professorId || null,
      });

      if (error) throw error;

      toast.success("Turma cadastrada com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao cadastrar turma:", error);
      toast.error(error.message || "Erro ao cadastrar turma");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Nova Turma</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Turma *</Label>
            <Input
              id="nome"
              name="nome"
              type="text"
              placeholder="Ex: 3º Ano A"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ano">Ano Letivo *</Label>
            <Input
              id="ano"
              name="ano"
              type="text"
              placeholder="Ex: 2025"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="professor_id">Professor Responsável</Label>
            <Select name="professor_id">
              <SelectTrigger>
                <SelectValue placeholder="Selecione um professor (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {professores.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
