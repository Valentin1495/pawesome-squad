import { AnimatePresence, motion } from "framer-motion";

export interface StarTrailParticle {
  id: string;
  emoji: string;
  left: number;
  top: number;
  x: number;
  y: number;
  rotate: number;
  delay: number;
}

interface StarTrailProps {
  particles: StarTrailParticle[];
  shouldReduceMotion: boolean;
}

export function StarTrail({ particles, shouldReduceMotion }: StarTrailProps) {
  if (shouldReduceMotion) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 45,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6, rotate: 0 }}
            animate={{
              x: particle.x,
              y: particle.y,
              opacity: 0,
              scale: 1.25,
              rotate: particle.rotate,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
              delay: particle.delay,
            }}
            style={{
              position: "fixed",
              left: particle.left,
              top: particle.top,
              fontSize: 18,
              lineHeight: 1,
              filter: "drop-shadow(0 4px 8px rgba(83,74,183,0.28))",
              willChange: "transform, opacity",
            }}
          >
            {particle.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
