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

export function LocationGate({ children }: LocationGateProps) {
  const [location, setLocation] = useState<LocationContextValue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    // Initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError(
              "Location permission denied. Chatterfall needs your location to show nearby posts. Please enable location access in your browser settings."
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setError(
              "Location unavailable. Please check your device settings and try again."
            );
            break;
          case err.TIMEOUT:
            setError(
              "Location request timed out. Please refresh the page and try again."
            );
            break;
          default:
            setError("An unknown error occurred while getting your location.");
        }
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );

    // Watch for updates every 5 minutes via watchPosition
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        // silently ignore watch errors if we already have a position
      },
      { enableHighAccuracy: false, maximumAge: 300000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (loading) {
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

  if (error) {
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
            Location Required
          </h2>
          <p className="text-sm text-gray-300">{error}</p>
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
    <LocationContext.Provider value={location!}>
      {children}
    </LocationContext.Provider>
  );
}
