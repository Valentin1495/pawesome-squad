import { motion } from "framer-motion";
import { GoalEditor } from "../components/GoalEditor";
import { useHaptic } from "../hooks/useHaptic";
import { useAppStore, type GoalInput } from "../store/useAppStore";

export function OnboardingPage() {
  const haptic = useHaptic();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  const handleSubmit = (goals: GoalInput[]) => {
    haptic("success");
    completeOnboarding(goals);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.24 }}
      style={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      <GoalEditor
        mode="onboarding"
        title="오늘의 목표를 골라볼까요?"
        subtitle="목표 카드를 3개 이상 모으면 응원단이 오늘 하루 곁에서 함께 응원해요."
        submitLabel="응원 받기"
        onSubmit={handleSubmit}
      />
    </motion.div>
  );
}
