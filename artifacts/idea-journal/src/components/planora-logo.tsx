interface PlanoraLogoProps {
  size?: number;
  className?: string;
}

export function PlanoraLogo({ size = 40, className = "" }: PlanoraLogoProps) {
  const radius = Math.round(size * 0.28);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
      aria-label="Planora"
    >
      <rect width="40" height="40" rx={radius} fill="#3a8ea6" />
      <text
        x="20"
        y="28"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="bold"
        fontSize="24"
        fill="white"
        letterSpacing="-1"
      >
        P
      </text>
      <circle cx="27" cy="27" r="2.5" fill="white" opacity="0.85" />
    </svg>
  );
}
