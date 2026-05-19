import { colors } from "@toss/tds-colors";
import { BottomSheet, Button, Text, useBottomSheet } from "@toss/tds-mobile";
import { AnimatePresence, motion } from "framer-motion";
import { forwardRef } from "react";
import type { GoalInput } from "../../store/useAppStore";
import {
  ADD_PHASE_DURATIONS,
  CREW_COLORS,
  CREW_EMOJIS,
  type CrewCharacter,
  type LaunchPhase,
  MAX_GOAL_TEXT_LENGTH,
  withAlpha,
} from "./constants";
import { EmojiPalette } from "./EmojiPalette";
import type { VisualCrewSlot } from "./GoalStage";
import { getRandomCheerLine, type LocalGoalInput } from "./utils";

interface GoalBoardProps {
  availableCrewCharacters: CrewCharacter[];
  creationMode: "recommended" | "custom";
  goals: LocalGoalInput[];
  crewSlots: VisualCrewSlot[];
  isFlowActive: boolean;
  isImpacting: boolean;
  isBoardLocked: boolean;
  isLaunching: boolean;
  launchPhase: LaunchPhase;
  isOnboarding: boolean;
  landedClientId: string | null;
  onRemoveGoal: (index: number) => void;
  onUpdateGoal: (index: number, patch: Partial<GoalInput>) => void;
}

