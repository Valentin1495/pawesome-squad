import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";

const EMOJIS = ["🎉", "🎊", "⭐", "🌟", "✨", "🐱", "🐶", "🐰", "💜", "🎈", "🍭", "🦄"];

interface Particle {
  id: number;
  emoji: string;
  x: number;
  delay: number;
  duration: number;
  size: number;
  rotate: number;
  repeatDelay: number;
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

interface ConfettiOverlayProps {
  active: boolean;
}

export function ConfettiOverlay({ active }: ConfettiOverlayProps) {
  const particles = useMemo(() => {
    if (!active) return [];

    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      x: randomBetween(5, 95),
      delay: randomBetween(0, 1.2),
      duration: randomBetween(2.5, 4.5),
      size: randomBetween(20, 36),
      rotate: randomBetween(-180, 180),
      repeatDelay: randomBetween(0.5, 2),
    }));
  }, [active]);

  return (
    <AnimatePresence>
      {active && particles.length > 0 && (
        <motion.div
          key="confetti"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: -80, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
              animate={{
                y: "110vh",
                opacity: [1, 1, 0.5, 0],
                rotate: p.rotate,
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: "easeIn",
                repeat: Infinity,
                repeatDelay: p.repeatDelay,
              }}
              style={{
                position: "absolute",
                fontSize: p.size,
                top: 0,
                left: 0,
              }}
            >
              {p.emoji}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
