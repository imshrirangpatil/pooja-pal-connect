
CREATE TABLE public.astro_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  astrologer_id TEXT NOT NULL,
  astrologer_name TEXT NOT NULL,
  price_per_min INTEGER NOT NULL DEFAULT 0,
  encryption_salt TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  seconds_elapsed INTEGER NOT NULL DEFAULT 0,
  billed_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.astro_chat_sessions TO authenticated;
GRANT ALL ON public.astro_chat_sessions TO service_role;
ALTER TABLE public.astro_chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own chat sessions"
  ON public.astro_chat_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.astro_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.astro_chat_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user','astrologer','system')),
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.astro_chat_messages TO authenticated;
GRANT ALL ON public.astro_chat_messages TO service_role;
ALTER TABLE public.astro_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own chat messages"
  ON public.astro_chat_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.astro_chat_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));
CREATE POLICY "Users insert messages in own sessions"
  ON public.astro_chat_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.astro_chat_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));
CREATE POLICY "Users delete own chat messages"
  ON public.astro_chat_messages FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.astro_chat_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));

CREATE INDEX idx_astro_chat_sessions_user ON public.astro_chat_sessions(user_id, started_at DESC);
CREATE INDEX idx_astro_chat_messages_session ON public.astro_chat_messages(session_id, created_at);

CREATE TRIGGER trg_astro_chat_sessions_updated
  BEFORE UPDATE ON public.astro_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
