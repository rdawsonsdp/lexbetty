'use client';

export default function BettyAILogo({ size = 120, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer circle - dark charcoal */}
      <circle cx="100" cy="100" r="96" fill="#1A1A1A" />

      {/* Inner circle - smokehouse orange ring */}
      <circle cx="100" cy="100" r="88" fill="none" stroke="#E8621A" strokeWidth="3" />

      {/* Chat bubble body */}
      <path
        d="M50 75 C50 61 61 50 75 50 L125 50 C139 50 150 61 150 75 L150 115 C150 129 139 140 125 140 L90 140 L70 158 L74 140 L75 140 C61 140 50 129 50 115 Z"
        fill="#E8621A"
      />

      {/* AI sparkle dots inside bubble */}
      <circle cx="80" cy="95" r="6" fill="white" />
      <circle cx="100" cy="95" r="6" fill="white" />
      <circle cx="120" cy="95" r="6" fill="white" />

      {/* Small sparkle/star accents */}
      <path d="M135 60 L137 66 L143 68 L137 70 L135 76 L133 70 L127 68 L133 66 Z" fill="white" opacity="0.9" />
      <path d="M60 62 L61.5 66 L65.5 67.5 L61.5 69 L60 73 L58.5 69 L54.5 67.5 L58.5 66 Z" fill="white" opacity="0.7" />

      {/* "BETTY" text */}
      <text
        x="100"
        y="182"
        textAnchor="middle"
        fill="#F5EDE0"
        fontFamily="'Oswald', sans-serif"
        fontWeight="700"
        fontSize="20"
        letterSpacing="4"
      >
        BETTY AI
      </text>
    </svg>
  );
}
