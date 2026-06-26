// Local WebRTC loopback: connects two RTCPeerConnections in the same browser
// so the call is actually transported over WebRTC (SRTP/DTLS). The "remote"
// stream we receive is a simulated peer feed (canvas video + silent audio
// with a soft ambience) - used because we don't have a signaling server yet.
// Replace `buildSimulatedRemoteStream` with a real signaling exchange when
// the backend is ready; the rest of the wiring stays the same.

export type LoopbackHandle = {
  remoteStream: MediaStream;
  pc1: RTCPeerConnection;
  pc2: RTCPeerConnection;
  close: () => void;
};

function buildSimulatedRemoteStream(opts: { video: boolean; label: string; initials: string }) {
  const tracks: MediaStreamTrack[] = [];

  // Silent (or very soft tone) audio track so the audio transceiver is alive.
  const AC: typeof AudioContext =
    (window.AudioContext as typeof AudioContext) ||
    ((window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  const ctx = new AC();
  const dest = ctx.createMediaStreamDestination();
  const g = ctx.createGain();
  g.gain.value = 0.0; // truly silent ambience; could be increased for SFX
  const o = ctx.createOscillator();
  o.frequency.value = 110;
  o.connect(g).connect(dest);
  o.start();
  tracks.push(...dest.stream.getAudioTracks());

  if (opts.video) {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 1138;
    const c = canvas.getContext("2d")!;
    let t = 0;
    const draw = () => {
      t += 0.016;
      const w = canvas.width;
      const h = canvas.height;
      const g1 = c.createLinearGradient(0, 0, 0, h);
      g1.addColorStop(0, "#3a1a0a");
      g1.addColorStop(0.5, "#5a1430");
      g1.addColorStop(1, "#1a0a30");
      c.fillStyle = g1;
      c.fillRect(0, 0, w, h);

      // Soft moving glow
      const cx = w / 2 + Math.sin(t * 0.6) * 60;
      const cy = h / 2 + Math.cos(t * 0.4) * 80;
      const rg = c.createRadialGradient(cx, cy, 20, cx, cy, 360);
      rg.addColorStop(0, "rgba(255,200,120,0.35)");
      rg.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = rg;
      c.fillRect(0, 0, w, h);

      // Avatar circle
      c.beginPath();
      c.arc(w / 2, h / 2 - 60, 130, 0, Math.PI * 2);
      c.fillStyle = "rgba(255,255,255,0.08)";
      c.fill();
      c.lineWidth = 4;
      c.strokeStyle = "rgba(255,255,255,0.25)";
      c.stroke();

      c.fillStyle = "#fff";
      c.font = "bold 96px system-ui, -apple-system, Segoe UI";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(opts.initials, w / 2, h / 2 - 60);

      c.font = "500 30px system-ui, -apple-system, Segoe UI";
      c.fillStyle = "rgba(255,255,255,0.85)";
      c.fillText(opts.label, w / 2, h / 2 + 130);

      c.font = "500 22px system-ui";
      c.fillStyle = "rgba(255,255,255,0.55)";
      c.fillText("● Live", w / 2, h / 2 + 170);
    };
    draw();
    const interval = window.setInterval(draw, 33);
    const stream = (canvas as HTMLCanvasElement).captureStream(30);
    tracks.push(...stream.getVideoTracks());
    // Stop interval when tracks stop
    stream.getVideoTracks().forEach((tr) => {
      tr.addEventListener("ended", () => clearInterval(interval));
    });
  }

  const ms = new MediaStream(tracks);
  return { stream: ms, ctx };
}

export async function startLoopback(opts: {
  localStream: MediaStream;
  video: boolean;
  remoteLabel: string;
  remoteInitials: string;
}): Promise<LoopbackHandle> {
  const pc1 = new RTCPeerConnection();
  const pc2 = new RTCPeerConnection();

  // Wire ICE candidates between the two peers.
  pc1.onicecandidate = (e) => e.candidate && pc2.addIceCandidate(e.candidate).catch(() => undefined);
  pc2.onicecandidate = (e) => e.candidate && pc1.addIceCandidate(e.candidate).catch(() => undefined);

  // Local user → pc1
  opts.localStream.getTracks().forEach((t) => pc1.addTrack(t, opts.localStream));

  // Simulated remote → pc2
  const sim = buildSimulatedRemoteStream({
    video: opts.video,
    label: opts.remoteLabel,
    initials: opts.remoteInitials,
  });
  sim.stream.getTracks().forEach((t) => pc2.addTrack(t, sim.stream));

  // What pc1 receives from pc2 = the remote stream we render.
  const remoteStream = new MediaStream();
  pc1.ontrack = (e) => {
    e.streams[0]?.getTracks().forEach((tr) => remoteStream.addTrack(tr));
  };

  const offer = await pc1.createOffer();
  await pc1.setLocalDescription(offer);
  await pc2.setRemoteDescription(offer);
  const answer = await pc2.createAnswer();
  await pc2.setLocalDescription(answer);
  await pc1.setRemoteDescription(answer);

  const close = () => {
    try {
      pc1.getSenders().forEach((s) => s.track && s.track.stop());
      pc2.getSenders().forEach((s) => s.track && s.track.stop());
      pc1.close();
      pc2.close();
      sim.ctx.close();
    } catch {
      /* noop */
    }
  };

  return { remoteStream, pc1, pc2, close };
}
