"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { PostWithMeta } from "@/types";

// Leaflet CSS is loaded via link tag in layout to avoid SSR issues
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPanelProps {
  posts: PostWithMeta[];
  userLat: number;
  userLon: number;
  radius: number; // meters, 0 = no circle
  onLocationChange: (lat: number, lon: number) => void;
  onClose: () => void;
}

// Fix Leaflet default marker icons (they break in bundlers)
const defaultIcon = L.divIcon({
  html: `<svg viewBox="0 0 24 24" fill="#7044ff" stroke="#fff" stroke-width="1.5" width="24" height="24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg>`,
  className: "leaflet-marker-custom",
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

const userIcon = L.divIcon({
  html: `<svg viewBox="0 0 24 24" fill="#ef4444" stroke="#fff" stroke-width="1.5" width="28" height="28"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg>`,
  className: "leaflet-marker-custom",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

export default function MapPanel({
  posts,
  userLat,
  userLon,
  radius,
  onLocationChange,
  onClose,
}: MapPanelProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const centerMarkerRef = useRef<L.Marker | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [centerLat, setCenterLat] = useState(userLat);
  const [centerLon, setCenterLon] = useState(userLon);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userLat, userLon],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // User location marker (red)
    L.marker([userLat, userLon], { icon: userIcon })
      .addTo(map)
      .bindPopup("Your location");

    // Draggable center marker for selecting area
    const centerMarker = L.marker([userLat, userLon], {
      icon: L.divIcon({
        html: `<div style="width:20px;height:20px;border-radius:50%;background:#7044ff;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:grab;"></div>`,
        className: "leaflet-marker-custom",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
      draggable: true,
    }).addTo(map);
    centerMarkerRef.current = centerMarker;

    // Radius circle
    const circle = L.circle([userLat, userLon], {
      radius: radius || 1609, // Default 1 mile if no radius
      color: "#7044ff",
      fillColor: "#7044ff",
      fillOpacity: 0.1,
      weight: 2,
      dashArray: "5, 10",
    }).addTo(map);
    circleRef.current = circle;

    // Posts markers layer
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Handle dragging the center marker
    centerMarker.on("dragend", () => {
      const pos = centerMarker.getLatLng();
      setCenterLat(pos.lat);
      setCenterLon(pos.lng);
      circle.setLatLng(pos);
      onLocationChange(pos.lat, pos.lng);
    });

    // Handle clicking on the map to move the center
    map.on("click", (e: L.LeafletMouseEvent) => {
      centerMarker.setLatLng(e.latlng);
      circle.setLatLng(e.latlng);
      setCenterLat(e.latlng.lat);
      setCenterLon(e.latlng.lng);
      onLocationChange(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    // Force a resize after mount (fixes gray tiles)
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update circle radius when filter changes
  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setRadius(radius || 1609);

    // Adjust zoom to fit the circle
    if (mapRef.current && radius > 0) {
      mapRef.current.fitBounds(circleRef.current.getBounds(), { padding: [20, 20] });
    }
  }, [radius]);

  // Update post markers when posts change
  const updateMarkers = useCallback(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    posts.forEach((post) => {
      if (post.lat && post.lon) {
        const marker = L.marker([post.lat, post.lon], { icon: defaultIcon });

        const preview = post.content.length > 80
          ? post.content.substring(0, 80) + "..."
          : post.content;
        const author = post.anonymous ? "Anonymous" : post.author?.displayName || "Unknown";

        marker.bindPopup(
          `<div style="max-width:200px;">
            <strong style="font-size:12px;">${author}</strong>
            <p style="font-size:11px;margin:4px 0 0;color:#444;">${preview}</p>
          </div>`
        );

        markersLayerRef.current!.addLayer(marker);
      }
    });
  }, [posts]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-800">
        <div>
          <h3 className="text-sm font-semibold text-white">Explore Map</h3>
          <p className="text-xs text-gray-400">
            Click or drag the marker to filter posts by area
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M18 6L6 18" /><path d="M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Map */}
      <div ref={mapContainerRef} className="flex-1 min-h-0" />

      {/* Footer info */}
      <div className="px-4 py-2 border-t border-brand-800 bg-brand-950/80">
        <p className="text-xs text-gray-400">
          Center: {centerLat.toFixed(4)}, {centerLon.toFixed(4)} •{" "}
          {radius > 0
            ? radius >= 1609
              ? `${(radius / 1609).toFixed(1)} mi radius`
              : `${Math.round(radius)} m radius`
            : "All posts"
          } •{" "}
          {posts.length} post{posts.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
