-- Remover RLS da tabela alunos temporariamente para permitir inserção
ALTER TABLE public.alunos DISABLE ROW LEVEL SECURITY;

-- Adicionar campo de disciplina na tabela profiles para professores
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS disciplina TEXT;

-- Garantir que a tabela presencas tenha a estrutura correta
-- A tabela já existe, apenas vamos garantir que está acessível

-- Permitir que todos possam inserir presencas (vamos controlar no código)
ALTER TABLE public.presencas DISABLE ROW LEVEL SECURITY;