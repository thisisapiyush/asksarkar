export function Seal({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle
        cx="20"
        cy="20"
        r="18.5"
        fill="none"
        stroke="#C0362C"
        strokeWidth="1.6"
      />
      <circle
        cx="20"
        cy="20"
        r="14"
        fill="none"
        stroke="#C0362C"
        strokeWidth="0.8"
        strokeDasharray="2 2.6"
      />
      <path
        d="M20 9 l3.1 6.6 7.1 1 -5.2 5.2 1.3 7.2 -6.3 -3.5 -6.3 3.5 1.3 -7.2 -5.2 -5.2 7.1 -1z"
        fill="#C0362C"
        opacity="0.9"
      />
    </svg>
  );
}
