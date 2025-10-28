import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Professor {
  id: string;
  nome: string;
  turmas: {
    id: string;
    nome: string;
    ano: string;
  }[];
}

export default function ListarProfessores() {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (professores.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum professor cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Turmas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {professores.map((prof) => (
            <TableRow key={prof.id}>
              <TableCell className="font-medium">{prof.nome}</TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
