"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface LocationContextValue {
  lat: number;
  lon: number;
  approximate: boolean;
  city?: string | null;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocation must be used within a LocationGate");
  }
  return ctx;
}

interface LocationGateProps {
  children: ReactNode;
}

type Status =
  | { kind: "loading" }
  | { kind: "ok"; location: LocationContextValue }
  | { kind: "error"; message: string };

export function LocationGate({ children }: LocationGateProps) {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    const fallbackToIp = async (reason: string) => {
      try {
        const res = await fetch("/api/iplocation");
        if (!res.ok) throw new Error("ip lookup failed");
        const data = await res.json();
        if (cancelled) return;
        setStatus({
          kind: "ok",
          location: {
            lat: data.lat,
            lon: data.lon,
            approximate: true,
            city: data.city,
          },
        });
      } catch {
        if (cancelled) return;
        setStatus({
          kind: "error",
          message: reason,
        });
      }
    };

    if (!navigator.geolocation) {
      fallbackToIp(
        "Geolocation is not supported by your browser, and we couldn't determine your location from your IP."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setStatus({
          kind: "ok",
          location: {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            approximate: false,
          },
        });
      },
      () => {
        // Any error (denied, unavailable, timeout) — fall back to IP
        fallbackToIp(
          "We couldn't determine your location. Please enable location in your browser, or try again later."
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );

    // Keep watching for GPS updates in case permission is granted later
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (cancelled) return;
        setStatus({
          kind: "ok",
          location: {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            approximate: false,
          },
        });
      },
      () => {
        // silently ignore watch errors
      },
      { enableHighAccuracy: false, maximumAge: 300000 }
    );

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  if (status.kind === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-950">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <div>
            <p className="text-lg font-medium text-white">
              Getting your location...
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Chatterfall uses your location to show nearby posts
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status.kind === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-950">
        <div className="mx-auto max-w-md rounded-xl border border-brand-800/50 bg-brand-900/50 backdrop-blur p-6 text-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-4 h-12 w-12 text-brand-500"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <h2 className="text-lg font-semibold text-white mb-2">
            Location Unavailable
          </h2>
          <p className="text-sm text-gray-300">{status.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <LocationContext.Provider value={status.location}>
      {children}
    </LocationContext.Provider>
  );
}
