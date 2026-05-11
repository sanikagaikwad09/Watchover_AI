interface ConfidenceSparklineProps {
  values: number[];
  className?: string;
}

const WIDTH = 64;
const HEIGHT = 24;
const PADDING = 2;

export function ConfidenceSparkline({ values, className = '' }: ConfidenceSparklineProps) {
  const safeValues = values.length > 0 ? values : [0, 0];
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = Math.max(max - min, 1);

  const points = safeValues
    .map((value, index) => {
      const x = PADDING + (index * (WIDTH - PADDING * 2)) / Math.max(safeValues.length - 1, 1);
      const y = HEIGHT - PADDING - ((value - min) / range) * (HEIGHT - PADDING * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={`h-6 w-16 ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
