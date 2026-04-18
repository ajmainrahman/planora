interface PlanoraLogoProps {
  size?: number;
  className?: string;
}

export function PlanoraLogo({ size = 40, className = "" }: PlanoraLogoProps) {
  return (
    <div
      className={`rounded-2xl bg-[#2d7d6f] flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        style={{ width: size * 0.55, height: size * 0.55 }}
        fill="none"
        stroke="white"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 18h6M10 22h4" />
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8a6 6 0 10-12 0 4.65 4.65 0 001.5 3.5c.75.76 1.23 1.52 1.41 2.5" />
      </svg>
    </div>
  );
}
