import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import EditarProfessor from "./EditarProfessor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Professor {
  id: string;
  nome: string;
  disciplina: string | null;
  turmas: {
    id: string;
    nome: string;
    ano: string;
  }[];
}

export default function ListarProfessores() {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editarProfessor, setEditarProfessor] = useState<Professor | null>(null);
  const [professorParaExcluir, setProfessorParaExcluir] = useState<Professor | null>(null);

  useEffect(() => {
    loadProfessores();
  }, []);

  const loadProfessores = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          nome,
          disciplina,
          turmas (id, nome, ano)
        `)
        .eq("tipo", "professor")
        .order("nome");

      if (error) throw error;
      setProfessores(data as any || []);
    } catch (error) {
      console.error("Erro ao carregar professores:", error);
      toast.error("Erro ao carregar professores");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  const handleExcluir = async () => {
    if (!professorParaExcluir) return;

    try {
      // Remover professor das turmas
      await supabase
        .from("turmas")
        .update({ professor_id: null })
        .eq("professor_id", professorParaExcluir.id);

      // Excluir perfil (o auth.users será excluído em cascata)
      const { error } = await supabase.auth.admin.deleteUser(professorParaExcluir.id);

      if (error) throw error;

      toast.success("Professor excluído com sucesso!");
      loadProfessores();
    } catch (error: any) {
      toast.error("Erro ao excluir professor: " + error.message);
    } finally {
      setProfessorParaExcluir(null);
    }
  };

  if (professores.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum professor cadastrado ainda.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Disciplina</TableHead>
              <TableHead>Turmas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {professores.map((prof) => (
              <TableRow key={prof.id}>
                <TableCell className="font-medium">{prof.nome}</TableCell>
                <TableCell>
                  {prof.disciplina ? (
                    <Badge variant="outline">{prof.disciplina}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">Não informada</span>
                  )}
                </TableCell>
                <TableCell>
                  {prof.turmas && prof.turmas.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {prof.turmas.map((turma) => (
                        <Badge key={turma.id} variant="secondary">
                          {turma.nome} - {turma.ano}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Sem turmas</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditarProfessor(prof)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProfessorParaExcluir(prof)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditarProfessor
        open={!!editarProfessor}
        onOpenChange={(open) => !open && setEditarProfessor(null)}
        professor={editarProfessor}
        onSuccess={loadProfessores}
      />

      <AlertDialog open={!!professorParaExcluir} onOpenChange={(open) => !open && setProfessorParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o professor {professorParaExcluir?.nome}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
