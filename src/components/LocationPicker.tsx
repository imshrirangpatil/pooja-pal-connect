import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import { Crosshair, Loader2, Search } from "lucide-react";

// Load Leaflet's stylesheet on the client only, so server rendering never tries
// to resolve it.
function ensureLeafletCss() {
  if (typeof document === "undefined" || document.getElementById("leaflet-css")) return;
  const link = document.createElement("link");
  link.id = "leaflet-css";
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);
}

// A real, key-free location picker built on OpenStreetMap tiles via Leaflet.
// Leaflet touches the DOM, so it is loaded only on the client inside an effect to
// stay safe with server rendering.

export type PickedLocation = {
  lat: number;
  lng: number;
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  label?: string;
};

const DEFAULT_CENTER = { lat: 22.9734, lng: 78.6569 }; // Geographic centre of India.
const MARKER_ICON_BASE = "https://unpkg.com/leaflet@1.9.4/dist/images/";

async function reverseGeocode(lat: number, lng: number): Promise<Partial<PickedLocation>> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return {};
    const json = await res.json();
    const a = json.address ?? {};
    return {
      line1: [a.house_number, a.road, a.neighbourhood].filter(Boolean).join(", ") || undefined,
      city: a.city || a.town || a.village || a.suburb || a.county || undefined,
      state: a.state || undefined,
      pincode: a.postcode || undefined,
      label: json.display_name || undefined,
    };
  } catch {
    return {};
  }
}

export function LocationPicker({
  value,
  onChange,
  height = 240,
}: {
  value?: { lat: number; lng: number } | null;
  onChange: (loc: PickedLocation) => void;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  // Emit a pick and enrich it with a reverse-geocoded address.
  const emit = async (lat: number, lng: number) => {
    onChangeRef.current({ lat, lng });
    setBusy(true);
    const details = await reverseGeocode(lat, lng);
    setBusy(false);
    onChangeRef.current({ lat, lng, ...details });
  };

  useEffect(() => {
    let cancelled = false;
    ensureLeafletCss();
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const start = value ?? DEFAULT_CENTER;
      const map = L.map(containerRef.current).setView([start.lat, start.lng], value ? 15 : 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const icon = L.icon({
        iconUrl: `${MARKER_ICON_BASE}marker-icon.png`,
        iconRetinaUrl: `${MARKER_ICON_BASE}marker-icon-2x.png`,
        shadowUrl: `${MARKER_ICON_BASE}marker-shadow.png`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const marker = L.marker([start.lat, start.lng], { draggable: true, icon }).addTo(map);
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        void emit(p.lat, p.lng);
      });
      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        void emit(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const moveTo = (lat: number, lng: number, zoom = 16) => {
    mapRef.current?.setView([lat, lng], zoom);
    markerRef.current?.setLatLng([lat, lng]);
    void emit(lat, lng);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => moveTo(pos.coords.latitude, pos.coords.longitude),
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setBusy(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`,
        { headers: { Accept: "application/json" } },
      );
      const list = await res.json();
      if (Array.isArray(list) && list[0]) {
        moveTo(parseFloat(list[0].lat), parseFloat(list[0].lon));
      }
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void search(); } }}
            placeholder="Search a place or area"
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3 text-xs font-semibold text-foreground"
        >
          <Crosshair className="h-3.5 w-3.5" /> My location
        </button>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border">
        <div ref={containerRef} style={{ height }} className="w-full" />
        {(!ready || busy) && (
          <div className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-[11px] text-muted-foreground shadow-soft">
            <Loader2 className="h-3 w-3 animate-spin" /> {ready ? "Finding address" : "Loading map"}
          </div>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">Tap the map or drag the pin to set your exact spot.</p>
    </div>
  );
}
