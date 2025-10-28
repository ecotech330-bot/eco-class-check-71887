
-- Migration: 20251028041431
-- Create enum for user types
CREATE TYPE user_type AS ENUM ('diretor', 'professor', 'aluno');

-- Create enum for presence method
CREATE TYPE presence_method AS ENUM ('qr', 'face', 'manual');

-- Create enum for presence status
CREATE TYPE presence_status AS ENUM ('presente', 'ausente');

-- Create enum for justification type
CREATE TYPE justification_type AS ENUM ('saida_antecipada', 'falta');

-- Create profiles table (extends auth.users with additional info)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo user_type NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Diretor can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND tipo = 'diretor'
    )
  );

CREATE POLICY "Diretor can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND tipo = 'diretor'
    )
  );

CREATE POLICY "Diretor can update profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND tipo = 'diretor'
    )
  );

-- Create turmas table
CREATE TABLE public.turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ano TEXT NOT NULL,
  professor_id UUID REFERENCES public.profiles(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

-- Turmas policies
CREATE POLICY "Diretor can manage all turmas"
  ON public.turmas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND tipo = 'diretor'
    )
  );

CREATE POLICY "Professor can view their turmas"
  ON public.turmas FOR SELECT
  USING (
    professor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND tipo = 'diretor'
    )
  );

-- Create alunos table
CREATE TABLE public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  matricula TEXT NOT NULL UNIQUE,
  turma_id UUID REFERENCES public.turmas(id),
  foto_url TEXT,
  qr_code_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

-- Alunos policies
CREATE POLICY "Diretor can manage all alunos"
  ON public.alunos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND tipo = 'diretor'
    )
  );

CREATE POLICY "Professor can view alunos from their turmas"
  ON public.alunos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.turmas t
      WHERE t.id = alunos.turma_id AND t.professor_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND tipo = 'diretor'
    )
  );

CREATE POLICY "Aluno can view their own data"
  ON public.alunos FOR SELECT
  USING (usuario_id = auth.uid());

CREATE POLICY "Aluno can update their own foto"
  ON public.alunos FOR UPDATE
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- Create presencas table
CREATE TABLE public.presencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TIME NOT NULL DEFAULT CURRENT_TIME,
  metodo presence_method NOT NULL,
  registrado_por UUID REFERENCES public.profiles(id),
  status presence_status NOT NULL DEFAULT 'presente',
  observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;

-- Presencas policies
CREATE POLICY "Diretor can manage all presencas"
  ON public.presencas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND tipo = 'diretor'
    )
  );

CREATE POLICY "Professor can insert presencas for their turmas"
  ON public.presencas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.alunos a
      JOIN public.turmas t ON a.turma_id = t.id
      WHERE a.id = presencas.aluno_id AND t.professor_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND tipo = 'diretor'
    )
  );

CREATE POLICY "Professor can view presencas from their turmas"
  ON public.presencas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.alunos a
      JOIN public.turmas t ON a.turma_id = t.id
      WHERE a.id = presencas.aluno_id AND t.professor_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND tipo = 'diretor'
    )
  );

CREATE POLICY "Aluno can view their own presencas"
  ON public.presencas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.alunos
      WHERE id = presencas.aluno_id AND usuario_id = auth.uid()
    )
  );

-- Create justificativas table
CREATE TABLE public.justificativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  tipo justification_type NOT NULL,
  motivo TEXT NOT NULL,
  aprovado_por UUID REFERENCES public.profiles(id),
  aprovado BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.justificativas ENABLE ROW LEVEL SECURITY;

-- Justificativas policies
CREATE POLICY "Diretor can manage all justificativas"
  ON public.justificativas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND tipo = 'diretor'
    )
  );

CREATE POLICY "Professor can view justificativas from their turmas"
  ON public.justificativas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.alunos a
      JOIN public.turmas t ON a.turma_id = t.id
      WHERE a.id = justificativas.aluno_id AND t.professor_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND tipo = 'diretor'
    )
  );

CREATE POLICY "Aluno can view their own justificativas"
  ON public.justificativas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.alunos
      WHERE id = justificativas.aluno_id AND usuario_id = auth.uid()
    )
  );

CREATE POLICY "Aluno can insert their own justificativas"
  ON public.justificativas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.alunos
      WHERE id = justificativas.aluno_id AND usuario_id = auth.uid()
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, tipo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'tipo')::user_type, 'aluno')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for fotos
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos', 'fotos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for fotos
CREATE POLICY "Diretor can upload fotos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fotos' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND tipo = 'diretor'
    )
  );

CREATE POLICY "Users can view fotos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fotos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Aluno can upload their own foto"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fotos' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Diretor can delete fotos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'fotos' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND tipo = 'diretor'
    )
  );

-- Migration: 20251028042403
-- Remove políticas problemáticas
DROP POLICY IF EXISTS "Diretor can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Diretor can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Diretor can view all profiles" ON public.profiles;

-- Cria função segura para verificar se usuário é diretor (sem recursão)
CREATE OR REPLACE FUNCTION public.is_diretor(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND tipo = 'diretor'
  );
$$;

-- Política para diretor visualizar todos os perfis
CREATE POLICY "Diretor can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_diretor(auth.uid()));

-- Política para diretor inserir perfis
CREATE POLICY "Diretor can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_diretor(auth.uid()));

-- Política para diretor atualizar perfis
CREATE POLICY "Diretor can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_diretor(auth.uid()));

-- Garantir que a função handle_new_user permite inserção sem recursão
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, tipo)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', 'Usuário'),
    COALESCE((new.raw_user_meta_data->>'tipo')::user_type, 'aluno')
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
