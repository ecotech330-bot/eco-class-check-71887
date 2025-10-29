-- Atualizar o trigger para incluir disciplina ao criar professor
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nome, tipo, disciplina)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', 'Usuário'),
    COALESCE((new.raw_user_meta_data->>'tipo')::user_type, 'aluno'),
    new.raw_user_meta_data->>'disciplina'
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$function$;