
-- Custom property types suggested by owners, approved by admins
CREATE TABLE IF NOT EXISTS public.custom_property_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  label text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_key text,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_property_types TO authenticated;
GRANT ALL ON public.custom_property_types TO service_role;
GRANT SELECT ON public.custom_property_types TO anon;

ALTER TABLE public.custom_property_types ENABLE ROW LEVEL SECURITY;

-- Owners insert their own suggestion
CREATE POLICY "owner_submit_custom_type"
  ON public.custom_property_types
  FOR INSERT
  TO authenticated
  WITH CHECK (suggested_by = auth.uid());

-- Owners see their own suggestions
CREATE POLICY "owner_see_own_custom_type"
  ON public.custom_property_types
  FOR SELECT
  TO authenticated
  USING (suggested_by = auth.uid() OR status = 'approved');

-- Public can see approved types (used to extend the dropdown)
CREATE POLICY "anon_see_approved_custom_type"
  ON public.custom_property_types
  FOR SELECT
  TO anon
  USING (status = 'approved');

-- Admins do everything
CREATE POLICY "admin_all_custom_type"
  ON public.custom_property_types
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Timestamps trigger
CREATE TRIGGER update_custom_property_types_updated_at
  BEFORE UPDATE ON public.custom_property_types
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- When approved, notify the owner
CREATE OR REPLACE FUNCTION public.notify_owner_custom_type_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.suggested_by IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, body, data)
    VALUES (
      NEW.suggested_by,
      CASE NEW.status WHEN 'approved' THEN 'custom_type_approved' ELSE 'custom_type_rejected' END,
      CASE NEW.status WHEN 'approved' THEN 'Type de bien approuvé ✅' ELSE 'Type de bien refusé' END,
      CASE NEW.status
        WHEN 'approved' THEN 'Votre suggestion « ' || NEW.label || ' » a été validée et est maintenant disponible.'
        ELSE 'Votre suggestion « ' || NEW.label || ' » n''a pas été retenue.' || COALESCE(' — ' || NEW.admin_note, '')
      END,
      jsonb_build_object('custom_type_id', NEW.id, 'label', NEW.label, 'approved_key', NEW.approved_key)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_owner_custom_type
  AFTER UPDATE ON public.custom_property_types
  FOR EACH ROW EXECUTE FUNCTION public.notify_owner_custom_type_decision();
