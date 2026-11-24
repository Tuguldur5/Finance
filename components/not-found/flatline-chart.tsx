"use client";

import * as React from "react";

import { MN_MONTHS } from "@/lib/date";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const WIDTH = 360;
const LEFT = 36;
const RIGHT = 344;
const BASELINE = 160;
const GRID_LINES = [24, 92, BASELINE] as const;
const LINE =
  "M36 118 L52 108 L68 124 L84 96 L100 108 L116 86 L132 94 L140 160 L344 160";

export function FlatlineChart({ className }: { className?: string }) {
  const [drawn, setDrawn] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = query.matches;
    let frame = 0;

    setReducedMotion(reduce);

    if (reduce) {
      setDrawn(true);
    } else {
      frame = window.requestAnimationFrame(() => setDrawn(true));
    }

    const onChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
      setDrawn(true);
    };

    query.addEventListener("change", onChange);

    return () => {
      query.removeEventListener("change", onChange);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const months = React.useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const month = (now.getMonth() - 5 + index + 12) % 12;
      return MN_MONTHS[month];
    });
  }, []);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${BASELINE + 40}`}
      className={cn("w-full", className)}
      role="img"
      aria-label={t("notFound.chartAria")}
    >
      {GRID_LINES.map((y) => (
        <line
          key={y}
          x1={LEFT}
          x2={RIGHT}
          y1={y}
          y2={y}
          strokeWidth={1}
          className="stroke-border"
        />
      ))}

      <text
        x={2}
        y={BASELINE + 4}
        fontSize={9}
        className="fill-muted-foreground"
      >
        0₮
      </text>

      <path
        d={LINE}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={drawn ? 0 : 1}
        style={{
          transition: reducedMotion
            ? "none"
            : "stroke-dashoffset 900ms ease-out",
        }}
        className="stroke-primary"
      />

      <circle
        cx={RIGHT}
        cy={BASELINE}
        r={3}
        className="fill-primary"
      />
      <text
        x={RIGHT}
        y={BASELINE - 10}
        textAnchor="end"
        fontSize={9}
        fontWeight={500}
        className="fill-primary"
      >
        404
      </text>

      {months.map((month, index) => (
        <text
          key={`${month}-${index}`}
          x={LEFT + ((RIGHT - LEFT) * index) / 5}
          y={BASELINE + 24}
          textAnchor="middle"
          fontSize={8.5}
          className="fill-muted-foreground"
        >
          {month}
        </text>
      ))}
    </svg>
  );
}
