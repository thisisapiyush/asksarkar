export function Seal({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 52"
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      {/* Nepal's double-pennant flag */}
      {/* Blue border */}
      <polygon
        points="5,0 5,32 20,24 20,52 38,38 38,0 20,14"
        fill="#003893"
      />
      {/* Crimson fill */}
      <polygon
        points="7,2 7,30.5 20,23.5 20,49.5 36,37 36,2 20,13"
        fill="#DC143C"
      />
      {/* Moon — crescent at top pennant */}
      <circle cx="18" cy="8.5" r="3.5" fill="white" />
      <circle cx="19.2" cy="7.8" r="2.8" fill="#DC143C" />
      {/* Sun — 12-point star at bottom pennant */}
      <g transform="translate(17, 28)">
        <circle cx="0" cy="0" r="2.2" fill="white" />
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x2 = Math.cos(angle) * 4.2;
          const y2 = Math.sin(angle) * 4.2;
          return (
            <line
              key={i}
              x1={Math.cos(angle) * 2.5}
              y1={Math.sin(angle) * 2.5}
              x2={x2}
              y2={y2}
              stroke="white"
              strokeWidth="0.9"
            />
          );
        })}
      </g>
    </svg>
  );
}
