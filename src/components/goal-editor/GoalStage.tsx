import { colors } from "@toss/tds-colors";
import { Bubble } from "@toss/tds-mobile";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { forwardRef, useEffect, useRef, useState } from "react";
import {
  type AddPhase,
  CREW_COLORS,
  LAUNCH_BOARD_TEXT,
  type LaunchPhase,
  MAX_GOALS,
  MIN_GOALS,
  STAGE_SPARKLES,
  withAlpha,
} from "./constants";
import type { PendingVisualGoal } from "./FlowTrail";
import { getCrewStageLine } from "./utils";

const CREW_EXIT_END = 320;
const BUBBLE_UPDATE_DELAY = 1000;

const crewVariants: Variants = {
  idle: { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 },
  "crew-shake": (i: number) => ({
    x: [0, -4, 4, -3, 3, 0],
    rotate: [0, -5, 5, -4, 4, 0],
    opacity: 1,
    transition: { duration: 0.4, repeat: Infinity, delay: i * 0.06 },
  }),
  "crew-launch": (i: number) => ({
    y: -140,
    opacity: 0,
    scale: 0.6,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const, delay: i * 0.08 },
  }),
};

export interface VisualCrewSlot {
  clientId: string;
  emoji: string;
  crewIndex: number;
  slotIndex: number;
  status: "entering" | "settled" | "exiting";
}

interface GoalStageProps {
  addPhase: AddPhase;
  canSubmit: boolean;
  crewSlots: VisualCrewSlot[];
  enteringCrewIndex: number | null;
  isCompletionPreview: boolean;
  isChainActive: boolean;
  isLaunching: boolean;
  launchPhase: LaunchPhase;
  shouldReduceMotion: boolean;
  activeMission: PendingVisualGoal | null;
}

