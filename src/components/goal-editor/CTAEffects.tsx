import { colors } from "@toss/tds-colors";
import { AnimatePresence, motion } from "framer-motion";
import { type LaunchPhase, withAlpha } from "./constants";

interface CTAEffectsProps {
  canSubmit: boolean;
  crewJumpKey: number;
  ctaHintKey: number;
  isLaunching: boolean;
  launchPhase: LaunchPhase;
  isOnboarding: boolean;
  needsMoreGoals: boolean;
}

export function CTAEffects({
  canSubmit,
  crewJumpKey,
  ctaHintKey,
  isLaunching,
  launchPhase,
  isOnboarding,
  needsMoreGoals,
}: CTAEffectsProps) {
  const isLaunchActive = launchPhase !== "idle" || isLaunching;

  return (
    <>
      <AnimatePresence>
        {isOnboarding && canSubmit && !isLaunchActive && (
          <motion.div
            key={`cta-pulse-${crewJumpKey}`}
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{
              opacity: [0, 0.28, 0],
              scale: [0.98, 1.05, 1],
              y: [8, 0, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.64, ease: "easeOut" }}
            style={{
              position: "fixed",
              left: "50%",
              bottom: 18,
              width: "calc(100% - 40px)",
              maxWidth: 440,
              height: 58,
              borderRadius: 16,
              border: `2px solid ${withAlpha(colors.purple500, 0.24)}`,
              boxShadow: `0 0 0 10px ${withAlpha(colors.purple500, 0.12)}`,
              transform: "translateX(-50%)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {needsMoreGoals && !isLaunchActive && (
          <motion.div
            key={`cta-hint-${ctaHintKey}`}
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: [0, 0.2, 0], x: [0, -3, 3, -2, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{
              position: "fixed",
              left: "50%",
              bottom: 18,
              width: "calc(100% - 40px)",
              maxWidth: 440,
              height: 58,
              borderRadius: 16,
              border: `2px solid ${withAlpha(colors.purple500, 0.16)}`,
              boxShadow: `0 0 0 6px ${withAlpha(colors.purple500, 0.08)}`,
              transform: "translateX(-50%)",
              pointerEvents: "none",
              willChange: "transform, opacity",
              zIndex: 1,
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
