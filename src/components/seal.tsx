export function Seal({ size = 34 }: { size?: number }) {
  const h = size;
  const w = size * (71.571 / 87.246);
  return (
    <svg
      width={w}
      height={h}
      viewBox="-17.582 -4.664 71.571 87.246"
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path
        d="M -15,37.5735931288 h 60 L -15,0 v 80 h 60 L -15,20 z"
        fill="#DC143C"
        stroke="#003893"
        strokeWidth="5.165"
      />
      <g fill="#fff">
        <path d="M -11.9502769431,23.4834957055 A 12.8400974233,12.8400974233 0 0,0 11.9502769431,23.4834957055 A 11.9502769431 11.9502769431 0 0,1 -11.9502769431,23.4834957055" />
        <g transform="translate(0 29.045) scale(5.56106)">
          <circle r="1" />
          <g id="seal-d">
            <g id="seal-c">
              <path
                id="seal-b"
                d="M 0.195090322016,-0.980785280403 L 0,-1.388784109750 L -0.195090322016,-0.980785280403"
                transform="rotate(11.25)"
              />
              <use xlinkHref="#seal-b" transform="rotate(22.5)" />
              <use xlinkHref="#seal-b" transform="rotate(45)" />
            </g>
            <use xlinkHref="#seal-c" transform="rotate(67.5)" />
          </g>
          <use xlinkHref="#seal-d" transform="scale(-1 1)" />
        </g>
        <g transform="matrix(8.1434 0 0 8.1434 0 58.787)">
          <circle r="1" />
          <g id="seal-g">
            <g id="seal-f">
              <path
                id="seal-e"
                d="M 0.258819045103,0.965925826289 L 0,1.576749285537 L -0.258819045103,0.965925826289"
              />
              <use xlinkHref="#seal-e" transform="rotate(180)" />
            </g>
            <use xlinkHref="#seal-f" transform="rotate(90)" />
          </g>
          <use xlinkHref="#seal-g" transform="rotate(30)" />
          <use xlinkHref="#seal-g" transform="rotate(60)" />
        </g>
      </g>
    </svg>
  );
}
