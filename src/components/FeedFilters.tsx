"use client";

import { useState, useEffect, useRef } from "react";
import { RANGE_OPTIONS } from "@/lib/geo";
import type { FeedFilters } from "@/types";

interface FeedFiltersProps {
  filters: FeedFilters;
  onChange: (filters: FeedFilters) => void;
}

export default function FeedFiltersComponent({
  filters,
  onChange,
}: FeedFiltersProps) {
  const [search, setSearch] = useState(filters.search ?? "");
  const [expanded, setExpanded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (search !== (filters.search ?? "")) {
        onChange({ ...filters, search });
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const postTypes = [
    { value: "all", label: "All" },
    { value: "text", label: "Text Only" },
    { value: "image", label: "Images Only" },
  ] as const;

  const userTypes = [
    { value: "all", label: "All Users" },
    { value: "registered", label: "Registered Only" },
  ] as const;

  return (
    <div className="rounded-xl border border-brand-800/50 bg-brand-900/50 backdrop-blur p-3">
      {/* Search + toggle row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-lg bg-brand-950/50 border border-brand-800/50 pl-9 pr-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="md:hidden flex items-center gap-1 rounded-lg border border-brand-800/50 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          Filters
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Filter options */}
      <div
        className={`mt-3 flex flex-wrap items-center gap-3 ${
          expanded ? "flex" : "hidden md:flex"
        }`}
      >
        {/* Range */}
        <div className="flex items-center gap-1.5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 text-gray-500"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <select
            value={filters.range ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                range: e.target.value ? Number(e.target.value) : 0,
              })
            }
            className="rounded-lg bg-brand-950/50 border border-brand-800/50 px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-brand-500"
          >
            {RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Post type */}
        <div className="flex rounded-lg border border-brand-800/50 overflow-hidden">
          {postTypes.map((type) => (
            <button
              key={type.value}
              onClick={() =>
                onChange({ ...filters, postType: type.value })
              }
              className={`px-2.5 py-1 text-xs transition-colors ${
                (filters.postType ?? "all") === type.value
                  ? "bg-brand-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* User type */}
        <div className="flex rounded-lg border border-brand-800/50 overflow-hidden">
          {userTypes.map((type) => (
            <button
              key={type.value}
              onClick={() =>
                onChange({ ...filters, userType: type.value })
              }
              className={`px-2.5 py-1 text-xs transition-colors ${
                (filters.userType ?? "all") === type.value
                  ? "bg-brand-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
