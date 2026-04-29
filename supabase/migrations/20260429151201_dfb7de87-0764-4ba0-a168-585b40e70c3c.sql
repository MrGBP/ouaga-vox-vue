-- 1) Ajouter la valeur 'owner' à l'enum app_role (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'owner'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'owner';
  END IF;
END$$;

-- 2) Étendre la table messages pour supporter les threads de modération de biens
ALTER TABLE public.messages
  ALTER COLUMN reservation_id DROP NOT NULL;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS property_id uuid;

-- Vérifier qu'au moins un contexte est fourni
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_context_check'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_context_check
      CHECK (reservation_id IS NOT NULL OR property_id IS NOT NULL);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_messages_property_id ON public.messages(property_id);

-- 3) Helper SECURITY DEFINER pour vérifier la propriété d'un bien (évite récursion RLS)
CREATE OR REPLACE FUNCTION public.is_property_owner(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = _property_id AND owner_id = _user_id
  )
$$;

-- 4) RLS supplémentaires sur messages pour les threads liés à un bien
DROP POLICY IF EXISTS "Property owner reads property messages" ON public.messages;
CREATE POLICY "Property owner reads property messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  property_id IS NOT NULL
  AND public.is_property_owner(auth.uid(), property_id)
);

DROP POLICY IF EXISTS "Property owner sends property messages" ON public.messages;
CREATE POLICY "Property owner sends property messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  property_id IS NOT NULL
  AND public.is_property_owner(auth.uid(), property_id)
  AND sender_id = auth.uid()
);