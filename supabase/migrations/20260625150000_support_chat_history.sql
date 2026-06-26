-- Persist the support assistant conversation for signed-in users so it syncs
-- across their devices. Support chat is plain text (unlike astrology chat, which
-- is end to end encrypted on device).

CREATE TABLE public.support_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX support_chat_user_idx ON public.support_chat_messages(user_id, created_at);

GRANT SELECT, INSERT, DELETE ON public.support_chat_messages TO authenticated;
GRANT ALL ON public.support_chat_messages TO service_role;

ALTER TABLE public.support_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own support chat"
  ON public.support_chat_messages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own support chat"
  ON public.support_chat_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can clear own support chat"
  ON public.support_chat_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all support chat"
  ON public.support_chat_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
