CREATE OR REPLACE FUNCTION delete_own_account() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $body$
BEGIN
  DELETE FROM public.contacts WHERE user_id = auth.uid() OR contact_user_id = auth.uid();
  DELETE FROM public.favorites WHERE user_id = auth.uid() OR target_user_id = auth.uid();
  DELETE FROM public.intents WHERE user_id = auth.uid() OR target_user_id = auth.uid();
  DELETE FROM public.applications WHERE applicant_id = auth.uid();
  DELETE FROM public.votes WHERE voter_id = auth.uid();
  DELETE FROM public.notifications WHERE user_id = auth.uid();
  DELETE FROM public.review_queue WHERE user_id = auth.uid();
  DELETE FROM public.reviews WHERE reviewer_id = auth.uid();
  DELETE FROM public.messages WHERE sender_id = auth.uid();
  DELETE FROM public.user_profiles WHERE id = auth.uid();
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$body$;
