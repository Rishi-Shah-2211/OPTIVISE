"use client";

import { motion, type HTMLMotionProps, type Transition } from "framer-motion";
import { forwardRef } from "react";

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
  duration?: number;
  once?: boolean;
};

export const Reveal = forwardRef<HTMLDivElement, RevealProps>(function Reveal(
  { delay = 0, y = 22, duration = 0.9, once = true, children, ...rest },
  ref,
) {
  const transition: Transition = {
    duration,
    delay,
    ease: [0.22, 1, 0.36, 1],
  };
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={transition}
      {...rest}
    >
      {children}
    </motion.div>
  );
});

type StaggerProps = HTMLMotionProps<"div"> & {
  gap?: number;
  delay?: number;
};

export function Stagger({ gap = 0.08, delay = 0, children, ...rest }: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: gap, delayChildren: delay },
        },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  y = 18,
  ...rest
}: HTMLMotionProps<"div"> & { y?: number }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
