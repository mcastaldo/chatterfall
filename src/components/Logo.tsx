interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Chatterfall mark — modernized "incognito guy" with fedora, round glasses,
 * and handlebar mustache. Uses currentColor so it matches text color.
 */
export default function Logo({ className = "", size = 28 }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      className={className}
      aria-label="Chatterfall"
      role="img"
    >
      {/* Fedora crown: softened pentagonal shape with a subtle center crease */}
      <path
        d="M14 28
           C 14 24, 18 18, 22 16
           L 28 21
           L 32 13
           L 36 21
           L 42 16
           C 46 18, 50 24, 50 28
           Z"
        fill="currentColor"
        strokeLinejoin="round"
        strokeWidth="1"
      />

      {/* Fedora brim: clean horizontal pill */}
      <rect
        x="8"
        y="28"
        width="48"
        height="4"
        rx="2"
        fill="currentColor"
      />

      {/* Round glasses */}
      <circle cx="24" cy="40" r="5" strokeWidth="2.5" />
      <circle cx="40" cy="40" r="5" strokeWidth="2.5" />

      {/* Bridge */}
      <path
        d="M29 40 Q32 38 35 40"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Handlebar mustache */}
      <path
        d="M22 50
           C 24 53, 28 54, 32 51
           C 36 54, 40 53, 42 50
           C 41 48, 39 47, 37 48
           C 35 49, 33 49, 32 48
           C 31 49, 29 49, 27 48
           C 25 47, 23 48, 22 50 Z"
        fill="currentColor"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
