import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import EditarAluno from "./EditarAluno";

interface Aluno {
  id: string;
  matricula: string;
  foto_url: string | null;
  usuario_id: string;
  turma_id: string | null;
  profiles: {
    nome: string;
  };
  turmas: {
    nome: string;
    ano: string;
  } | null;
}

export default function ListarAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [editarAluno, setEditarAluno] = useState<Aluno | null>(null);

  useEffect(() => {
    loadAlunos();
  }, []);

  const loadAlunos = async () => {
    try {
      const { data, error } = await supabase
        .from("alunos")
        .select(`
          id,
          matricula,
          foto_url,
          usuario_id,
          turma_id,
          profiles!alunos_usuario_id_fkey (nome),
          turmas (nome, ano)
        `)
        .order("matricula");

      if (error) throw error;
      setAlunos(data as any || []);
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
      toast.error("Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (alunos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum aluno cadastrado ainda.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Foto</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunos.map((aluno) => (
              <TableRow key={aluno.id}>
                <TableCell>
                  <Avatar>
                    <AvatarImage src={aluno.foto_url || undefined} />
                    <AvatarFallback>{aluno.profiles?.nome?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{aluno.profiles?.nome}</TableCell>
                <TableCell>{aluno.matricula}</TableCell>
                <TableCell>
                  {aluno.turmas ? (
                    <Badge variant="secondary">
                      {aluno.turmas.nome} - {aluno.turmas.ano}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">Sem turma</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditarAluno(aluno)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Alterar Turma
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditarAluno
        open={!!editarAluno}
        onOpenChange={(open) => !open && setEditarAluno(null)}
        aluno={editarAluno}
        onSuccess={loadAlunos}
      />
    </>
  );
}
