"use client";

import { animate, motion, MotionConfig, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Apple-style curve for arrivals: fast start, long settle. */
export const EASE_OUT = [0.2, 0.8, 0.2, 1] as const;
/** Critically damped spring for UI that moves without a gesture (no overshoot). */
export const SPRING = { type: "spring", bounce: 0, duration: 0.45 } as const;

/** A number that counts up once when it first appears; reduced motion shows the final value. */
export function CountUp({ value, format, delay = 0 }: { value: number; format: (n: number) => string; delay?: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0); // identical first render on server and client
  const started = useRef(false);
  useEffect(() => {
    if (reduce) return setShown(value);
    if (started.current) return setShown(value); // later updates jump: only the first arrival is choreographed
    started.current = true;
    const controls = animate(0, value, { duration: 0.9, delay, ease: EASE_OUT, onUpdate: setShown });
    return () => controls.stop();
  }, [value, reduce, delay]);
  return <>{format(shown)}</>;
}

/** Fades content in (with a short rise) after `delay`; under reduced motion MotionMode drops the rise. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
  labelledBy,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  labelledBy?: string;
}) {
  const M = motion[as];
  return (
    <M
      className={className}
      aria-labelledby={labelledBy}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EASE_OUT }}
    >
      {children}
    </M>
  );
}

/** Cross-fade between routes: each page fades in with a short rise as it mounts.
 *  (No filter here: a filter on this wrapper would trap position:fixed children such as toasts.) */
export function PageFade({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <motion.div
      key={path}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/** App-wide motion setting: when the reader prefers reduced motion, Motion skips transform and
 *  layout animation (things still fade). Server and client render the same markup either way. */
export function MotionMode({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
