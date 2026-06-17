-- Trigger to insert admin notification when a new user signs up
CREATE OR REPLACE FUNCTION public.notify_admins_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Get all admin user IDs
  INSERT INTO public.notifications (user_id, type, title, body, data)
  SELECT 
    ur.user_id,
    'new_user',
    'Nouvel utilisateur inscrit',
    'Un nouvel utilisateur a créé un compte: ' || COALESCE(NEW.full_name, NEW.email),
    jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'full_name', COALESCE(NEW.full_name, 'Sans nom'),
      'created_at', NEW.created_at
    )
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::public.app_role;
  
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_new_user_created_notify_admin ON public.profiles;
CREATE TRIGGER on_new_user_created_notify_admin
AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_user();
