"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/** Cubic-bezier [0.25, 0.46, 0.45, 0.94] approximation via polynomial */
function easeOutCustom(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export interface CounterOptions {
  duration?: number;
  decimals?: number;
  format?: (value: number) => string;
  suffix?: string;
}

function defaultFormat(v: number, decimals: number, suffix?: string): string {
  let s: string;
  if (decimals > 0) {
    s = v.toFixed(decimals);
  } else if (Math.abs(v) >= 1000) {
    s = `${(v / 1000).toFixed(1)}k`;
  } else {
    s = Math.round(v).toLocaleString();
  }
  return suffix ? `${s}${suffix}` : s;
}

/**
 * Animated counter hook with IntersectionObserver trigger.
 * Returns a ref to attach to the container and the formatted display value.
 */
export function useAnimatedCounter(
  target: number,
  options: CounterOptions = {},
) {
  const { duration = 1200, decimals = 0, format, suffix } = options;
  const ref = useRef<HTMLElement>(null);
  const [display, setDisplay] = useState(() =>
    format ? format(target) : defaultFormat(target, decimals, suffix),
  );
  const prevTarget = useRef(target);
  const rafId = useRef(0);
  const hasAnimated = useRef(false);
  const isVisible = useRef(false);

  const fmt = useCallback(
    (v: number) => (format ? format(v) : defaultFormat(v, decimals, suffix)),
    [format, decimals, suffix],
  );

  const animateTo = useCallback(
    (from: number, to: number) => {
      if (from === to) {
        setDisplay(fmt(to));
        return;
      }
      cancelAnimationFrame(rafId.current);
      const start = performance.now();
      const delta = to - from;

      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCustom(progress);
        const current = from + delta * eased;
        setDisplay(fmt(current));

        if (progress < 1) {
          rafId.current = requestAnimationFrame(tick);
        } else {
          setDisplay(fmt(to));
        }
      };
      rafId.current = requestAnimationFrame(tick);
    },
    [duration, fmt],
  );

  // IntersectionObserver — animate on first visibility
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          isVisible.current = true;
          animateTo(0, target);
        }
        isVisible.current = entry.isIntersecting;
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, animateTo]);

  // Re-animate when target changes (if already visible)
  useEffect(() => {
    const prev = prevTarget.current;
    prevTarget.current = target;

    if (!hasAnimated.current) {
      // Initial display before intersection
      setDisplay(fmt(target));
      return;
    }
    if (prev !== target && isVisible.current) {
      animateTo(prev, target);
    }
  }, [target, animateTo, fmt]);

  // Cleanup
  useEffect(() => () => cancelAnimationFrame(rafId.current), []);

  return { ref, displayValue: display };
}