export const GoalStage = forwardRef<HTMLElement, GoalStageProps>(
  function GoalStage(
    {
      addPhase,
      canSubmit,
      crewSlots,
      enteringCrewIndex,
      isCompletionPreview,
      isChainActive,
      isLaunching,
      launchPhase,
      shouldReduceMotion,
      activeMission,
    },
    ref,
  ) {
    const isCrewEntering = addPhase === "crew-enter";
    const isCelebrating = addPhase === "celebrate";
    const occupiedCount = crewSlots.filter(
      (slot) => slot.status !== "exiting",
    ).length;
    const isStageReady = canSubmit || isCompletionPreview;
    const boardHeight =
      occupiedCount === 0 ? 144 : occupiedCount < MIN_GOALS ? 158 : 174;
    const stageDecorHeight = occupiedCount < MIN_GOALS ? 116 : 136;
    const bubbleScale = occupiedCount < MIN_GOALS ? 0.98 : 1;
  const isBubbleUpdating = addPhase === "bubble-update";
  const isGoalAddInProgress = isChainActive && !isBubbleUpdating;
  const shouldShowStageBubble = !isGoalAddInProgress && launchPhase === "idle";
    const stableOccupiedCount =
      isGoalAddInProgress && enteringCrewIndex != null
        ? enteringCrewIndex
        : occupiedCount;
    const latestOccupiedCrewIndex = Math.max(occupiedCount - 1, 0);
    const stableStageReady =
      !isGoalAddInProgress &&
      (isStageReady || occupiedCount >= MIN_GOALS || isCompletionPreview);
    const activeCrewIndex = isGoalAddInProgress
      ? Math.min(stableOccupiedCount, MAX_GOALS - 1)
      : isLaunching && occupiedCount > 0
        ? Math.min(latestOccupiedCrewIndex, MAX_GOALS - 1)
        : isBubbleUpdating
          ? Math.min(latestOccupiedCrewIndex, MAX_GOALS - 1)
          : (enteringCrewIndex ??
            (occupiedCount > 0
              ? Math.min(latestOccupiedCrewIndex, MAX_GOALS - 1)
              : 0));
    const stageDialoguePhase = isLaunching
      ? "launching"
      : stableStageReady
        ? "ready"
        : stableOccupiedCount === 0
          ? "waiting"
          : "settled";
    const stageBubbleMessage = getCrewStageLine(
      activeCrewIndex,
      stageDialoguePhase,
    );
    const bubbleHeader = {
      message: stageBubbleMessage,
    };
    const [displayedBubbleHeader, setDisplayedBubbleHeader] =
      useState(bubbleHeader);
    const displayedStageBubbleMessage = isLaunching
      ? "출동 준비 완료"
      : displayedBubbleHeader.message;
    const [isBubbleVisible, setIsBubbleVisible] =
      useState(!isGoalAddInProgress);
    const wasGoalAddInProgressRef = useRef(isGoalAddInProgress);

    useEffect(() => {
      if (isGoalAddInProgress) {
        wasGoalAddInProgressRef.current = true;
        setIsBubbleVisible(false);
        return;
      }

      const updateBubbleHeader = () => {
        setDisplayedBubbleHeader(bubbleHeader);
        setIsBubbleVisible(true);
        wasGoalAddInProgressRef.current = false;
      };

      if (wasGoalAddInProgressRef.current) {
        setIsBubbleVisible(false);
        const timeoutId = window.setTimeout(
          updateBubbleHeader,
          BUBBLE_UPDATE_DELAY,
        );
        return () => window.clearTimeout(timeoutId);
      }

      updateBubbleHeader();
    }, [bubbleHeader.message, isGoalAddInProgress]);
    const crewMood =
      occupiedCount === 0
        ? "waiting"
        : occupiedCount < MIN_GOALS
          ? "sitting"
          : occupiedCount < MAX_GOALS
            ? "ready"
            : "celebrating";

    return (
      <motion.section
        ref={ref}
        layout
        animate={
          isLaunching
            ? {
                y: -4,
                scale: 1,
              }
            : isChainActive
              ? {
                  y: 0,
                  scale: 1.01,
                }
              : {
                  y: 0,
                  scale: 1,
                }
        }
        transition={{
          y: { type: "spring", stiffness: 300, damping: 24 },
          scale: { type: "spring", stiffness: 300, damping: 24 },
        }}
        style={{
          position: "relative",
          marginBottom: 20,
          overflow: "visible",
          boxSizing: "border-box",
        }}
      >
        <AnimatePresence>
          {(occupiedCount >= 2 || isCompletionPreview) &&
            STAGE_SPARKLES.slice(0, occupiedCount).map((sparkle, index) => (
              <motion.span
                key={`sparkle-${index}`}
                initial={{ opacity: 0, scale: 0, rotate: -45 }}
                animate={{
                  opacity: isStageReady ? [0.4, 1, 0.55] : 0.6,
                  scale: isStageReady ? [0.8, 1.25, 0.9] : 1,
                  rotate: isStageReady ? [0, 16, 0] : 0,
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  delay: sparkle.delay,
                  duration: isStageReady ? 0.7 : 0.35,
                  repeat: isStageReady ? 1 : 0,
                  repeatType: "reverse",
                }}
                style={{
                  position: "absolute",
                  left: sparkle.left,
                  top: sparkle.top,
                  zIndex: 1,
                  width: sparkle.size,
                  height: sparkle.size,
                  borderRadius: 2,
                  backgroundColor:
                    index % 2 === 0 ? colors.yellow400 : colors.blue300,
                  boxShadow: "0 0 12px rgba(255,211,110,0.54)",
                  transform: "rotate(45deg)",
                  pointerEvents: "none",
                }}
              />
            ))}
        </AnimatePresence>

        <div
          style={{
            position: "absolute",
            inset: "0 0 auto",
            height: stageDecorHeight,
            background:
              "radial-gradient(circle at 28% 18%, rgba(255,212,112,0.22), transparent 28%), radial-gradient(circle at 72% 18%, rgba(108,132,255,0.16), transparent 30%)",
            pointerEvents: "none",
          }}
        />
        <motion.div
          layout
          animate={{
            backgroundColor: isStageReady
              ? [
                  withAlpha(colors.purple500, 0.12),
                  withAlpha(colors.yellow400, 0.18),
                  withAlpha(colors.purple500, 0.08),
                ]
              : withAlpha(colors.white, 0.62),
            borderColor: isStageReady
              ? withAlpha(colors.purple500, 0.26)
              : withAlpha(colors.purple500, 0.12),
            boxShadow: isLaunching
              ? `inset 0 0 0 2px ${withAlpha(colors.purple500, 0.16)}, 0 20px 44px ${withAlpha(
                  colors.purple500,
                  0.18,
                )}`
              : occupiedCount >= MIN_GOALS || isCompletionPreview
                ? `inset 0 0 0 1px ${withAlpha(colors.purple500, 0.1)}, 0 10px 24px rgba(0,27,55,0.08)`
                : `inset 0 0 0 1px ${withAlpha(colors.white, 0.34)}, 0 10px 24px rgba(0,27,55,0.08)`,
          }}
          transition={{
            backgroundColor: { duration: 0.7, ease: "easeInOut" },
            borderColor: { duration: 0.2 },
            boxShadow: { duration: 0.3 },
          }}
          style={{
            position: "relative",
            zIndex: 1,
            minHeight: boardHeight,
            borderRadius: 16,
            borderStyle: "solid",
            borderWidth: 1,
            background:
              "linear-gradient(180deg, #fff 0%, #f4f6ff 54%, #fff7ed 100%)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 8,
            padding: "88px 10px 14px",
            overflow: "visible",
            boxSizing: "border-box",
          }}
        >
          <AnimatePresence>
            {shouldShowStageBubble && isBubbleVisible && (
              <motion.div
                key="stage-bubble"
                initial={{ opacity: 0, y: 4, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: bubbleScale }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                style={{
                  position: "absolute",
                  top: 14,
                  left: 12,
                  right: 12,
                  zIndex: 4,
                  display: "flex",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <Bubble
                  background="blue"
                  withTail={false}
                  style={{
                    boxShadow: "0 10px 22px rgba(49,130,246,0.2)",
                    fontSize: 17,
                    lineHeight: 1.28,
                    fontWeight: 900,
                    maxWidth: "min(100%, 320px)",
                    wordBreak: "keep-all",
                  }}
                >
                  {displayedStageBubbleMessage}
                </Bubble>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.span
            animate={{
              opacity:
                occupiedCount >= MIN_GOALS || isCompletionPreview ? 0.42 : 0.18,
              scaleX:
                occupiedCount >= MIN_GOALS || isCompletionPreview ? 1.08 : 1,
            }}
            style={{
              position: "absolute",
              left: "12%",
              right: "12%",
              top: 10,
              height: 30,
              borderRadius: "50%",
              background: `radial-gradient(ellipse at center, ${withAlpha(colors.yellow300, 0.55)}, ${withAlpha(colors.yellow300, 0)} 68%)`,
              pointerEvents: "none",
            }}
          />

          {Array.from({ length: MAX_GOALS }, (_, index) => {
            const slot = crewSlots.find((item) => item.slotIndex === index);
            const crewColor =
              CREW_COLORS[(slot?.crewIndex ?? index) % CREW_COLORS.length];
            const joined = slot != null && slot.status !== "exiting";
            const visibleCrew = slot != null;
            const isEnteringCrew =
              isCrewEntering && slot?.status === "entering";
            const isExitingCrew = slot?.status === "exiting";
            const dist =
              enteringCrewIndex == null
                ? 0
                : Math.abs(index - enteringCrewIndex);
            const isDominoCrew =
              isCrewEntering &&
              enteringCrewIndex != null &&
              slot != null &&
              slot.status === "settled";
            const missionCrewIndex =
              activeMission?.targetCrewIndex ?? enteringCrewIndex;
            const isAiming =
              addPhase === "aim" &&
              missionCrewIndex != null &&
              index === missionCrewIndex;
            const isReceivingMission =
              activeMission != null &&
              missionCrewIndex != null &&
              index === missionCrewIndex &&
              isAiming;
            const isAimSupporter =
              addPhase === "aim" &&
              enteringCrewIndex != null &&
              joined &&
              index !== enteringCrewIndex;
            const isExcited = isCelebrating && joined && !isLaunching;
            const poseScale = joined ? 1 : 0.78;
            const moodScale = crewMood === "sitting" ? 0.82 : poseScale;
            const idleY = index % 2 === 0 ? [0, -3, 0] : [0, -1, 0];
            const idleRotate =
              index % 3 === 0
                ? [-2, 2, -2]
                : index % 3 === 1
                  ? [1, -2, 1]
                  : [0, 0, 0];
            const canUseMoodLoop =
              joined &&
              !shouldReduceMotion &&
              !isChainActive &&
              !isLaunching &&
              !isEnteringCrew &&
              !isDominoCrew &&
              !isExcited &&
              !isExitingCrew;
            const moodIdlePose =
              crewMood === "sitting"
                ? { x: 0, y: 0, scale: moodScale, opacity: 1, rotate: 0 }
                : crewMood === "ready"
                  ? {
                      x: 0,
                      y: canUseMoodLoop ? [0, -4, 0] : 0,
                      scale: moodScale,
                      opacity: 1,
                      rotate: 0,
                    }
                  : crewMood === "celebrating"
                    ? {
                        x: 0,
                        y: canUseMoodLoop ? [0, -10, 0] : 0,
                        scale: moodScale,
                        opacity: 1,
                        rotate: canUseMoodLoop
                          ? [0, index % 2 === 0 ? 8 : -8, 0]
                          : 0,
                      }
                    : {
                        x: 0,
                        y: idleY,
                        scale: poseScale,
                        opacity: 1,
                        rotate: idleRotate,
                      };
            const proximity = Math.max(0, 3 - dist);
            const hopHeight = -6 - proximity * 4;
            const dominoHopHeight = dist === 0 ? -18 : dist === 1 ? -10 : -4;
            const dominoRotate = dist === 0 ? 12 : dist === 1 ? 5 : 3;
            const isCrewAnimating =
              isStageReady ||
              isLaunching ||
              isEnteringCrew ||
              isDominoCrew ||
              isExcited ||
              isExitingCrew ||
              canUseMoodLoop;
            const aimSupporterDirection =
              enteringCrewIndex == null
                ? 0
                : index < enteringCrewIndex
                  ? 8
                  : -8;
            const missionBubblePosition = { left: "50%", marginLeft: -80 };
            const isSpeakingCrew =
              activeCrewIndex === index && visibleCrew && !isGoalAddInProgress;
            const slotLayer = isReceivingMission ? 8 : isSpeakingCrew ? 3 : 1;
            const activeLaunchPhase =
              launchPhase === "crew-launch" || launchPhase === "done"
                ? "crew-launch"
                : launchPhase === "crew-shake" || launchPhase === "countdown"
                  ? "crew-shake"
                  : "idle";
            const shouldUseLaunchVariants =
              joined && !shouldReduceMotion && activeLaunchPhase !== "idle";

            return (
              <div
                key={`crew-slot-${index}`}
                data-crew-launch-slot={joined ? "true" : undefined}
                style={{
                  position: "relative",
                  zIndex: slotLayer,
                  width: 48,
                  height: 56,
                  flex: "0 0 48px",
                }}
              >
                <motion.div
                  animate={{
                    opacity: isSpeakingCrew ? 0.92 : joined ? 0.58 : 0.18,
                    scale: isSpeakingCrew ? 1.08 : 1,
                  }}
                  transition={{ duration: 0.22 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    backgroundColor: joined
                      ? withAlpha(crewColor, isSpeakingCrew ? 0.2 : 0.13)
                      : withAlpha(colors.purple500, 0.18),
                    border: `1px solid ${
                      isSpeakingCrew
                        ? withAlpha(crewColor, 0.76)
                        : joined
                          ? withAlpha(crewColor, 0.4)
                          : withAlpha(colors.purple500, 0.22)
                    }`,
                    boxShadow: isSpeakingCrew
                      ? `0 0 0 4px ${withAlpha(crewColor, 0.14)}, inset 0 -7px 14px ${withAlpha(
                          crewColor,
                          0.22,
                        )}`
                      : `inset 0 -6px 12px ${
                          joined
                            ? withAlpha(crewColor, 0.15)
                            : withAlpha(colors.grey900, 0.16)
                        }`,
                  }}
                />
                <AnimatePresence>
                  {isReceivingMission && (
                    <motion.div
                      key={`mission-in-hand-${activeMission.text}`}
                      initial={{ opacity: 0, y: 8, scale: 0.86, rotate: -4 }}
                      animate={{
                        opacity: 1,
                        y: -12,
                        scale: 1.04,
                        rotate: 0,
                      }}
                      exit={{ opacity: 0, y: -6, scale: 0.9 }}
                      transition={{
                        delay: isAiming ? 0.08 : 0,
                        duration: 0.28,
                        ease: "easeOut",
                      }}
                      style={{
                        position: "absolute",
                        bottom: 64,
                        ...missionBubblePosition,
                        zIndex: 12,
                        width: 160,
                        borderRadius: 14,
                        border: `1px solid ${withAlpha(activeMission.crewColor, 0.7)}`,
                        backgroundColor: colors.white,
                        boxShadow: `0 16px 30px rgba(0,27,55,0.2), inset 0 0 0 1px ${withAlpha(
                          activeMission.crewColor,
                          0.08,
                        )}`,
                        padding: "8px 9px 9px",
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          height: 18,
                          borderRadius: 999,
                          backgroundColor: withAlpha(
                            activeMission.crewColor,
                            0.14,
                          ),
                          color: activeMission.crewColor,
                          fontSize: 10,
                          fontWeight: 900,
                          padding: "0 7px",
                          marginBottom: 5,
                        }}
                      >
                        추가 중
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span style={{ fontSize: 20, lineHeight: 1 }}>
                          {activeMission.emoji}
                        </span>
                        <span
                          style={{
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: colors.grey900,
                            fontSize: 12,
                            fontWeight: 900,
                          }}
                        >
                          {activeMission.text}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 3,
                          color: colors.grey700,
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        미션으로 이동하고 있어요
                      </div>
                      <span
                        style={{
                          position: "absolute",
                          left: "50%",
                          bottom: -8,
                          width: 24,
                          height: 2,
                          borderRadius: 999,
                          backgroundColor: withAlpha(
                            activeMission.crewColor,
                            0.72,
                          ),
                          boxShadow: `0 2px 5px ${withAlpha(activeMission.crewColor, 0.26)}`,
                          transform: "translateX(-50%)",
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                {visibleCrew && (
                  <motion.span
                    key={`crew-${slot.clientId}`}
                    variants={crewVariants}
                    custom={index}
                    initial={
                      isEnteringCrew && !shouldReduceMotion
                        ? { x: 80, scale: 0.5, opacity: 0, rotate: 15 }
                        : { x: 0, scale: poseScale, opacity: 1, rotate: 0 }
                    }
                    animate={
                      shouldUseLaunchVariants
                        ? activeLaunchPhase
                        : isLaunching
                          ? {
                              x: 0,
                              y: 0,
                              scale: 0.96,
                              opacity: 1,
                              rotate: 0,
                            }
                          : isExitingCrew
                            ? {
                                x: -60,
                                y: 0,
                                scale: 0.7,
                                opacity: 0,
                                rotate: -12,
                              }
                            : isEnteringCrew
                              ? shouldReduceMotion
                                ? {
                                    x: 0,
                                    y: 0,
                                    scale: 1,
                                    opacity: 1,
                                    rotate: 0,
                                  }
                                : {
                                    x: [80, -10, 4, 0],
                                    y: 0,
                                    scale: [0.5, 1.2, 0.92, 1],
                                    opacity: 1,
                                    rotate: [15, -6, 2, 0],
                                  }
                              : isAiming
                                ? shouldReduceMotion
                                  ? {
                                      x: 0,
                                      y: 0,
                                      scale: poseScale,
                                      opacity: 1,
                                      rotate: 0,
                                    }
                                  : {
                                      x: 0,
                                      y: [0, -10, 4, 0],
                                      scaleY: [1, 1.18, 0.88, 1],
                                      scaleX: [1, 0.86, 1.12, 1],
                                      scale: 1,
                                      opacity: 1,
                                      rotate: [
                                        0,
                                        index % 2 === 0 ? -14 : 14,
                                        0,
                                        0,
                                      ],
                                    }
                                : isDominoCrew
                                  ? shouldReduceMotion
                                    ? {
                                        x: 0,
                                        y: 0,
                                        scale: poseScale,
                                        opacity: 1,
                                        rotate: 0,
                                      }
                                    : {
                                        x: 0,
                                        y: [0, dominoHopHeight, 0],
                                        scale: [
                                          poseScale,
                                          poseScale +
                                            Math.max(0, 0.12 - dist * 0.03),
                                          poseScale,
                                        ],
                                        opacity: 1,
                                        rotate: [
                                          0,
                                          index < (enteringCrewIndex ?? index)
                                            ? -dominoRotate
                                            : dominoRotate,
                                          0,
                                        ],
                                      }
                                  : isExcited
                                    ? {
                                        x: 0,
                                        y: [0, hopHeight, 0],
                                        scale: [
                                          poseScale,
                                          poseScale + proximity * 0.04,
                                          poseScale,
                                        ],
                                        opacity: 1,
                                        rotate: [
                                          0,
                                          index % 2 === 0 ? 4 : -4,
                                          0,
                                        ],
                                      }
                                    : isCompletionPreview
                                      ? {
                                          x: 0,
                                          y: [0, -18, 0],
                                          scale: [
                                            poseScale,
                                            poseScale + 0.1,
                                            poseScale,
                                          ],
                                          opacity: 1,
                                          rotate: [
                                            0,
                                            index % 2 === 0 ? -8 : 8,
                                            0,
                                          ],
                                        }
                                      : isAimSupporter
                                        ? {
                                            x: 0,
                                            y: shouldReduceMotion
                                              ? 0
                                              : [0, -4, 0],
                                            scale: poseScale,
                                            opacity: 1,
                                            rotate: aimSupporterDirection,
                                          }
                                        : {
                                            ...moodIdlePose,
                                          }
                    }
                    transition={
                      shouldUseLaunchVariants
                        ? undefined
                        : {
                            delay:
                              isDominoCrew && enteringCrewIndex != null
                                ? dist * 0.07
                                : isLaunching
                                  ? 0.08 + index * 0.06
                                  : 0,
                            duration: isLaunching
                              ? 0.78
                              : isExitingCrew
                                ? CREW_EXIT_END / 1000
                                : isDominoCrew
                                  ? Math.max(0.18, 0.28 - dist * 0.02)
                                  : isAiming
                                    ? 0.36
                                    : isExcited
                                      ? 0.34
                                      : isCompletionPreview
                                        ? 0.48
                                        : crewMood === "sitting"
                                          ? 0.28
                                          : crewMood === "ready"
                                            ? 0.5
                                            : crewMood === "celebrating"
                                              ? 0.52
                                              : 1.8 + index * 0.18,
                            ease: "easeOut",
                            type:
                              isEnteringCrew || isExcited || isAiming
                                ? "spring"
                                : undefined,
                            stiffness: isAiming
                              ? 420
                              : isEnteringCrew
                                ? 420
                                : isExcited
                                  ? 360
                                  : undefined,
                            damping: isAiming
                              ? 20
                              : isEnteringCrew
                                ? 22
                                : isExcited
                                  ? 16
                                  : undefined,
                            repeat:
                              canUseMoodLoop &&
                              (crewMood === "ready" ||
                                crewMood === "celebrating")
                                ? Infinity
                                : crewMood === "waiting" &&
                                    !isCompletionPreview &&
                                    !isLaunching &&
                                    !isChainActive &&
                                    !isExitingCrew
                                  ? Infinity
                                  : 0,
                            repeatDelay:
                              canUseMoodLoop &&
                              (crewMood === "ready" ||
                                crewMood === "celebrating")
                                ? 1.2 + index * 0.3
                                : undefined,
                            repeatType: "reverse",
                          }
                    }
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: joined ? 31 : 26,
                      lineHeight: 1,
                      paddingBottom: 4,
                      boxSizing: "border-box",
                      transformOrigin: "50% 100%",
                      zIndex: isAiming ? 8 : 2,
                      willChange: isCrewAnimating
                        ? "transform, opacity"
                        : undefined,
                    }}
                  >
                    {slot.emoji}
                  </motion.span>
                )}
                {!joined && (
                  <span
                    style={{
                      position: "absolute",
                      left: 8,
                      right: 8,
                      bottom: 0,
                      height: 3,
                      borderRadius: 999,
                      backgroundColor: withAlpha(crewColor, 0.28),
                    }}
                  />
                )}
              </div>
            );
          })}

          <AnimatePresence>
            {isLaunching && launchPhase !== "done" && (
              <motion.div
                key="launch-board"
                initial={{ opacity: 0, y: 6, scale: 0.78, rotate: -3 }}
                animate={{
                  opacity: 1,
                  y: [6, -62, -58],
                  scale: [0.78, 1.1, 1.04],
                  rotate: [-3, 1.5, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.24, duration: 0.52, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  left: 18,
                  right: 18,
                  bottom: 22,
                  zIndex: 12,
                  borderRadius: 16,
                  backgroundColor: colors.white,
                  border: `2px solid ${withAlpha(colors.purple500, 0.34)}`,
                  boxShadow: `0 18px 34px rgba(0,27,55,0.18), 0 0 0 8px ${withAlpha(
                    colors.purple500,
                    0.06,
                  )}`,
                  padding: "14px 12px",
                  textAlign: "center",
                  color: colors.purple900,
                  fontSize: 19,
                  fontWeight: 900,
                }}
              >
                {LAUNCH_BOARD_TEXT.split("").map((char, index) => (
                  <motion.span
                    key={`${char}-${index}`}
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: 0.32 + index * 0.04,
                      duration: 0.18,
                    }}
                    style={{
                      display: "inline-block",
                      whiteSpace: char === " " ? "pre" : "normal",
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.section>
    );
  },
);
