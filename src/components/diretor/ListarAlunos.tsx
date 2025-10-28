import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Aluno {
  id: string;
  matricula: string;
  foto_url: string | null;
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Foto</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Matrícula</TableHead>
            <TableHead>Turma</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
