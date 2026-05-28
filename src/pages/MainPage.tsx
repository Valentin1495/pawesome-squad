import { Button, Top, useDialog } from "@toss/tds-mobile";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CollectionDrawer } from "../components/CollectionDrawer";
import { GoalEditor } from "../components/GoalEditor";
import { GoalItem } from "../components/GoalItem";
import { ProgressSection } from "../components/ProgressSection";
import { CrewCheerBand } from "../components/goal-editor/CrewCheerBand";
import {
  ALL_CREW_CHARACTERS,
  SHARE_REWARD_CHARACTER_ID,
  getAvailableCrewCharacters,
} from "../components/goal-editor/constants";
import { useHaptic } from "../hooks/useHaptic";
import { useAppStore, type GoalInput } from "../store/useAppStore";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const PROGRESS_REACTION_DELAY_MS = 450;
const INITIAL_CREW_CHARACTERS = getAvailableCrewCharacters([]);
const OVER_CHEER_COST = 5;
const OVER_CHEER_LINES = [
  "별거 아니라고요? 햄찌가 들으면 간식 내려놓고 반박합니다.",
  "작은 목표 하나 끝냈을 뿐인데 햄찌는 이미 현수막 주문했어요.",
  "체크 하나 했네요. 햄찌는 지금 기립박수 중이에요. 키가 작아서 티가 안 날 뿐.",
  "햄찌가 방금 회의 열었어요. 안건: 이 사람 왜 이렇게 기특한가.",
  "햄찌가 당신의 방금 클릭을 올해의 장면 후보에 올렸어요.",
];
const CHECK_CHEER_TITLES = [
  "방금 해냈습니다",
  "작은 승리 접수",
  "오늘의 명장면",
  "응원단 긴급 출동",
  "체크 하나로 분위기 반전",
];

interface CheckCheer {
  id: number;
  emoji: string;
  title: string;
  goalText: string;
  message: string;
  accentColor: string;
}

function CheckCheerOverlay({
  cheer,
  onClose,
  shouldReduceMotion,
}: {
  cheer: CheckCheer;
  onClose: () => void;
  shouldReduceMotion: boolean;
}) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onClose, 1450);
    return () => window.clearTimeout(timeoutId);
  }, [onClose]);

  return (
    <motion.div
      key={cheer.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 45,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        boxSizing: "border-box",
        backgroundColor: "rgba(25,25,25,0.18)",
      }}
    >
      {!shouldReduceMotion && (
        <motion.div
          initial={{ scale: 0.72, opacity: 0 }}
          animate={{ scale: 1.4, opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: `4px solid ${cheer.accentColor}`,
          }}
        />
      )}
      <motion.div
        initial={
          shouldReduceMotion
            ? false
            : { scale: 0.72, y: 28, rotate: -3, opacity: 0 }
        }
        animate={
          shouldReduceMotion
            ? { opacity: 1 }
            : {
                scale: [0.72, 1.08, 1],
                y: 0,
                rotate: [-3, 2, 0],
                opacity: 1,
              }
        }
        exit={shouldReduceMotion ? undefined : { scale: 0.9, y: 16 }}
        transition={{ duration: 0.36, ease: "easeOut" }}
        style={{
          position: "relative",
          width: "min(100%, 340px)",
          borderRadius: 22,
          backgroundColor: "#ffffff",
          border: `2px solid ${cheer.accentColor}`,
          boxShadow: "0 24px 70px rgba(0,0,0,0.22)",
          padding: "24px 20px 22px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {!shouldReduceMotion && (
          <>
            {["작", "은", "승", "리"].map((letter, index) => (
              <motion.span
                key={`${cheer.id}-${letter}-${index}`}
                initial={{
                  opacity: 0,
                  y: 20,
                  x: index % 2 === 0 ? -24 : 24,
                  rotate: index % 2 === 0 ? -18 : 18,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  y: -72 - index * 6,
                  x: index % 2 === 0 ? -52 : 52,
                  rotate: index % 2 === 0 ? -28 : 28,
                }}
                transition={{
                  duration: 0.88,
                  delay: 0.08 + index * 0.06,
                  ease: "easeOut",
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: 10,
                  color: cheer.accentColor,
                  fontSize: 18,
                  fontWeight: 900,
                }}
              >
                {letter}
              </motion.span>
            ))}
          </>
        )}
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : { scale: [1, 1.18, 1], rotate: [0, -10, 10, 0] }
          }
          transition={{ duration: 0.62, ease: "easeOut" }}
          style={{ fontSize: 58, lineHeight: 1, marginBottom: 10 }}
        >
          {cheer.emoji}
        </motion.div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "100%",
            borderRadius: 999,
            backgroundColor: "rgba(25,25,25,0.05)",
            color: cheer.accentColor,
            fontSize: 11,
            fontWeight: 900,
            padding: "5px 10px",
            marginBottom: 10,
            boxSizing: "border-box",
          }}
        >
          {cheer.title}
        </div>
        <h2
          style={{
            margin: "0 0 8px",
            color: "#191919",
            fontSize: 22,
            fontWeight: 900,
            lineHeight: 1.25,
            wordBreak: "keep-all",
          }}
        >
          {cheer.goalText}
        </h2>
        <p
          style={{
            margin: 0,
            color: "#333",
            fontSize: 15,
            fontWeight: 800,
            lineHeight: 1.45,
            wordBreak: "keep-all",
          }}
        >
          {cheer.message}
        </p>
      </motion.div>
    </motion.div>
  );
}

