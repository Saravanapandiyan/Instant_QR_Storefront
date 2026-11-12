import React, { useMemo, useId } from 'react';
import qrcode from 'qrcode-generator';

export type QRDotPattern = 'dots' | 'tiles' | 'diamond' | 'bars' | 'square';
export type QREyePattern = 'squircle' | 'circle' | 'leaf' | 'square';
export type QRShape = 'square' | 'circle';

interface StylizedQRCodeProps {
  value: string;
  dotPattern: QRDotPattern;
  eyePattern: QREyePattern;
  shape: QRShape;
  color1: string;
  color2: string;
  excavateCenter?: boolean;
  className?: string;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

/**
 * Generates an SVG path string for a rectangle with individually configurable corner radii.
 */
function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  tl: number,
  tr: number,
  br: number,
  bl: number
): string {
  return [
    `M ${x + tl} ${y}`,
    `H ${x + w - tr}`,
    tr > 0 ? `Q ${x + w} ${y} ${x + w} ${y + tr}` : `L ${x + w} ${y}`,
    `V ${y + h - br}`,
    br > 0 ? `Q ${x + w} ${y + h} ${x + w - br} ${y + h}` : `L ${x + w} ${y + h}`,
    `H ${x + bl}`,
    bl > 0 ? `Q ${x} ${y + h} ${x} ${y + h - bl}` : `L ${x} ${y + h}`,
    `V ${y + tl}`,
    tl > 0 ? `Q ${x} ${y} ${x + tl} ${y}` : `L ${x} ${y}`,
    'Z',
  ].join(' ');
}

/**
 * Pure synchronous SVG QR renderer with genuinely distinct module patterns,
 * bespoke finder eye styles, gradient fills, and zero async blanking bugs.
 */
