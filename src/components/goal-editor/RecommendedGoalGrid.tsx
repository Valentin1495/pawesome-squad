import { colors } from "@toss/tds-colors";
import { Badge, Text } from "@toss/tds-mobile";
import { AnimatePresence, motion } from "framer-motion";
import type { MouseEvent } from "react";
import type { GoalInput } from "../../store/useAppStore";
import { MAX_GOALS, type AddPhase } from "./constants";
import { normalizeKey } from "./utils";

interface RecommendedGoalGridProps {
  availableRecommendations: GoalInput[];
  addPhase: AddPhase;
  goalsLength: number;
  isChainActive: boolean;
  isFull: boolean;
  isLaunching: boolean;
  isOnboarding: boolean;
  launchingCardKey: string | null;
  nextCrewEmoji: string;
  nextCrewColor: string;
  onAddGoal: (
    goal: GoalInput,
    sourceElement: HTMLElement,
    emojiElement: HTMLElement | null,
  ) => void;
}

export function RecommendedGoalGrid({
  availableRecommendations,
  addPhase,
  goalsLength,
  isChainActive,
  isFull,
  isLaunching,
  isOnboarding,
  launchingCardKey,
  nextCrewEmoji,
  nextCrewColor,
  onAddGoal,
}: RecommendedGoalGridProps) {
  const handleAddGoal = (event: MouseEvent<HTMLButtonElement>, goal: GoalInput) => {
    const emojiElement = event.currentTarget.querySelector<HTMLElement>("[data-goal-emoji]");
    onAddGoal(goal, event.currentTarget, emojiElement);
  };

  return (
    <motion.section
      animate={
        isLaunching
          ? { opacity: 0.28, y: -8, scale: 0.98 }
          : isChainActive
            ? { opacity: 0.72, y: -4, scale: 0.995 }
            : { opacity: 1, y: 0, scale: 1 }
      }
      style={{
        marginBottom: 16,
        pointerEvents: isLaunching || isChainActive ? "none" : "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <Text
            typography="t5"
            fontWeight="bold"
            color={colors.grey800}
            display="block"
            style={{ margin: 0 }}
          >
            추천 목표 카드
          </Text>
          <Text
            typography="t7"
            color={colors.grey500}
            display="block"
            style={{ marginTop: 3 }}
          >
            작성한 카드는 다음 크루 {nextCrewEmoji}에게 바로 전달돼요.
          </Text>
        </div>
        <Text typography="t7" fontWeight="bold" color={isFull ? colors.grey500 : colors.purple500}>
          {goalsLength}/{MAX_GOALS}
        </Text>
      </div>
      {goalsLength >= MAX_GOALS ? (
        <div
          style={{
            marginTop: 12,
            borderRadius: 14,
            border: `1px solid ${colors.grey200}`,
            backgroundColor: colors.white,
            padding: "14px 12px",
          }}
        >
          <Text typography="t6" fontWeight="bold" color={colors.grey800} display="block">
            목표가 가득 찼어요
          </Text>
          <Text
            typography="t7"
            color={colors.grey600}
            display="block"
            style={{ marginTop: 4, lineHeight: 1.4 }}
          >
            오늘의 미션에서 목표를 지우면 다시 추가할 수 있어요.
          </Text>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 10,
            marginTop: 12,
          }}
        >
          {availableRecommendations.map((goal, index) => {
            const isLaunchingCard =
              addPhase === "card-exit" && launchingCardKey === normalizeKey(goal.text);

            return (
              <motion.button
                layoutId={isOnboarding ? `recommend-${goal.text}` : undefined}
                key={goal.text}
                type="button"
                disabled={isFull || isLaunching || isChainActive}
                onClick={(event) => handleAddGoal(event, goal)}
                initial={{ opacity: 0, y: 16, rotate: index % 2 === 0 ? -2 : 2 }}
                animate={{
                  opacity: isLaunchingCard ? [1, 0.88, 0.28] : isFull ? 0.45 : 1,
                  y: isLaunchingCard ? -8 : 0,
                  rotate: isLaunchingCard
                    ? [index % 2 === 0 ? -1.4 : 1.4, 0]
                    : index % 2 === 0
                      ? -1.4
                      : 1.4,
                  scale: isLaunchingCard ? [1, 1.04, 0.98] : 1,
                }}
                whileHover={
                  isFull || isLaunching || isChainActive
                    ? undefined
                    : {
                        y: -4,
                        rotate: 0,
                        scale: 1.03,
                        boxShadow: "0 14px 28px rgba(0,27,55,0.12)",
                      }
                }
                whileTap={
                  isFull || isLaunching || isChainActive ? undefined : { scale: 0.94, rotate: 0 }
                }
                transition={
                  isLaunchingCard
                    ? { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
                    : { type: "spring", stiffness: 300, damping: 20 }
                }
                style={{
                  position: "relative",
                  minHeight: 74,
                  border: isLaunchingCard
                    ? `2px solid ${nextCrewColor}`
                    : `1px solid ${colors.grey200}`,
                  borderLeft: `4px solid ${nextCrewColor}`,
                  borderRadius: 14,
                  background: isLaunchingCard
                    ? `linear-gradient(135deg, ${colors.white} 0%, #f4f8ff 100%)`
                    : colors.white,
                  boxShadow: isLaunchingCard
                    ? "0 18px 34px rgba(0,27,55,0.16)"
                    : `${index * -2}px ${8 + index}px 18px rgba(0,27,55,0.08)`,
                  color: colors.grey800,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: isLaunchingCard ? "13px 12px 10px" : "10px 12px",
                  textAlign: "left",
                  overflow: "hidden",
                  willChange: isLaunchingCard ? "transform, opacity" : undefined,
                }}
              >
                <AnimatePresence>
                  {isLaunchingCard && (
                    <motion.span
                      key="handoff-badge"
                      initial={{ opacity: 0, y: 6, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.94 }}
                      transition={{ duration: 0.16 }}
                      style={{ position: "absolute", right: 8, top: 8, zIndex: 2 }}
                    >
                      <Badge size="xsmall" color="blue" variant="fill">
                        전달 중
                      </Badge>
                    </motion.span>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {isLaunchingCard && (
                    <motion.span
                      key="recommend-launch-shimmer"
                      initial={{ opacity: 0, x: "-120%" }}
                      animate={{ opacity: [0, 0.82, 0], x: "140%" }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.46, ease: "easeOut" }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "54%",
                        background:
                          "linear-gradient(100deg, transparent, rgba(255,255,255,0.88), transparent)",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </AnimatePresence>
                <motion.span
                  data-goal-emoji
                  animate={
                    isLaunchingCard
                      ? { rotate: [0, -10, 8, 0], scale: [1, 1.22, 0.9] }
                      : { rotate: 0, scale: 1 }
                  }
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  style={{ position: "relative", zIndex: 1, fontSize: 24 }}
                >
                  {goal.emoji}
                </motion.span>
                <div style={{ position: "relative", zIndex: 1, minWidth: 0 }}>
                  <Text
                    typography="t6"
                    fontWeight="bold"
                    color={colors.grey800}
                    display="block"
                    style={{ lineHeight: 1.35 }}
                  >
                    {goal.text}
                  </Text>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}
