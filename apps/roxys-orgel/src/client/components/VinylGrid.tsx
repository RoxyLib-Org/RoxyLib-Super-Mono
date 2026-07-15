import { useSpringValue } from "@react-spring/web";
import { useCallback, useMemo, useRef, useState } from "react";
import { HEX_RADIUS, LiquidGlassFilter, VinylDisc } from "./VinylDisc";

const { sqrt, pow } = Math;

const DIRECTIONS: [number, number][] = [
  [1, 0],
  [0.5, sqrt(3) / 2],
  [-0.5, sqrt(3) / 2],
  [-1, 0],
  [-0.5, -sqrt(3) / 2],
  [0.5, -sqrt(3) / 2],
];

/**
 * Generate hexagonal grid positions (honeycomb packing).
 * Center is [0,0], then rings expand outward.
 */
function generateHexPositions(
  spacing: number,
  count: number,
): Array<[number, number]> {
  const positions: Array<[number, number]> = [[0, 0]];
  let ring = 1;

  while (positions.length < count) {
    for (let side = 0; side < 6; side++) {
      for (let step = 0; step < ring; step++) {
        if (positions.length >= count) break;

        const x =
          ring * spacing * 2 * DIRECTIONS[side][0] -
          step *
            spacing *
            2 *
            (DIRECTIONS[side][0] - DIRECTIONS[(side + 1) % 6][0]);
        const y =
          ring * spacing * 2 * DIRECTIONS[side][1] -
          step *
            spacing *
            2 *
            (DIRECTIONS[side][1] - DIRECTIONS[(side + 1) % 6][1]);

        positions.push([x, y]);
      }
    }
    ring += 1;
  }
  return positions;
}

/** Total vinyl discs — 4 full rings = 1+6+12+18+24 = 61 */
const DISC_COUNT = 61;

/**
 * Find the index of the disc whose coord is closest to the negated offset
 * (i.e. the disc currently nearest the viewport center).
 */
function findNearestDisc(
  coords: Array<[number, number]>,
  offsetX: number,
  offsetY: number,
): number {
  let minDist = Number.POSITIVE_INFINITY;
  let nearest = 0;
  for (let i = 0; i < coords.length; i++) {
    const [cx, cy] = coords[i];
    const dist = pow(cx + offsetX, 2) + pow(cy + offsetY, 2);
    if (dist < minDist) {
      minDist = dist;
      nearest = i;
    }
  }
  return nearest;
}

export function VinylGrid() {
  const coords = useMemo(
    () => generateHexPositions(HEX_RADIUS, DISC_COUNT),
    [],
  );

  const [isHold, setIsHold] = useState(false);
  const offsetRef = useRef([0, 0]);

  const springConfig = { tension: 170, friction: 24 };
  const offsetX = useSpringValue(0, { config: springConfig });
  const offsetY = useSpringValue(0, { config: springConfig });

  const snapToNearest = useCallback(() => {
    const nearest = findNearestDisc(
      coords,
      offsetRef.current[0],
      offsetRef.current[1],
    );
    const [cx, cy] = coords[nearest];
    offsetRef.current = [-cx, -cy];
    offsetX.start(-cx);
    offsetY.start(-cy);
  }, [coords, offsetX, offsetY]);

  const handleCenter = useCallback(
    (index: number) => {
      const [cx, cy] = coords[index];
      offsetRef.current = [-cx, -cy];
      offsetX.start(-cx);
      offsetY.start(-cy);
    },
    [coords, offsetX, offsetY],
  );

  const handlePointerDown = useCallback(() => {
    setIsHold(true);
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsHold(false);
    snapToNearest();
  }, [snapToNearest]);

  const handlePointerMove = useCallback(
    (evt: React.PointerEvent) => {
      if (!isHold) return;

      offsetRef.current[0] += evt.movementX;
      offsetRef.current[1] += evt.movementY;

      offsetX.start(offsetRef.current[0]);
      offsetY.start(offsetRef.current[1]);
    },
    [isHold, offsetX, offsetY],
  );

  return (
    <div
      className="relative w-full h-screen overflow-hidden touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerMove={handlePointerMove}
    >
      {/* SVG filter definition for liquid glass distortion */}
      <LiquidGlassFilter />

      {/* Solid black background */}
      <div className="absolute inset-0 bg-black" />

      {/* Disc grid layer */}
      <div className="relative w-full h-full">
        {coords.map((coord, idx) => (
          <VinylDisc
            key={idx}
            coord={coord}
            offset={[offsetX, offsetY]}
            index={idx}
            onCenter={handleCenter}
          />
        ))}
      </div>
    </div>
  );
}