function OverCheerOverlay({
  message,
  onClose,
  shouldReduceMotion,
}: {
  message: string;
  onClose: () => void;
  shouldReduceMotion: boolean;
}) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onClose, 2600);
    return () => window.clearTimeout(timeoutId);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: "rgba(25,25,25,0.34)",
        boxSizing: "border-box",
      }}
    >
      <motion.div
        initial={
          shouldReduceMotion ? false : { scale: 0.82, y: 22, rotate: -2 }
        }
        animate={
          shouldReduceMotion
            ? { scale: 1, y: 0, rotate: 0 }
            : { scale: [0.82, 1.08, 1], y: 0, rotate: [-2, 2, 0] }
        }
        exit={shouldReduceMotion ? undefined : { scale: 0.92, y: 12 }}
        transition={{ duration: 0.34, ease: "easeOut" }}
        style={{
          width: "min(100%, 340px)",
          borderRadius: 24,
          backgroundColor: "#fff",
          padding: "24px 20px 22px",
          textAlign: "center",
          boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
          border: "2px solid rgba(255,215,64,0.62)",
        }}
      >
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : { y: [0, -8, 0], rotate: [0, -8, 8, 0] }
          }
          transition={{ duration: 0.7, repeat: 2, ease: "easeInOut" }}
          style={{ fontSize: 58, lineHeight: 1, marginBottom: 12 }}
        >
          🐹
        </motion.div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            backgroundColor: "#fff4c2",
            color: "#8a6100",
            fontSize: 11,
            fontWeight: 900,
            padding: "5px 9px",
            marginBottom: 10,
          }}
        >
          햄찌 과장 응원단 출동
        </div>
        <p
          style={{
            margin: 0,
            color: "#191919",
            fontSize: 18,
            fontWeight: 900,
            lineHeight: 1.45,
            wordBreak: "keep-all",
          }}
        >
          {message}
        </p>
      </motion.div>
    </motion.div>
  );
}

