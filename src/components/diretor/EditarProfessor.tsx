import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Professor {
  id: string;
  nome: string;
  disciplina: string | null;
  turmas: { id: string; nome: string; ano: string; }[];
}

interface EditarProfessorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professor: Professor | null;
  onSuccess: () => void;
}

interface Turma {
  id: string;
  nome: string;
  ano: string;
}

export default function EditarProfessor({ open, onOpenChange, professor, onSuccess }: EditarProfessorProps) {
  const [nome, setNome] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [turmasSelecionadas, setTurmasSelecionadas] = useState<string[]>([]);
  const [todasTurmas, setTodasTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (professor && open) {
      setNome(professor.nome);
      setDisciplina(professor.disciplina || "");
      setTurmasSelecionadas(professor.turmas.map(t => t.id));
      loadTurmas();
    }
  }, [professor, open]);

  const loadTurmas = async () => {
    const { data, error } = await supabase
      .from("turmas")
      .select("*")
      .order("nome");

    if (!error && data) {
      setTodasTurmas(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professor) return;

    setLoading(true);

    try {
      // Atualizar perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ nome, disciplina: disciplina || null })
        .eq("id", professor.id);

      if (profileError) throw profileError;

      // Remover professor de todas as turmas antigas
      const { error: removeError } = await supabase
        .from("turmas")
        .update({ professor_id: null })
        .eq("professor_id", professor.id);

      if (removeError) throw removeError;

      // Adicionar professor às turmas selecionadas
      if (turmasSelecionadas.length > 0) {
        const { error: addError } = await supabase
          .from("turmas")
          .update({ professor_id: professor.id })
          .in("id", turmasSelecionadas);

        if (addError) throw addError;
      }

      toast.success("Professor atualizado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao atualizar professor: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTurma = (turmaId: string) => {
    setTurmasSelecionadas(prev =>
      prev.includes(turmaId)
        ? prev.filter(id => id !== turmaId)
        : [...prev, turmaId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Professor</DialogTitle>
          <DialogDescription>
            Atualize as informações e turmas do professor
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="disciplina">Disciplina</Label>
            <Input
              id="disciplina"
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value)}
              placeholder="Ex: Matemática, Português, etc."
            />
          </div>

          <div className="space-y-2">
            <Label>Turmas</Label>
            <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
              {todasTurmas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma turma cadastrada
                </p>
              ) : (
                todasTurmas.map((turma) => (
                  <div
                    key={turma.id}
                    className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => toggleTurma(turma.id)}
                  >
                    <input
                      type="checkbox"
                      checked={turmasSelecionadas.includes(turma.id)}
                      onChange={() => toggleTurma(turma.id)}
                      className="w-4 h-4"
                    />
                    <label className="flex-1 cursor-pointer">
                      {turma.nome} - {turma.ano}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
