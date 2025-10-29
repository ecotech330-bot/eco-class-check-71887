-- Drop existing policies on alunos table
DROP POLICY IF EXISTS "Diretor can manage all alunos" ON public.alunos;
DROP POLICY IF EXISTS "Aluno can view their own data" ON public.alunos;
DROP POLICY IF EXISTS "Aluno can update their own foto" ON public.alunos;
DROP POLICY IF EXISTS "Professor can view alunos from their turmas" ON public.alunos;

-- Recreate policies using the security definer function
CREATE POLICY "Diretor can manage all alunos"
ON public.alunos
FOR ALL
USING (public.is_diretor(auth.uid()))
WITH CHECK (public.is_diretor(auth.uid()));

CREATE POLICY "Aluno can view their own data"
ON public.alunos
FOR SELECT
USING (usuario_id = auth.uid());

CREATE POLICY "Aluno can update their own foto"
ON public.alunos
FOR UPDATE
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Professor can view alunos from their turmas"
ON public.alunos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.turmas t
    WHERE t.id = alunos.turma_id 
    AND t.professor_id = auth.uid()
  )
  OR public.is_diretor(auth.uid())
);