import React from 'react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

// Generates a deterministic high-tech QR code matrix based on string input
export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 140,
  className = '',
}) => {
  // Simple deterministic hash to populate 21x21 QR standard matrix
  const matrixSize = 21;
  const matrix: boolean[][] = Array(matrixSize)
    .fill(false)
    .map(() => Array(matrixSize).fill(false));

  // Generate pattern based on value hash
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  // Populate data area
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Finder patterns in 3 corners (7x7)
      const isTopLeftFinder = r < 7 && c < 7;
      const isTopRightFinder = r < 7 && c >= matrixSize - 7;
      const isBottomLeftFinder = r >= matrixSize - 7 && c < 7;

      if (isTopLeftFinder || isTopRightFinder || isBottomLeftFinder) {
        continue;
      }

      // Timing patterns
      if (r === 6 || c === 6) {
        matrix[r][c] = (r + c) % 2 === 0;
        continue;
      }

      // Pseudo-random pseudo-data deterministic
      const bitIndex = (r * matrixSize + c) % 32;
      const seed = Math.sin(hash + r * 13 + c * 37) * 10000;
      matrix[r][c] = Math.floor(seed - Math.floor(seed) + ((hash >> bitIndex) & 1)) % 2 === 0;
    }
  }

  // Draw 7x7 corner finder patterns
  const drawFinder = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[startR + r][startC + c] = isOuter || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, matrixSize - 7);
  drawFinder(matrixSize - 7, 0);

  return (
    <div
      className={`inline-flex items-center justify-center p-2 bg-white rounded-xl shadow-inner border border-slate-200 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${matrixSize} ${matrixSize}`}
        className="w-full h-full text-slate-900"
        fill="currentColor"
      >
        {matrix.map((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <rect
                key={`${r}-${c}`}
                x={c}
                y={r}
                width="1"
                height="1"
                shapeRendering="crispEdges"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
};
