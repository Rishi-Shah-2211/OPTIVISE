"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import { useRef, type MouseEvent, type ReactNode } from "react";

function useMagnet(strength: number) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.6 });

  function onMove(e: MouseEvent) {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * strength);
    y.set((e.clientY - r.top - r.height / 2) * strength);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return { ref, sx, sy, onMove, onLeave };
}

type MagneticLinkProps = {
  children: ReactNode;
  className?: string;
  strength?: number;
  href: string;
};

export function MagneticLink({
  children,
  className = "btn-premium",
  strength = 0.22,
  href,
}: MagneticLinkProps) {
  const { ref, sx, sy, onMove, onLeave } = useMagnet(strength);
  return (
    <motion.span
      ref={ref as React.RefObject<HTMLSpanElement>}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy, display: "inline-flex" }}
    >
      <Link href={href} className={className}>
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </Link>
    </motion.span>
  );
}

type MagneticButtonProps = {
  children: ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
};

export function MagneticButton({
  children,
  className = "btn-premium",
  strength = 0.22,
  onClick,
  disabled,
  type = "button",
}: MagneticButtonProps) {
  const { ref, sx, sy, onMove, onLeave } = useMagnet(strength);
  return (
    <motion.span
      ref={ref as React.RefObject<HTMLSpanElement>}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy, display: "inline-flex" }}
    >
      <button type={type} onClick={onClick} disabled={disabled} className={className}>
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </button>
    </motion.span>
  );
}
