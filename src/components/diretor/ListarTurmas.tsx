import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Turma {
  id: string;
  nome: string;
  ano: string;
  profiles: {
    nome: string;
  } | null;
  alunos: { id: string }[];
}

export default function ListarTurmas() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTurmas();
  }, []);

  const loadTurmas = async () => {
    try {
      const { data, error } = await supabase
        .from("turmas")
        .select(`
          id,
          nome,
          ano,
          profiles!turmas_professor_id_fkey (nome),
          alunos (id)
        `)
        .order("nome");

      if (error) throw error;
      setTurmas(data as any || []);
    } catch (error) {
      console.error("Erro ao carregar turmas:", error);
      toast.error("Erro ao carregar turmas");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (turmas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma turma cadastrada ainda.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Turma</TableHead>
            <TableHead>Ano Letivo</TableHead>
            <TableHead>Professor</TableHead>
            <TableHead>Alunos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {turmas.map((turma) => (
            <TableRow key={turma.id}>
              <TableCell className="font-medium">{turma.nome}</TableCell>
              <TableCell>{turma.ano}</TableCell>
              <TableCell>
                {turma.profiles ? (
                  turma.profiles.nome
                ) : (
                  <span className="text-muted-foreground text-sm">Sem professor</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {turma.alunos?.length || 0} aluno(s)
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
