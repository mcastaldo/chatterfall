"use client";

interface NewMessagesPillProps {
  count: number;
  onClick: () => void;
  visible: boolean;
}

export default function NewMessagesPill({
  count,
  onClick,
  visible,
}: NewMessagesPillProps) {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium shadow-lg shadow-brand-500/25 transition-all animate-in fade-in slide-in-from-bottom-2"
    >
      <span>
        {count} new message{count !== 1 ? "s" : ""}
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-4 h-4"
      >
        <path
          fillRule="evenodd"
          d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}
