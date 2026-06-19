import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mic, MicOff, Phone, Video, VideoOff, Volume2, MessageCircle, Sparkles } from "lucide-react";
import { astrologers } from "@/lib/data";
import { z } from "zod";

export const Route = createFileRoute("/astrology/call/$id")({
  validateSearch: (s: Record<string, unknown>) =>
    z.object({ mode: z.enum(["audio", "video"]).default("audio") }).parse(s),
  head: () => ({ meta: [{ title: "Live call — Pranam Astrology" }] }),
  component: CallPage,
  notFoundComponent: () => (
    <div className="p-6 text-center text-sm text-muted-foreground">Astrologer not found.</div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-6 text-center text-sm text-muted-foreground">Something went wrong: {error.message}</div>
  ),
});

const FREE_SECONDS = 300;
type Status = "connecting" | "ringing" | "in-call" | "ended";

function CallPage() {
  const { id } = Route.useParams();
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const astrologer = astrologers.find((a) => a.id === id);
  if (!astrologer) throw notFound();

  const isVideo = mode === "video";
  const [status, setStatus] = useState<Status>("connecting");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number>(0);

  // Acquire mic/cam.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideo ? { facingMode: "user", width: 720, height: 1280 } : false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (isVideo && localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setStatus("ringing");
        // Simulate astrologer pickup after a short delay.
        const t = setTimeout(() => {
          if (cancelled) return;
          setStatus("in-call");
          startedAtRef.current = Date.now();
        }, 1800);
        return () => clearTimeout(t);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Could not access microphone/camera.";
        setError(msg);
        setStatus("ended");
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [isVideo]);

  // Timer.
  useEffect(() => {
    if (status !== "in-call") return;
    const tick = () => setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [status]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
  };
  const toggleCam = () => {
    if (!isVideo) return;
    const next = !camOff;
    setCamOff(next);
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !next));
  };

  const endCall = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStatus("ended");
    setTimeout(() => navigate({ to: "/astrology" }), 500);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const freeLeft = Math.max(0, FREE_SECONDS - seconds);
  const isFree = freeLeft > 0;

  const statusLabel =
    status === "connecting"
      ? "Connecting…"
      : status === "ringing"
        ? "Ringing…"
        : status === "in-call"
          ? `${mm}:${ss}`
          : "Call ended";

  return (
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-black text-white">
      {/* Remote (simulated) backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900 via-rose-900 to-purple-950" />
      <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_30%_20%,rgba(255,200,100,0.4),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(180,70,255,0.35),transparent_60%)]" />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 px-3 pt-4 pb-3">
        <Link to="/astrology" className="rounded-full p-1.5 hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 text-center">
          <p className="text-[11px] uppercase tracking-wider text-white/70">
            {isVideo ? "Video call" : "Voice call"} • End-to-end encrypted
          </p>
          <p className="text-xs font-medium text-white/90">{statusLabel}</p>
        </div>
        <Link
          to="/astrology/chat/$id"
          params={{ id: astrologer.id }}
          className="rounded-full bg-white/10 p-2 hover:bg-white/20"
          aria-label="Switch to chat"
        >
          <MessageCircle className="h-4 w-4" />
        </Link>
      </header>

      {/* Astrologer identity */}
      <div className="relative z-10 mt-6 flex flex-col items-center px-6 text-center">
        <div className="relative">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-warm text-3xl font-bold text-primary-foreground shadow-2xl ring-4 ring-white/10">
            {astrologer.initials}
          </div>
          {status === "ringing" && (
            <span className="absolute inset-0 animate-ping rounded-full ring-2 ring-white/30" />
          )}
        </div>
        <h1 className="mt-5 text-2xl font-bold">{astrologer.name}</h1>
        <p className="mt-1 text-sm text-white/70">{astrologer.expertise}</p>
        <div
          className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
            isFree ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/80"
          }`}
        >
          <Sparkles className="h-3 w-3" />
          {isFree
            ? `Free for ${Math.floor(freeLeft / 60)}:${String(freeLeft % 60).padStart(2, "0")}`
            : `Billing ₹${astrologer.pricePerMin}/min`}
        </div>
      </div>

      {/* Local video preview */}
      {isVideo && (
        <div className="absolute right-4 top-20 z-20 h-40 w-28 overflow-hidden rounded-2xl border border-white/20 bg-black/60 shadow-xl">
          {camOff ? (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-white/60">
              Camera off
            </div>
          ) : (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full -scale-x-100 object-cover"
            />
          )}
        </div>
      )}

      {error && (
        <div className="relative z-10 mx-6 mt-4 rounded-xl border border-red-400/40 bg-red-500/15 px-3 py-2 text-center text-[11px] text-red-200">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="relative z-10 mt-auto px-6 pb-10">
        <div className="flex items-center justify-around rounded-3xl border border-white/10 bg-black/40 px-4 py-4 backdrop-blur-xl">
          <button
            onClick={toggleMute}
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              muted ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
            }`}
            aria-label="Toggle mute"
          >
            {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {isVideo ? (
            <button
              onClick={toggleCam}
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                camOff ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
              }`}
              aria-label="Toggle camera"
            >
              {camOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </button>
          ) : (
            <button
              onClick={() => setSpeaker((s) => !s)}
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                speaker ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
              }`}
              aria-label="Toggle speaker"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={endCall}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600"
            aria-label="End call"
          >
            <Phone className="h-5 w-5 rotate-[135deg]" />
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-white/50">
          {isVideo ? "Video" : "Audio"} streamed peer-to-peer • Tap end to disconnect
        </p>
      </div>
    </div>
  );
}
