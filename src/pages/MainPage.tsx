import { Button, Top } from "@toss/tds-mobile";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CollectionDrawer } from "../components/CollectionDrawer";
import { GoalEditor } from "../components/GoalEditor";
import { GoalItem } from "../components/GoalItem";
import { ProgressSection } from "../components/ProgressSection";
import { CrewCheerBand } from "../components/goal-editor/CrewCheerBand";
import {
  ALL_CREW_CHARACTERS,
  getAvailableCrewCharacters,
} from "../components/goal-editor/constants";
import { useHaptic } from "../hooks/useHaptic";
import { useAppStore, type GoalInput } from "../store/useAppStore";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const PROGRESS_REACTION_DELAY_MS = 900;
const INITIAL_CREW_CHARACTERS = getAvailableCrewCharacters([]);

export function MainPage() {
  const haptic = useHaptic();
  const shouldReduceMotion = useReducedMotion() === true;
  const {
    goals,
    unlockedCharacters,
    totalCompletionCount,
    completedGoalRecords,
    toggleGoal,
    updateGoals,
    resetOnboarding,
  } = useAppStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedCrewIndex, setSelectedCrewIndex] = useState(0);
  const [crewMessage, setCrewMessage] = useState<string>(() =>
    pickRandom(INITIAL_CREW_CHARACTERS[0].messages.idle),
  );
  const [crewCheerKey, setCrewCheerKey] = useState(0);
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
        setCrewCheerKey((current) => current + 1);
      }
    },
    [
      availableCrewCharacters,
      goals,
      missionCrewCharacters,
      selectedCrewIndex,
      toggleGoal,
    ],
  );

  const handleResetOnboarding = () => {
    const confirmed = window.confirm(
      "지금까지의 목표와 응원단 기록을 모두 지우고 처음 설정 화면으로 돌아갈까요?",
    );
    if (!confirmed) return;

    haptic("success");
    resetOnboarding();
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

      <ProgressSection done={displayedDone} total={goals.length} />

      <CrewCheerBand
        characters={missionCrewCharacters}
        selectedIndex={selectedCrewIndex}
        cheerKey={crewCheerKey}
        onSelect={handleCrewSelect}
        message={crewMessage}
        shouldReduceMotion={shouldReduceMotion}
      />

      <div style={{ padding: "12px 20px 4px" }}>
        <Button
          type="button"
          display="full"
          size="large"
          color="primary"
          variant="fill"
          onClick={openDrawer}
          style={{
            width: "100%",
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          누적 달성 {totalCompletionCount}개 ·{" "}
          응원단 {unlockedCharacters.length}/{ALL_CREW_CHARACTERS.length}명
        </Button>
      </div>

      {displayedAllDone && (
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          style={{ padding: "20px" }}
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
              같은 목표를 다시 체크해도 괜찮아요.
              <br />
              내일이 되면 응원판이 새롭게 열립니다.
            </p>
          </div>
        </motion.div>
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
              <GoalItem goal={goal} onToggle={handleToggleGoal} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div style={{ padding: "0 20px 20px" }}>
        <Button
          type="button"
          display="full"
          size="large"
          variant="weak"
          onClick={() => setEditing(true)}
          style={{
            width: "100%",
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          목표 수정하기
        </Button>
        <Button
          type="button"
          display="full"
          size="large"
          variant="weak"
          color="danger"
          onClick={handleResetOnboarding}
          style={{
            width: "100%",
            borderRadius: 14,
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
    </div>
  );
}
