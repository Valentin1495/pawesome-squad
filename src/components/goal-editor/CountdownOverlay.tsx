import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface CountdownOverlayProps {
  isActive: boolean;
  shouldReduceMotion: boolean;
}

const STEPS = ["3", "2", "1", "🚀"];
const STEP_MS = 650;

export function CountdownOverlay({
  isActive,
  shouldReduceMotion,
}: CountdownOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isActive || shouldReduceMotion) {
      setStepIndex(0);
      return;
    }

    const timerId = window.setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
    }, STEP_MS);

    return () => window.clearInterval(timerId);
  }, [isActive, shouldReduceMotion]);

  if (!isActive || shouldReduceMotion) {
    return null;
  }

  const step = STEPS[stepIndex];
  const isRocket = step === "🚀";

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset:
          "env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)",
        zIndex: 50,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0)",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{
            scale: isRocket ? [1, 1.3, 1.1] : 1,
            opacity: isRocket ? [1, 1, 0] : 1,
            transition: isRocket
              ? { duration: 0.58, ease: "easeOut" }
              : { type: "spring", stiffness: 300, damping: 18 },
          }}
          exit={{ scale: 0.7, opacity: 0, transition: { duration: 0.2 } }}
          style={{
            color: "#fff",
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: 96,
            fontWeight: 800,
            lineHeight: 1,
            textShadow: "0 2px 24px rgba(83,74,183,0.6)",
          }}
        >
          {step}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
