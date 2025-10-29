import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Aluno {
  id: string;
  matricula: string;
  usuario_id: string;
  turma_id: string | null;
  profiles: { nome: string; };
}

interface EditarAlunoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aluno: Aluno | null;
  onSuccess: () => void;
}

interface Turma {
  id: string;
  nome: string;
  ano: string;
}

export default function EditarAluno({ open, onOpenChange, aluno, onSuccess }: EditarAlunoProps) {
  const [turmaId, setTurmaId] = useState<string>("");
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (aluno && open) {
      setTurmaId(aluno.turma_id || "");
      loadTurmas();
    }
  }, [aluno, open]);

  const loadTurmas = async () => {
    const { data, error } = await supabase
      .from("turmas")
      .select("*")
      .order("nome");

    if (!error && data) {
      setTurmas(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aluno) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("alunos")
        .update({ turma_id: turmaId || null })
        .eq("id", aluno.id);

      if (error) throw error;

      toast.success("Turma do aluno atualizada com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao atualizar aluno: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Turma do Aluno</DialogTitle>
          <DialogDescription>
            Aluno: {aluno?.profiles.nome} - Matrícula: {aluno?.matricula}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="turma">Turma</Label>
            <Select value={turmaId} onValueChange={setTurmaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem turma</SelectItem>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.nome} - {turma.ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