export const StylizedQRCode: React.FC<StylizedQRCodeProps> = ({
  value,
  dotPattern,
  eyePattern,
  shape,
  color1,
  color2,
  excavateCenter = true,
  className = '',
  svgRef,
}) => {
  const gradId = useId().replace(/:/g, '');

  const { count, modules } = useMemo(() => {
    const qr = qrcode(0, 'H');
    qr.addData(value || 'https://instantqr.com');
    qr.make();

    const n = qr.getModuleCount();
    const grid: boolean[][] = [];
    for (let r = 0; r < n; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < n; c++) {
        row.push(qr.isDark(r, c));
      }
      grid.push(row);
    }
    return { count: n, modules: grid };
  }, [value]);

  const isFinderZone = (r: number, c: number): boolean => {
    const inTop = r < 7;
    const inBottom = r >= count - 7;
    const inLeft = c < 7;
    const inRight = c >= count - 7;
    return (inTop && inLeft) || (inTop && inRight) || (inBottom && inLeft);
  };

  const isExcavatedCenter = (r: number, c: number): boolean => {
    if (!excavateCenter) return false;
    const mid = count / 2;
    const dx = c + 0.5 - mid;
    const dy = r + 0.5 - mid;
    // Excavate a circular zone matching the center emblem while keeping <= 8% of matrix
    const radius = Math.min(4.6, count * 0.14);
    return Math.hypot(dx, dy) < radius;
  };

  const shouldRenderCell = (r: number, c: number): boolean => {
    return modules[r]?.[c] === true && !isFinderZone(r, c) && !isExcavatedCenter(r, c);
  };

  // Precompute module elements
  const moduleElements = useMemo(() => {
    const elements: React.ReactNode[] = [];

    if (dotPattern === 'bars') {
      // Group contiguous horizontal runs into sleek pill capsules
      for (let r = 0; r < count; r++) {
        let c = 0;
        while (c < count) {
          if (!shouldRenderCell(r, c)) {
            c++;
            continue;
          }
          const start = c;
          while (c < count && shouldRenderCell(r, c)) {
            c++;
          }
          const runLength = c - start;
          elements.push(
            <rect
              key={`bar-${r}-${start}`}
              x={start + 0.06}
              y={r + 0.14}
              width={runLength - 0.12}
              height={0.72}
              rx={0.36}
              ry={0.36}
            />
          );
        }
      }
      return elements;
    }

    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (!shouldRenderCell(r, c)) continue;

        if (dotPattern === 'dots') {
          elements.push(
            <circle key={`d-${r}-${c}`} cx={c + 0.5} cy={r + 0.5} r={0.41} />
          );
        } else if (dotPattern === 'tiles') {
          elements.push(
            <rect
              key={`t-${r}-${c}`}
              x={c + 0.09}
              y={r + 0.09}
              width={0.82}
              height={0.82}
              rx={0.26}
              ry={0.26}
            />
          );
        } else if (dotPattern === 'diamond') {
          const pts = `${c + 0.5},${r + 0.04} ${c + 0.96},${r + 0.5} ${c + 0.5},${r + 0.96} ${c + 0.04},${r + 0.5}`;
          elements.push(<polygon key={`dm-${r}-${c}`} points={pts} />);
        } else {
          // Crisp classic square (tiny 0.02 overlap avoids subpixel hairline gaps)
          elements.push(
            <rect key={`s-${r}-${c}`} x={c} y={r} width={1.02} height={1.02} />
          );
        }
      }
    }
    return elements;
  }, [count, modules, dotPattern, excavateCenter]);

  // Render the 3 Corner Finder Eyes
  const renderFinderEye = (fx: number, fy: number, key: string) => {
    if (eyePattern === 'circle') {
      return (
        <g key={key}>
          <circle
            cx={fx + 3.5}
            cy={fy + 3.5}
            r={3}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={1}
          />
          <circle cx={fx + 3.5} cy={fy + 3.5} r={1.55} fill={`url(#${gradId})`} />
        </g>
      );
    }

    if (eyePattern === 'squircle') {
      return (
        <g key={key}>
          <rect
            x={fx + 0.5}
            y={fy + 0.5}
            width={6}
            height={6}
            rx={1.85}
            ry={1.85}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={1}
          />
          <rect
            x={fx + 2}
            y={fy + 2}
            width={3}
            height={3}
            rx={0.95}
            ry={0.95}
            fill={`url(#${gradId})`}
          />
        </g>
      );
    }

    if (eyePattern === 'leaf') {
      // Sharp corner points inward toward center of QR
      const isTopLeft = fx === 0 && fy === 0;
      const isTopRight = fx > 0 && fy === 0;
      const isBottomLeft = fx === 0 && fy > 0;

      const rOut = 2.25;
      const outerPath = roundedRectPath(
        fx + 0.5,
        fy + 0.5,
        6,
        6,
        rOut,
        isTopRight ? rOut : isBottomLeft ? 0 : rOut,
        isTopLeft ? 0 : rOut,
        isTopRight ? 0 : rOut
      );
      const rIn = 1.1;
      const innerPath = roundedRectPath(
        fx + 2,
        fy + 2,
        3,
        3,
        rIn,
        isTopRight ? rIn : isBottomLeft ? 0 : rIn,
        isTopLeft ? 0 : rIn,
        isTopRight ? 0 : rIn
      );

      return (
        <g key={key}>
          <path
            d={outerPath}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={1}
          />
          <path d={innerPath} fill={`url(#${gradId})`} />
        </g>
      );
    }

    // Classic Square
    return (
      <g key={key}>
        <rect
          x={fx + 0.5}
          y={fy + 0.5}
          width={6}
          height={6}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={1}
        />
        <rect x={fx + 2} y={fy + 2} width={3} height={3} fill={`url(#${gradId})`} />
      </g>
    );
  };

  // Compute ViewBox and Backdrop based on Square vs Circle Shape
  const mid = count / 2;
  const squareMargin = 2;
  const circleRadius = mid * Math.SQRT2 + 2.4;

  const viewBox =
    shape === 'circle'
      ? `${mid - circleRadius - 0.6} ${mid - circleRadius - 0.6} ${(circleRadius + 0.6) * 2} ${(circleRadius + 0.6) * 2}`
      : `-${squareMargin} -${squareMargin} ${count + squareMargin * 2} ${count + squareMargin * 2}`;

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      className={className}
      shapeRendering="geometricPrecision"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
      </defs>

      {/* Clean White Background (ensures high contrast scanability) */}
      {shape === 'circle' ? (
        <>
          <circle cx={mid} cy={mid} r={circleRadius} fill="#ffffff" />
          {/* Stylish outer ring outside the quiet zone */}
          <circle
            cx={mid}
            cy={mid}
            r={circleRadius - 0.45}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={0.45}
            strokeDasharray="1.8 0.9"
          />
        </>
      ) : (
        <rect
          x={-squareMargin}
          y={-squareMargin}
          width={count + squareMargin * 2}
          height={count + squareMargin * 2}
          fill="#ffffff"
        />
      )}

      {/* Data Modules */}
      <g fill={`url(#${gradId})`}>{moduleElements}</g>

      {/* 3 Corner Finder Eyes */}
      {renderFinderEye(0, 0, 'eye-tl')}
      {renderFinderEye(count - 7, 0, 'eye-tr')}
      {renderFinderEye(0, count - 7, 'eye-bl')}
    </svg>
  );
};