export const GoalBoard = forwardRef<HTMLElement, GoalBoardProps>(
  function GoalBoard(
    {
      availableCrewCharacters,
      creationMode,
      goals,
      crewSlots,
      isFlowActive,
      isImpacting,
      isBoardLocked,
      isLaunching,
      launchPhase,
      isOnboarding,
      landedClientId,
      onRemoveGoal,
      onUpdateGoal,
    },
    ref,
  ) {
    const { open: openBottomSheet, close: closeBottomSheet } = useBottomSheet();
    const isMissionPacking = launchPhase === "mission-pack";
    const shouldUseLaunchLayout = isLaunching && !isMissionPacking;

    const openEmojiPalette = (index: number, emoji: string) => {
      if (isLaunching || isBoardLocked) return;

      openBottomSheet({
        header: (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <BottomSheet.Header>목표 이모지 선택</BottomSheet.Header>
          </div>
        ),
        children: (
          <EmojiPalette
            selectedEmoji={emoji}
            onSelectEmoji={(nextEmoji) => {
              onUpdateGoal(index, { emoji: nextEmoji });
              closeBottomSheet();
            }}
          />
        ),
        onClose: closeBottomSheet,
      });
    };

    const openCrewPicker = (index: number, crewId: string | undefined) => {
      if (isLaunching || isBoardLocked) return;

      openBottomSheet({
        header: (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <BottomSheet.Header>담당 크루 선택</BottomSheet.Header>
          </div>
        ),
        children: (
          <CrewPicker
            characters={availableCrewCharacters}
            selectedCrewId={crewId}
            onSelectCrew={(nextCrewId) => {
              onUpdateGoal(index, { crewId: nextCrewId });
              closeBottomSheet();
            }}
          />
        ),
        onClose: closeBottomSheet,
      });
    };

    return (
      <motion.section
        ref={ref}
        animate={
          isFlowActive && !isLaunching
            ? { scale: 1.01, y: -2 }
            : { scale: 1, y: 0 }
        }
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        style={{ transformOrigin: "50% 0%" }}
      >
        <Text
          typography="t5"
          fontWeight="bold"
          color={colors.grey800}
          display="block"
          style={{ margin: "0 0 10px" }}
        >
          오늘의 미션
        </Text>
        <motion.div
          layout
          animate={
            shouldUseLaunchLayout ? { y: -8, scale: 0.96 } : { y: 0, scale: 1 }
          }
          style={{
            display: shouldUseLaunchLayout ? "grid" : "block",
            gap: 8,
            gridTemplateColumns: shouldUseLaunchLayout
              ? "repeat(3, minmax(0, 1fr))"
              : undefined,
            transformOrigin: "50% 0%",
          }}
        >
          <AnimatePresence mode="popLayout">
            {goals.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  borderColor: isFlowActive
                    ? withAlpha(colors.purple500, 0.58)
                    : colors.grey300,
                  backgroundColor: isFlowActive
                    ? withAlpha(colors.purple500, 0.08)
                    : withAlpha(colors.purple500, 0.04),
                }}
                exit={{ opacity: 0 }}
                style={{
                  border: `1px dashed ${colors.grey300}`,
                  borderRadius: 16,
                  padding: "24px 16px",
                  textAlign: "center",
                  backgroundColor: withAlpha(colors.purple500, 0.04),
                }}
              >
                <Text typography="t6" color={colors.grey500}>
                  {creationMode === "custom"
                    ? "사소한 목표를 하나씩 추가해 보세요."
                    : "추천 목표 카드를 골라 오늘의 목표를 모아보세요."}
                </Text>
              </motion.div>
            ) : (
              goals.map((goal, index) => {
                const isJustLanded = goal._clientId === landedClientId;
                const crewSlot = crewSlots.find(
                  (slot) => slot.clientId === goal._clientId,
                );
                const crewIndex = crewSlot?.crewIndex ?? index;
                const crewColor = CREW_COLORS[crewIndex % CREW_COLORS.length];
                const crewCharacter =
                  availableCrewCharacters.find(
                    (character) => character.id === goal.crewId,
                  ) ?? availableCrewCharacters[crewIndex % availableCrewCharacters.length];
                const crewEmoji =
                  crewSlot?.emoji ??
                  crewCharacter?.emoji ??
                  CREW_EMOJIS[crewIndex % CREW_EMOJIS.length];

                return (
                  <motion.div
                    layout
                    key={goal._clientId}
                    initial={{
                      opacity: 0,
                      y: isJustLanded ? -72 : isOnboarding ? -34 : 20,
                      scale: isJustLanded ? 0.86 : isOnboarding ? 0.9 : 0.94,
                      rotate: isJustLanded
                        ? index % 2 === 0
                          ? -6
                          : 6
                        : index % 2 === 0
                          ? -3
                          : 3,
                    }}
                    animate={{
                      opacity: 1,
                      scale: isMissionPacking
                        ? [1, 1.06, 1]
                        : isJustLanded
                          ? [0.82, 1.08, 0.96, 1.01, 1]
                          : 1,
                      rotate:
                        isJustLanded && !isLaunching
                          ? [index % 2 === 0 ? -6 : 6, 2, -1, 0]
                          : 0,
                      y: isMissionPacking
                        ? [0, -10, 0]
                        : isJustLanded && !isLaunching
                          ? [20, -14, 5, -2, 0]
                          : 0,
                      borderTopColor: isJustLanded
                        ? withAlpha(colors.purple500, 0.56)
                        : isFlowActive
                          ? withAlpha(colors.purple500, 0.46)
                          : colors.grey200,
                      borderRightColor: isJustLanded
                        ? withAlpha(colors.purple500, 0.56)
                        : isFlowActive
                          ? withAlpha(colors.purple500, 0.46)
                          : colors.grey200,
                      borderBottomColor: isJustLanded
                        ? withAlpha(colors.purple500, 0.56)
                        : isFlowActive
                          ? withAlpha(colors.purple500, 0.46)
                          : colors.grey200,
                      borderLeftColor: crewColor,
                      boxShadow: isMissionPacking
                        ? `0 14px 30px ${withAlpha(crewColor, 0.16)}`
                        : isJustLanded
                          ? "0 14px 28px rgba(0,27,55,0.16)"
                          : isFlowActive
                            ? "0 12px 24px rgba(0,27,55,0.1)"
                            : "0 8px 18px rgba(0,27,55,0.06)",
                    }}
                    exit={{
                      opacity: 0,
                      x: 28,
                      y: -4,
                      scale: 0.82,
                      rotate: index % 2 === 0 ? 6 : -6,
                    }}
                    transition={{
                      type: isMissionPacking ? undefined : "spring",
                      stiffness: isJustLanded ? 460 : 360,
                      damping: isJustLanded ? 22 : 26,
                      delay: isMissionPacking ? index * 0.08 : 0,
                      duration: isMissionPacking
                        ? 0.7
                        : isJustLanded
                          ? ADD_PHASE_DURATIONS.GOAL_LAND / 1000
                          : undefined,
                      ease: isMissionPacking ? "easeOut" : undefined,
                    }}
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: shouldUseLaunchLayout ? "column" : "row",
                      gap: 10,
                      alignItems: "center",
                      justifyContent: shouldUseLaunchLayout
                        ? "flex-start"
                        : undefined,
                      border: `1px solid ${colors.grey200}`,
                      borderLeftWidth: 4,
                      borderLeftStyle: "solid",
                      borderLeftColor: crewColor,
                      borderRadius: 16,
                      backgroundColor: colors.white,
                      padding: shouldUseLaunchLayout
                        ? "12px 8px 10px"
                        : "10px 10px 10px 12px",
                      marginBottom: shouldUseLaunchLayout ? 0 : 8,
                      minHeight: shouldUseLaunchLayout ? 92 : undefined,
                      overflow: "visible",
                    }}
                  >
                    <AnimatePresence>
                      {isMissionPacking && (
                        <motion.span
                          key="mission-packed-check"
                          initial={{ opacity: 0, scale: 0.4, y: 4 }}
                          animate={{ opacity: 1, scale: [0.4, 1.18, 1], y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: -4 }}
                          transition={{
                            delay: 0.12 + index * 0.08,
                            duration: 0.28,
                            ease: "easeOut",
                          }}
                          style={{
                            position: "absolute",
                            top: -8,
                            right: -6,
                            zIndex: 6,
                            width: 24,
                            height: 24,
                            borderRadius: 999,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `2px solid ${colors.white}`,
                            backgroundColor: crewColor,
                            color: colors.white,
                            fontSize: 14,
                            fontWeight: 900,
                            boxShadow: `0 8px 16px ${withAlpha(crewColor, 0.24)}`,
                            pointerEvents: "none",
                          }}
                        >
                          ✓
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {isJustLanded && !isLaunching && (
                        <motion.div
                          key="goal-cheer-bubble"
                          initial={{ opacity: 0, y: 6, scale: 0.88 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.92 }}
                          transition={{ delay: 0.2, duration: 0.22 }}
                          style={{
                            position: "absolute",
                            top: -32,
                            left: 12,
                            zIndex: 3,
                            maxWidth: "calc(100% - 24px)",
                            border: `1px solid ${withAlpha(crewColor, 0.36)}`,
                            borderRadius: "12px 12px 12px 4px",
                            backgroundColor: colors.white,
                            boxShadow: "0 4px 12px rgba(0,27,55,0.12)",
                            padding: "4px 10px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                          }}
                        >
                          <Text
                            typography="t7"
                            fontWeight="bold"
                            color={crewColor}
                          >
                            {getRandomCheerLine(goal.text, goals.length)}
                          </Text>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {isJustLanded && !isLaunching && isImpacting && (
                        <motion.span
                          key="impact-ring"
                          initial={{ opacity: 0.9, scale: 0.5 }}
                          animate={{ opacity: 0, scale: 2.4 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.38, ease: "easeOut" }}
                          style={{
                            position: "absolute",
                            inset: -4,
                            borderRadius: 20,
                            border: `2px solid ${withAlpha(crewColor, 0.58)}`,
                            pointerEvents: "none",
                            zIndex: 0,
                          }}
                        />
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {isJustLanded && !isLaunching && (
                        <motion.div
                          key="goal-stamp"
                          initial={{ opacity: 0, scale: 1.4, rotate: -12 }}
                          animate={{
                            opacity: [0, 1, 0.92],
                            scale: [1.4, 0.92, 1],
                            rotate: -8,
                          }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{
                            delay: 0.08,
                            duration: 0.34,
                            ease: "easeOut",
                          }}
                          style={{
                            position: "absolute",
                            right: 12,
                            top: -10,
                            zIndex: 4,
                            border: `2px solid ${withAlpha(crewColor, 0.72)}`,
                            borderRadius: 999,
                            backgroundColor: colors.white,
                            color: crewColor,
                            fontSize: 11,
                            fontWeight: 900,
                            padding: "4px 8px",
                            boxShadow: "0 6px 14px rgba(0,27,55,0.12)",
                            pointerEvents: "none",
                          }}
                        >
                          접수 완료
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {isJustLanded && (
                        <motion.span
                          key="goal-shine"
                          initial={{ opacity: 0, x: "-120%" }}
                          animate={{ opacity: [0, 0.75, 0], x: "120%" }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.58, ease: "easeOut" }}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "56%",
                            background:
                              "linear-gradient(100deg, transparent, rgba(255,255,255,0.86), transparent)",
                            pointerEvents: "none",
                          }}
                        />
                      )}
                    </AnimatePresence>
                    <div
                      style={{
                        position: "relative",
                        zIndex: 2,
                        flex: "0 0 auto",
                      }}
                    >
                      <motion.button
                        type="button"
                        disabled={isLaunching || isBoardLocked}
                        initial={{ scale: 0, y: 12 }}
                        animate={{
                          scale: isJustLanded ? [1, 1.22, 0.94, 1] : 1,
                          y: isJustLanded ? [-6, 4, -2, 0] : 0,
                          rotate: isJustLanded ? [0, -8, 6, 0] : 0,
                        }}
                        whileTap={
                          isLaunching || isBoardLocked
                            ? undefined
                            : { scale: 0.92 }
                        }
                        transition={{
                          type: "spring",
                          stiffness: isJustLanded ? 460 : 300,
                          damping: isJustLanded ? 18 : 22,
                        }}
                        onClick={() => openEmojiPalette(index, goal.emoji)}
                        style={{
                          width: 34,
                          height: 34,
                          border: "none",
                          borderRadius: 12,
                          backgroundColor: withAlpha(crewColor, 0.1),
                          color: colors.grey900,
                          fontSize: 24,
                          lineHeight: 1,
                          padding: 0,
                          cursor:
                            isLaunching || isBoardLocked
                              ? "default"
                              : "pointer",
                        }}
                        aria-label="목표 이모지 선택"
                      >
                        {goal.emoji}
                      </motion.button>
                    </div>
                    {shouldUseLaunchLayout ? (
                      <div
                        style={{
                          minWidth: 0,
                          width: "100%",
                          color: colors.grey800,
                          fontSize: 14,
                          fontWeight: 900,
                          lineHeight: 1.28,
                          textAlign: "center",
                          wordBreak: "keep-all",
                          overflowWrap: "anywhere",
                          position: "relative",
                          zIndex: 1,
                        }}
                      >
                        {goal.text}
                      </div>
                    ) : (
                      <input
                        value={goal.text}
                        readOnly={isBoardLocked}
                        maxLength={MAX_GOAL_TEXT_LENGTH}
                        onChange={(event) =>
                          onUpdateGoal(index, { text: event.target.value })
                        }
                        style={{
                          minWidth: 0,
                          flex: 1,
                          border: "none",
                          outline: "none",
                          color: colors.grey800,
                          fontWeight: 700,
                          backgroundColor: "transparent",
                          textOverflow: "ellipsis",
                          position: "relative",
                          zIndex: 1,
                        }}
                      />
                    )}
                    {!isLaunching && !isBoardLocked && (
                      <button
                        type="button"
                        onClick={() => openCrewPicker(index, goal.crewId)}
                        style={{
                          position: "relative",
                          zIndex: 1,
                          flex: "0 0 auto",
                          border: "none",
                          borderRadius: 999,
                          backgroundColor: withAlpha(crewColor, 0.1),
                          color: crewColor,
                          fontSize: 11,
                          fontWeight: 900,
                          padding: "5px 7px",
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                        }}
                        aria-label={`${goal.text} 담당 크루 선택`}
                      >
                        {crewEmoji} 담당
                      </button>
                    )}
                    {!isLaunching && !isBoardLocked && (
                      <>
                        <Button
                          type="button"
                          size="small"
                          variant="weak"
                          color="danger"
                          onClick={() => {
                            onRemoveGoal(index);
                          }}
                          style={{
                            width: 34,
                            minWidth: 34,
                            height: 34,
                            padding: 0,
                            zIndex: 1,
                          }}
                          aria-label="목표 삭제"
                        >
                          ×
                        </Button>
                      </>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>
      </motion.section>
    );
  },
);

function CrewPicker({
  characters,
  selectedCrewId,
  onSelectCrew,
}: {
  characters: CrewCharacter[];
  selectedCrewId?: string;
  onSelectCrew: (crewId: string) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 10,
        padding: "4px 20px 24px",
        boxSizing: "border-box",
      }}
    >
      {characters.map((character) => {
        const selected = selectedCrewId === character.id;

        return (
          <button
            key={character.id}
            type="button"
            onClick={() => onSelectCrew(character.id)}
            style={{
              minWidth: 0,
              border: selected
                ? `2px solid ${colors.purple500}`
                : `1px solid ${withAlpha(colors.grey900, 0.1)}`,
              borderRadius: 16,
              backgroundColor: selected
                ? withAlpha(colors.purple500, 0.08)
                : colors.white,
              padding: "12px 8px",
              boxShadow: selected
                ? `0 0 0 4px ${withAlpha(colors.purple500, 0.08)}`
                : "0 6px 16px rgba(0,27,55,0.04)",
              cursor: "pointer",
            }}
            aria-pressed={selected}
          >
            <span
              style={{
                width: 42,
                height: 42,
                margin: "0 auto 7px",
                borderRadius: "50%",
                backgroundColor: withAlpha(character.bgColor, 0.16),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
              }}
            >
              {character.emoji}
            </span>
            <Text
              typography="t7"
              color={selected ? colors.purple700 : colors.grey800}
              fontWeight="bold"
              display="block"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {character.name}
            </Text>
          </button>
        );
      })}
    </div>
  );
}