export function MainPage() {
  const haptic = useHaptic();
  const dialog = useDialog();
  const shouldReduceMotion = useReducedMotion() === true;
  const {
    goals,
    unlockedCharacters,
    totalCompletionCount,
    completedGoalRecords,
    shareRewardSnackCount,
    spendShareRewardSnacks,
    toggleGoal,
    updateGoals,
    startNewMission,
    resetOnboarding,
    setShowCelebration,
  } = useAppStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedCrewIndex, setSelectedCrewIndex] = useState(0);
  const [crewMessage, setCrewMessage] = useState<string>(() =>
    pickRandom(INITIAL_CREW_CHARACTERS[0].messages.idle),
  );
  const [crewCheerKey, setCrewCheerKey] = useState(0);
  const [checkCheer, setCheckCheer] = useState<CheckCheer | null>(null);
  const [overCheerMessage, setOverCheerMessage] = useState<string | null>(null);
  const previousMissionCrewSignatureRef = useRef<string | null>(null);

  const availableCrewCharacters = useMemo(
    () => getAvailableCrewCharacters(unlockedCharacters),
    [unlockedCharacters],
  );
  const missionCrewCharacters = useMemo(() => {
    const crewById = new Map(
      availableCrewCharacters.map((character) => [character.id, character]),
    );
    const uniqueCrewIds = new Set<string>();
    const nextCharacters = goals.flatMap((goal, index) => {
      const fallbackCrew =
        availableCrewCharacters[index % availableCrewCharacters.length];
      const character =
        (goal.crewId == null ? undefined : crewById.get(goal.crewId)) ??
        fallbackCrew;

      if (character == null || uniqueCrewIds.has(character.id)) {
        return [];
      }

      uniqueCrewIds.add(character.id);
      return [character];
    });

    return nextCharacters.length > 0 ? nextCharacters : availableCrewCharacters;
  }, [availableCrewCharacters, goals]);
  const missionCrewSignature = missionCrewCharacters
    .map((character) => character.id)
    .join("|");
  const selectedMissionCrew =
    missionCrewCharacters[selectedCrewIndex] ?? missionCrewCharacters[0];
  const done = goals.filter((goal) => goal.done).length;
  const allDone = goals.length > 0 && done === goals.length;
  const hasShareRewardCharacter = unlockedCharacters.some(
    (character) => character.id === SHARE_REWARD_CHARACTER_ID,
  );
  const canUseOverCheer =
    hasShareRewardCharacter && shareRewardSnackCount >= OVER_CHEER_COST;
  const [displayedDone, setDisplayedDone] = useState(done);
  const displayedAllDone = goals.length > 0 && displayedDone === goals.length;
  const today = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const openDrawer = () => {
    haptic("basicMedium");
    setDrawerOpen(true);
  };

  useEffect(() => {
    if (displayedDone === done) return;

    if (done < displayedDone) {
      setDisplayedDone(done);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDisplayedDone(done);
    }, PROGRESS_REACTION_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [displayedDone, done]);

  useEffect(() => {
    if (previousMissionCrewSignatureRef.current === missionCrewSignature) {
      return;
    }
    previousMissionCrewSignatureRef.current = missionCrewSignature;

    const selectedCharacter = selectedMissionCrew;
    if (selectedCharacter == null) return;

    if (selectedCrewIndex < missionCrewCharacters.length) {
      setCrewMessage(pickRandom(selectedCharacter.messages.idle));
      return;
    }

    setSelectedCrewIndex(0);
    setCrewMessage(pickRandom(selectedCharacter.messages.idle));
  }, [
    missionCrewSignature,
    missionCrewCharacters.length,
    selectedCrewIndex,
    selectedMissionCrew,
  ]);

  const handleSaveGoals = (nextGoals: GoalInput[]) => {
    haptic("success");
    updateGoals(nextGoals);
    setEditing(false);
  };

  const handleCrewSelect = useCallback(
    (index: number) => {
      const character = missionCrewCharacters[index];
      if (character == null) return;

      setSelectedCrewIndex(index);
      setCrewCheerKey((current) => current + 1);
      setCrewMessage(pickRandom(character.messages.idle));
    },
    [missionCrewCharacters],
  );

  const handleToggleGoal = useCallback(
    (id: string) => {
      if (allDone) return;

      const target = goals.find((goal) => goal.id === id);
      if (target == null) return;
      const targetIndex = goals.findIndex((goal) => goal.id === id);
      const fallbackCrew =
        availableCrewCharacters[targetIndex % availableCrewCharacters.length];
      const targetCrewId = target.crewId ?? fallbackCrew?.id;

      toggleGoal(id);

      const isNowDone = !target.done;
      const currentDoneCount = goals.filter((goal) => goal.done).length;
      const nextDoneCount = currentDoneCount + (isNowDone ? 1 : -1);
      const assignedCrewIndex = missionCrewCharacters.findIndex(
        (character) => character.id === targetCrewId,
      );
      const character =
        missionCrewCharacters[assignedCrewIndex] ??
        missionCrewCharacters[selectedCrewIndex] ??
        missionCrewCharacters[0];
      const nextMessage =
        nextDoneCount <= 0
          ? pickRandom(character.messages.idle)
          : nextDoneCount === goals.length
            ? character.messages.onAllDone
            : pickRandom(character.messages.onGoalCheck);

      setCrewMessage(nextMessage);
      if (isNowDone) {
        if (assignedCrewIndex >= 0) {
          setSelectedCrewIndex(assignedCrewIndex);
        }
        haptic("confetti");
        setCheckCheer({
          id: Date.now(),
          emoji: character.emoji,
          title: pickRandom(CHECK_CHEER_TITLES),
          goalText: target.text,
          message: nextMessage,
          accentColor: character.bgColor,
        });
        setCrewCheerKey((current) => current + 1);
      }
    },
    [
      availableCrewCharacters,
      allDone,
      goals,
      missionCrewCharacters,
      selectedCrewIndex,
      toggleGoal,
      haptic,
    ],
  );

  const handleOpenCelebration = () => {
    if (!allDone) return;

    haptic("success");
    setShowCelebration(true);
  };

  const handleResetOnboarding = () => {
    dialog.openAsyncConfirm({
      title: "처음부터 다시 시작할까요?",
      description:
        "지금까지의 목표와 응원단 기록이 모두 지워지고 처음 설정 화면으로 돌아가요.",
      confirmButton: "다시 시작",
      cancelButton: "취소",
      onConfirmClick: async () => {
        haptic("success");
        resetOnboarding();
      },
    });
  };
  const handleStartNewMission = () => {
    haptic("success");
    startNewMission();
  };

  const handleUseOverCheer = () => {
    const spent = spendShareRewardSnacks(OVER_CHEER_COST);
    if (!spent) {
      haptic("error");
      return;
    }

    haptic("confetti");
    setOverCheerMessage(pickRandom(OVER_CHEER_LINES));
    setCrewCheerKey((current) => current + 1);
  };

  if (editing) {
    return (
      <GoalEditor
        mode="edit"
        initialGoals={goals}
        title="응원단을 다시 정비할까요?"
        subtitle="완료한 목표는 그대로 인정하고, 새 목표만 다시 응원할게요."
        submitLabel="수정 완료"
        onSubmit={handleSaveGoals}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#fafaf8",
        paddingBottom: 40,
      }}
    >
      <Top
        title={<Top.TitleParagraph size={22}>오늘의 미션</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>{today}</Top.SubtitleParagraph>
        }
      />

      {displayedAllDone && (
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          style={{ padding: "4px 20px 16px" }}
        >
          <div
            style={{
              borderRadius: 20,
              backgroundColor: "#fff",
              border: "1px solid rgba(149,117,205,0.22)",
              padding: "28px 22px",
              textAlign: "center",
              boxShadow: "0 12px 30px rgba(149,117,205,0.1)",
            }}
          >
            <div style={{ fontSize: 46, marginBottom: 10 }}>🎉</div>
            <h2 style={{ margin: "0 0 8px", color: "#191919", fontSize: 21 }}>
              오늘 목표를 모두 달성했어요!
            </h2>
            <p
              style={{
                margin: 0,
                color: "#666",
                fontSize: 14,
                lineHeight: 1.55,
              }}
            >
              오늘의 미션은 모두 완료했어요.
              <br />
              축하를 받은 뒤 새로운 미션을 시작해보세요.
            </p>
            <Button
              type="button"
              display="full"
              size="large"
              variant="fill"
              onClick={handleOpenCelebration}
              style={{
                marginTop: 18,
                borderRadius: 999,
                fontWeight: 900,
              }}
            >
              축하 받기
            </Button>
          </div>
        </motion.div>
      )}

      <ProgressSection done={displayedDone} total={goals.length} />

      <CrewCheerBand
        characters={missionCrewCharacters}
        selectedIndex={selectedCrewIndex}
        cheerKey={crewCheerKey}
        onSelect={handleCrewSelect}
        message={crewMessage}
        shouldReduceMotion={shouldReduceMotion}
      />

      {hasShareRewardCharacter && (
        <div style={{ padding: "0 20px 4px" }}>
          <Button
            type="button"
            display="full"
            size="medium"
            variant={canUseOverCheer ? "fill" : "weak"}
            color={canUseOverCheer ? "dark" : undefined}
            disabled={!canUseOverCheer}
            onClick={handleUseOverCheer}
            style={{
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            햄찌 과장 응원 쓰기 · 간식 {shareRewardSnackCount}개
          </Button>
        </div>
      )}

      <div
        style={{
          padding: displayedAllDone ? "0 20px 16px" : "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <AnimatePresence mode="popLayout">
          {goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <GoalItem
                goal={goal}
                disabled={allDone}
                onToggle={handleToggleGoal}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div style={{ padding: "0 20px 20px" }}>
        {!allDone && (
          <Button
            type="button"
            display="full"
            size="large"
            variant="fill"
            onClick={() => setEditing(true)}
            style={{
              width: "100%",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            목표 수정하기
          </Button>
        )}
        <Button
          type="button"
          display="full"
          size="large"
          variant="weak"
          onClick={openDrawer}
          style={{
            width: "100%",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 800,
            marginTop: allDone ? 0 : 10,
          }}
        >
          누적 달성 {totalCompletionCount}개 · 응원단{" "}
          {unlockedCharacters.length}/{ALL_CREW_CHARACTERS.length}명
        </Button>
        {allDone && (
          <Button
            type="button"
            display="full"
            size="large"
            variant="weak"
            color="dark"
            onClick={handleStartNewMission}
            style={{
              width: "100%",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 800,
              marginTop: 10,
            }}
          >
            새로운 미션 시작하기
          </Button>
        )}
        <Button
          type="button"
          display="full"
          size="large"
          variant="weak"
          color="danger"
          onClick={handleResetOnboarding}
          style={{
            width: "100%",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 800,
            marginTop: 10,
          }}
        >
          처음부터 다시 시작하기
        </Button>
      </div>

      <CollectionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        unlockedCharacters={unlockedCharacters}
        totalCompletionCount={totalCompletionCount}
        completedGoalRecords={completedGoalRecords}
      />

      <AnimatePresence>
        {checkCheer != null && (
          <CheckCheerOverlay
            cheer={checkCheer}
            shouldReduceMotion={shouldReduceMotion}
            onClose={() => setCheckCheer(null)}
          />
        )}
        {overCheerMessage != null && (
          <OverCheerOverlay
            message={overCheerMessage}
            shouldReduceMotion={shouldReduceMotion}
            onClose={() => setOverCheerMessage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
