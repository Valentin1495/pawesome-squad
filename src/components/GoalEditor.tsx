import { motion, useReducedMotion } from "framer-motion";
import { colors } from "@toss/tds-colors";
import {
  Badge,
  Button,
  IconButton,
  SegmentedControl,
  Text,
} from "@toss/tds-mobile";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RECOMMENDED_GOALS,
  useAppStore,
  type GoalInput,
} from "../store/useAppStore";
import { CTAEffects } from "./goal-editor/CTAEffects";
import { ConfettiBurst } from "./goal-editor/ConfettiBurst";
import { CountdownOverlay } from "./goal-editor/CountdownOverlay";
import { CustomGoalCard } from "./goal-editor/CustomGoalCard";
import {
  FlowTrail,
  type FlowRect,
  type PendingVisualGoal,
} from "./goal-editor/FlowTrail";
import { GoalBoard } from "./goal-editor/GoalBoard";
import { GoalStage, type VisualCrewSlot } from "./goal-editor/GoalStage";
import { RecommendedGoalGrid } from "./goal-editor/RecommendedGoalGrid";
import { StarTrail, type StarTrailParticle } from "./goal-editor/StarTrail";
import {
  ADD_PHASE_DURATIONS,
  CREW_COLORS,
  CREW_EMOJIS,
  EMOJI_OPTIONS,
  getAvailableCrewCharacters,
  getAvailableCrewEmojis,
  LAUNCH_FEEDBACK_DELAY_MS,
  MAX_GOALS,
  MAX_GOAL_TEXT_LENGTH,
  MIN_GOALS,
  withAlpha,
  type AddPhase,
  type LaunchPhase,
  type CrewCharacter,
} from "./goal-editor/constants";
import {
  createLocalGoal,
  hasDuplicateText,
  normalizeKey,
  normalizeText,
  type LocalGoalInput,
} from "./goal-editor/utils";

interface GoalEditorProps {
  initialGoals?: GoalInput[];
  title: string;
  subtitle: string;
  submitLabel: string;
  onSubmit: (goals: GoalInput[]) => void;
  onCancel?: () => void;
  mode?: "onboarding" | "edit";
  submitDelayMs?: number;
}

type GoalCreationMode = "recommended" | "custom";

const CARD_EXIT_END = ADD_PHASE_DURATIONS.CARD_EXIT;
const GOAL_LANDED_FEEDBACK_END = 2000;
const BUBBLE_UPDATE_END = 1120;
const SHOW_DEV_GOAL_FILL = import.meta.env.DEV;
const LAUNCH_MISSION_PACKING_END = 1200;
const LAUNCH_LAYOUT_SETTLE_MS = 1000;
const LAUNCH_CREW_SHAKE_MS = 600;
const LAUNCH_COUNTDOWN_MS = 2650;
const LAUNCH_CREW_LAUNCH_MS = 500;
const LAUNCH_DONE_HOLD_MS = 250;
const STAR_TRAIL_EMOJIS = ["⭐", "✨", "💫", "🌟", "⚡"];
const ALL_FALLBACK_CREW_CHARACTERS: CrewCharacter[] = CREW_EMOJIS.map(
  (emoji, index) => ({
    id: `fallback-${index}`,
    emoji,
    name: "",
    role: "",
    requiredCount: 0,
    bgColor: CREW_COLORS[index % CREW_COLORS.length],
    messages: {
      idle: [""],
      onGoalAdd: [""],
      onReady: [""],
      onLaunch: "",
      onGoalCheck: [""],
      onAllDone: "",
    },
  }),
);

function getCrewCharacterForGoal(
  goal: Pick<GoalInput, "crewId">,
  fallbackIndex: number,
  crewCharacters: CrewCharacter[],
) {
  const fallbackCharacters =
    crewCharacters.length > 0 ? crewCharacters : ALL_FALLBACK_CREW_CHARACTERS;

  return (
    fallbackCharacters.find((character) => character.id === goal.crewId) ??
    fallbackCharacters[fallbackIndex % fallbackCharacters.length]
  );
}

function createCrewSlots(
  goals: LocalGoalInput[],
  crewCharacters: CrewCharacter[],
): VisualCrewSlot[] {
  const fallbackCharacters =
    crewCharacters.length > 0 ? crewCharacters : ALL_FALLBACK_CREW_CHARACTERS;

  return goals.slice(0, MAX_GOALS).map((goal, index) => {
    const crewCharacter = getCrewCharacterForGoal(
      goal,
      index,
      fallbackCharacters,
    );
    const crewIndex = Math.max(
      fallbackCharacters.findIndex(
        (character) => character.id === crewCharacter.id,
      ),
      0,
    );

    return {
      clientId: goal._clientId,
      emoji: crewCharacter.emoji,
      crewIndex,
      slotIndex: index,
      status: "settled",
    };
  });
}

function getNextOpenSlotIndex(crewSlots: VisualCrewSlot[]) {
  const occupiedSlotIndexes = new Set(crewSlots.map((slot) => slot.slotIndex));
  const openSlotIndex = Array.from(
    { length: MAX_GOALS },
    (_, index) => index,
  ).find((index) => !occupiedSlotIndexes.has(index));
  return openSlotIndex ?? Math.min(crewSlots.length, MAX_GOALS - 1);
}

function toGoalCreationMode(input: unknown): GoalCreationMode {
  if (input === "recommended" || input === "custom") {
    return input;
  }
  if (
    typeof input === "object" &&
    input != null &&
    "target" in input &&
    typeof (input as { target?: { value?: unknown } }).target?.value ===
      "string"
  ) {
    const value = (input as { target: { value: string } }).target.value;
    if (value === "recommended" || value === "custom") {
      return value;
    }
  }
  return "recommended";
}

export function GoalEditor({
  initialGoals = [],
  title,
  subtitle,
  submitLabel,
  onSubmit,
  onCancel,
  mode = "onboarding",
  submitDelayMs = LAUNCH_FEEDBACK_DELAY_MS,
}: GoalEditorProps) {
  const isOnboarding = mode === "onboarding";
  const shouldReduceMotion = useReducedMotion() === true;
  const unlockedCharacters = useAppStore((state) => state.unlockedCharacters);
  const availableCrewCharacters = useMemo(
    () => getAvailableCrewCharacters(unlockedCharacters),
    [unlockedCharacters],
  );
  const availableCrewEmojis = useMemo(
    () => getAvailableCrewEmojis(unlockedCharacters),
    [unlockedCharacters],
  );
  const initialGoalsSignature = useMemo(
    () =>
      initialGoals
        .map(
          (goal) => `${goal.id ?? ""}:${normalizeKey(goal.text)}:${goal.emoji}`,
        )
        .join("|"),
    [initialGoals],
  );
  const initialLocalGoals = useMemo(
    () =>
      initialGoals.map((goal, index) =>
        createLocalGoal({
          ...goal,
          crewId:
            goal.crewId ??
            getCrewCharacterForGoal(goal, index, availableCrewCharacters).id,
        }),
      ),
    [availableCrewCharacters, initialGoalsSignature],
  );

  const [goals, setGoals] = useState<LocalGoalInput[]>(() => initialLocalGoals);
  const [visualCrewSlots, setVisualCrewSlots] = useState<VisualCrewSlot[]>(() =>
    createCrewSlots(initialLocalGoals, availableCrewCharacters),
  );
  const [creationMode, setCreationMode] = useState<GoalCreationMode>(
    isOnboarding ? "recommended" : "custom",
  );
  const [selectedNextCrewId, setSelectedNextCrewId] = useState<
    string | undefined
  >(() => availableCrewCharacters[0]?.id);
  const [customText, setCustomText] = useState("");
  const [customEmoji, setCustomEmoji] = useState(EMOJI_OPTIONS[0]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchPhase, setLaunchPhase] = useState<LaunchPhase>("idle");
  const [starTrailParticles, setStarTrailParticles] = useState<
    StarTrailParticle[]
  >([]);
  const [crewJumpKey, setCrewJumpKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [stageReadyPreview, setStageReadyPreview] = useState(false);
  const [ctaHintKey, setCtaHintKey] = useState(0);
  const [addPhase, setAddPhase] = useState<AddPhase>("idle");
  const [launchingCardKey, setLaunchingCardKey] = useState<string | null>(null);
  const [landedClientId, setLandedClientId] = useState<string | null>(null);
  const [enteringCrewIndex, setEnteringCrewIndex] = useState<number | null>(
    null,
  );
  const [pendingVisualGoal, setPendingVisualGoal] =
    useState<PendingVisualGoal | null>(null);
  const [stageRect, setStageRect] = useState<FlowRect | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const pendingGoalRef = useRef<LocalGoalInput | null>(null);
  const pendingAddMetaRef = useRef<{
    nextCrewIndex: number;
    assignedCrewIndex: number;
    nextGoalCount: number;
    source: GoalCreationMode;
  } | null>(null);
  const addPhaseRef = useRef<AddPhase>("idle");
  const chainTimersRef = useRef<number[]>([]);
  const launchTimersRef = useRef<number[]>([]);
  const wasSubmittableRef = useRef(false);
  const hasShownConfettiRef = useRef(false);
  const previousGoalCountRef = useRef(goals.length);

  const trimmedCustomText = normalizeText(customText).slice(
    0,
    MAX_GOAL_TEXT_LENGTH,
  );
  const isChainActive = addPhase !== "idle";
  const isLaunchActive = launchPhase !== "idle";
  const shouldShowLaunchVisuals =
    isLaunchActive &&
    launchPhase !== "mission-pack" &&
    launchPhase !== "layout-settle" &&
    launchPhase !== "done";
  const isFull = goals.length >= MAX_GOALS || isChainActive;
  const isDuplicateCustom =
    trimmedCustomText.length > 0 &&
    goals.some(
      (goal) => normalizeKey(goal.text) === normalizeKey(trimmedCustomText),
    );
  const canAddCustom =
    trimmedCustomText.length > 0 && !isDuplicateCustom && !isFull;
  const needsMoreGoals =
    isOnboarding && goals.length > 0 && goals.length < MIN_GOALS;
  const canSubmit =
    !isChainActive &&
    goals.length >= MIN_GOALS &&
    goals.length <= MAX_GOALS &&
    goals.every((goal) => normalizeText(goal.text).length > 0) &&
    !hasDuplicateText(goals);
  const remainingGoals = Math.max(MIN_GOALS - goals.length, 0);
  const briefingMessage = canSubmit
    ? "미션이 준비됐어요. 크루가 바로 출동할 수 있어요."
    : remainingGoals > 0
      ? `목표 ${remainingGoals}개만 더 정하면 크루가 출동해요.`
      : "미션을 확인하고 출동을 준비해요.";
  const goalProgress = Math.min(goals.length / MIN_GOALS, 1);
  const nextCrewIndex = getNextOpenSlotIndex(visualCrewSlots);
  const selectedNextCrewIndex = Math.max(
    availableCrewCharacters.findIndex(
      (character) => character.id === selectedNextCrewId,
    ),
    0,
  );
  const selectedNextCrew =
    availableCrewCharacters[selectedNextCrewIndex] ??
    availableCrewCharacters[0] ??
    ALL_FALLBACK_CREW_CHARACTERS[0];
  const nextCrewEmoji =
    selectedNextCrew?.emoji ??
    availableCrewEmojis[nextCrewIndex % availableCrewEmojis.length];
  const nextCrewColor =
    selectedNextCrew?.bgColor ??
    CREW_COLORS[selectedNextCrewIndex % CREW_COLORS.length];

  const toFlowRect = (rect: DOMRect): FlowRect => ({
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  });

  const measureFlowTargets = useCallback(() => {
    if (stageRef.current != null) {
      setStageRect(toFlowRect(stageRef.current.getBoundingClientRect()));
    }
  }, []);

  const clearChainTimers = useCallback(() => {
    chainTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    chainTimersRef.current = [];
  }, []);

  const clearLaunchTimers = useCallback(() => {
    launchTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    launchTimersRef.current = [];
  }, []);

  const resetAddChain = useCallback(() => {
    clearChainTimers();
    pendingGoalRef.current = null;
    pendingAddMetaRef.current = null;
    setAddPhase("idle");
    setLaunchingCardKey(null);
    setLandedClientId(null);
    setEnteringCrewIndex(null);
    setPendingVisualGoal(null);
    setStageReadyPreview(false);
  }, [clearChainTimers]);

  useEffect(() => {
    addPhaseRef.current = addPhase;
  }, [addPhase]);

  useEffect(() => {
    measureFlowTargets();
    window.addEventListener("resize", measureFlowTargets);
    return () => window.removeEventListener("resize", measureFlowTargets);
  }, [measureFlowTargets]);

  useEffect(() => {
    resetAddChain();
    clearLaunchTimers();
    setIsLaunching(false);
    setLaunchPhase("idle");
    setStarTrailParticles([]);
    setGoals(initialLocalGoals);
    setVisualCrewSlots(
      createCrewSlots(initialLocalGoals, availableCrewCharacters),
    );
    setCreationMode(isOnboarding ? "recommended" : "custom");
    previousGoalCountRef.current = initialGoals.length;
  }, [
    clearLaunchTimers,
    availableCrewCharacters,
    initialGoals.length,
    initialLocalGoals,
    isOnboarding,
    resetAddChain,
  ]);

  useEffect(() => {
    if (
      selectedNextCrewId != null &&
      availableCrewCharacters.some(
        (character) => character.id === selectedNextCrewId,
      )
    ) {
      return;
    }

    setSelectedNextCrewId(availableCrewCharacters[0]?.id);
  }, [availableCrewCharacters, selectedNextCrewId]);

  useEffect(() => {
    return () => {
      clearChainTimers();
      clearLaunchTimers();
    };
  }, [clearChainTimers, clearLaunchTimers]);

  useEffect(() => {
    if (launchPhase !== "crew-launch" || shouldReduceMotion) return;

    const launchSlots = Array.from(
      document.querySelectorAll<HTMLElement>('[data-crew-launch-slot="true"]'),
    );
    const nextParticles = launchSlots.flatMap((slot, slotIndex) => {
      const rect = slot.getBoundingClientRect();
      const particleCount = 10 + Math.floor(Math.random() * 3);
      return Array.from({ length: particleCount }, (_, particleIndex) => {
        const direction = Math.random() < 0.5 ? -1 : 1;
        return {
          id: `${Date.now()}-${slotIndex}-${particleIndex}`,
          emoji:
            STAR_TRAIL_EMOJIS[
              Math.floor(Math.random() * STAR_TRAIL_EMOJIS.length)
            ],
          left: rect.left + rect.width / 2,
          top: rect.top + rect.height / 2,
          x: direction * (18 + Math.random() * 42),
          y: -48 - Math.random() * 42,
          rotate: direction * (80 + Math.random() * 180),
          delay: particleIndex * 0.015,
        };
      });
    });

    setStarTrailParticles(nextParticles);
    const timeoutId = window.setTimeout(() => setStarTrailParticles([]), 700);
    return () => window.clearTimeout(timeoutId);
  }, [launchPhase, shouldReduceMotion]);

  useEffect(() => {
    if (isOnboarding && canSubmit && !wasSubmittableRef.current) {
      setCrewJumpKey((current) => current + 1);
      if (!hasShownConfettiRef.current && !shouldReduceMotion) {
        setShowConfetti(true);
        hasShownConfettiRef.current = true;
      }
    }
    wasSubmittableRef.current = canSubmit;
  }, [canSubmit, isOnboarding, shouldReduceMotion]);

  useEffect(() => {
    if (!showConfetti) return;

    const timeoutId = window.setTimeout(() => setShowConfetti(false), 500);
    return () => window.clearTimeout(timeoutId);
  }, [showConfetti]);

  useEffect(() => {
    if (!stageReadyPreview) return;

    const timeoutId = window.setTimeout(() => setStageReadyPreview(false), 420);
    return () => window.clearTimeout(timeoutId);
  }, [stageReadyPreview]);

  useEffect(() => {
    if (
      isOnboarding &&
      goals.length > previousGoalCountRef.current &&
      goals.length > 0 &&
      goals.length < MIN_GOALS &&
      !isLaunching
    ) {
      setCtaHintKey((current) => current + 1);
    }
    previousGoalCountRef.current = goals.length;
  }, [goals.length, isLaunching, isOnboarding]);

  useEffect(() => {
    if (landedClientId == null) return;

    const timeoutId = window.setTimeout(
      () => setLandedClientId(null),
      GOAL_LANDED_FEEDBACK_END,
    );
    return () => window.clearTimeout(timeoutId);
  }, [landedClientId]);

  useEffect(() => {
    if (!isChainActive || shouldReduceMotion) return;

    measureFlowTargets();
    if (addPhase === "crew-enter" || addPhase === "aim") {
      stageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [addPhase, isChainActive, measureFlowTargets, shouldReduceMotion]);

  const availableRecommendations = useMemo(
    () =>
      RECOMMENDED_GOALS.filter(
        (recommended) =>
          !goals.some(
            (goal) =>
              normalizeKey(goal.text) === normalizeKey(recommended.text),
          ),
      ),
    [goals],
  );

  const fillDevGoals = () => {
    if (
      !SHOW_DEV_GOAL_FILL ||
      isLaunching ||
      isChainActive ||
      goals.length >= MIN_GOALS
    )
      return;

    const existingGoalKeys = new Set(
      goals.map((goal) => normalizeKey(goal.text)),
    );
    const goalsToAdd = RECOMMENDED_GOALS.filter(
      (recommended) => !existingGoalKeys.has(normalizeKey(recommended.text)),
    )
      .slice(0, Math.min(MIN_GOALS - goals.length, MAX_GOALS - goals.length))
      .map((goal, index) =>
        createLocalGoal({
          ...goal,
          crewId:
            availableCrewCharacters[
              (goals.length + index) % availableCrewCharacters.length
            ]?.id,
        }),
      );

    if (goalsToAdd.length === 0) return;

    resetAddChain();
    const nextGoals = [...goals, ...goalsToAdd];
    setGoals(nextGoals);
    setVisualCrewSlots(createCrewSlots(nextGoals, availableCrewCharacters));
  };

  const continueToCrewEnter = useCallback(() => {
    const pendingMeta = pendingAddMetaRef.current;
    const pendingGoal = pendingGoalRef.current;
    if (
      pendingMeta == null ||
      pendingGoal == null ||
      addPhaseRef.current !== "card-exit"
    )
      return;

    addPhaseRef.current = "crew-enter";
    setLaunchingCardKey(null);
    setEnteringCrewIndex(pendingMeta.nextCrewIndex);
    setVisualCrewSlots((current) => [
      ...current.filter((slot) => slot.clientId !== pendingGoal._clientId),
      {
        clientId: pendingGoal._clientId,
        emoji: getCrewCharacterForGoal(
          pendingGoal,
          pendingMeta.assignedCrewIndex,
          availableCrewCharacters,
        ).emoji,
        crewIndex: pendingMeta.assignedCrewIndex,
        slotIndex: pendingMeta.nextCrewIndex,
        status: "entering",
      },
    ]);
    if (pendingMeta.source === "custom") {
      setCustomText("");
    }
    setAddPhase("crew-enter");

    chainTimersRef.current.push(
      window.setTimeout(() => {
        const goalToLand = pendingGoalRef.current;
        if (goalToLand == null) return;
        const shouldPreviewReady =
          isOnboarding &&
          pendingMeta.nextGoalCount >= MIN_GOALS &&
          pendingMeta.nextGoalCount - 1 < MIN_GOALS;

        setVisualCrewSlots((current) =>
          current.map((slot) =>
            slot.clientId === goalToLand._clientId
              ? { ...slot, status: "settled" }
              : slot,
          ),
        );

        if (shouldPreviewReady && !shouldReduceMotion) {
          setStageReadyPreview(true);
          setCrewJumpKey((current) => current + 1);
          if (!hasShownConfettiRef.current) {
            setShowConfetti(true);
            hasShownConfettiRef.current = true;
          }
          wasSubmittableRef.current = true;
          chainTimersRef.current.push(
            window.setTimeout(() => setAddPhase("aim"), 620),
          );
          return;
        }

        setAddPhase("aim");
      }, ADD_PHASE_DURATIONS.CREW_ENTER),
    );
  }, [availableCrewCharacters, isOnboarding, shouldReduceMotion]);

  const continueToGoalLand = useCallback(() => {
    if (addPhaseRef.current !== "aim") return;
    const pendingMeta = pendingAddMetaRef.current;
    const latestGoalToLand = pendingGoalRef.current;
    if (pendingMeta == null || latestGoalToLand == null) return;

    setAddPhase("goal-land");
    setGoals((current) => {
      if (
        current.length >= MAX_GOALS ||
        current.some(
          (item) =>
            normalizeKey(item.text) === normalizeKey(latestGoalToLand.text),
        )
      ) {
        return current;
      }
      return [...current, latestGoalToLand];
    });
    setLandedClientId(latestGoalToLand._clientId);

    chainTimersRef.current.push(
      window.setTimeout(() => {
        const goalToCelebrate = pendingGoalRef.current;
        if (goalToCelebrate == null) return;
        setAddPhase("celebrate");
      }, ADD_PHASE_DURATIONS.GOAL_LAND),
    );

    chainTimersRef.current.push(
      window.setTimeout(() => {
        pendingGoalRef.current = null;
        pendingAddMetaRef.current = null;
        setAddPhase("bubble-update");
        setLaunchingCardKey(null);
        setPendingVisualGoal(null);
        setStageReadyPreview(false);
      }, GOAL_LANDED_FEEDBACK_END),
    );

    chainTimersRef.current.push(
      window.setTimeout(() => {
        setAddPhase("idle");
        setLaunchingCardKey(null);
        setEnteringCrewIndex(null);
        setPendingVisualGoal(null);
        setStageReadyPreview(false);
      }, GOAL_LANDED_FEEDBACK_END + BUBBLE_UPDATE_END),
    );
  }, []);

  const addGoal = useCallback(
    (
      goal: GoalInput,
      source: GoalCreationMode = creationMode,
      sourceElement: HTMLElement | null = null,
      emojiElement: HTMLElement | null = null,
    ) => {
      const text = normalizeText(goal.text).slice(0, MAX_GOAL_TEXT_LENGTH);
      if (
        text.length === 0 ||
        goals.some((item) => normalizeKey(item.text) === normalizeKey(text)) ||
        goals.length >= MAX_GOALS ||
        isChainActive ||
        addPhaseRef.current !== "idle"
      ) {
        return;
      }

      clearChainTimers();
      addPhaseRef.current = "card-exit";
      pendingAddMetaRef.current = null;
      measureFlowTargets();
      const fallbackRect = sourceElement?.getBoundingClientRect() ?? {
        left: window.innerWidth / 2 - 80,
        top: window.innerHeight * 0.3,
        width: 160,
        height: 48,
      };
      const fallbackEmojiRect = emojiElement?.getBoundingClientRect() ??
        sourceElement?.getBoundingClientRect() ?? {
          left: window.innerWidth / 2 - 14,
          top: window.innerHeight * 0.3,
          width: 28,
          height: 28,
        };
      const nextGoalCount = goals.length + 1;
      const nextSlotIndex = getNextOpenSlotIndex(visualCrewSlots);
      const assignedCrew =
        availableCrewCharacters[nextSlotIndex % availableCrewCharacters.length];
      const assignedCrewIndex = Math.max(
        availableCrewCharacters.findIndex(
          (character) => character.id === (goal.crewId ?? assignedCrew?.id),
        ),
        0,
      );
      const newGoal = createLocalGoal({
        ...goal,
        text,
        crewId: goal.crewId ?? assignedCrew?.id,
      });
      pendingGoalRef.current = newGoal;
      setPendingVisualGoal({
        emojiRect: toFlowRect(fallbackEmojiRect as DOMRect),
        emoji: goal.emoji,
        text,
        targetCrewIndex: nextSlotIndex,
        sourceRect: toFlowRect(fallbackRect as DOMRect),
        crewEmoji: getCrewCharacterForGoal(
          newGoal,
          assignedCrewIndex,
          availableCrewCharacters,
        ).emoji,
        crewColor: CREW_COLORS[assignedCrewIndex % CREW_COLORS.length],
      });
      pendingAddMetaRef.current = {
        nextCrewIndex: nextSlotIndex,
        assignedCrewIndex,
        nextGoalCount,
        source,
      };

      setAddPhase("card-exit");
      setLaunchingCardKey(source === "recommended" ? normalizeKey(text) : null);
      setLandedClientId(null);
      setEnteringCrewIndex(null);

      chainTimersRef.current.push(
        window.setTimeout(() => {
          continueToCrewEnter();
        }, CARD_EXIT_END),
      );
    },
    [
      clearChainTimers,
      continueToCrewEnter,
      availableCrewCharacters,
      creationMode,
      goals,
      isChainActive,
      measureFlowTargets,
      visualCrewSlots,
    ],
  );

  const addCustomGoal = (
    sourceElement: HTMLElement | null = null,
    emojiElement: HTMLElement | null = null,
  ) => {
    if (!canAddCustom) return;
    addGoal(
      {
        text: trimmedCustomText,
        emoji: customEmoji,
        crewId: selectedNextCrew?.id,
      },
      "custom",
      sourceElement,
      emojiElement,
    );
  };

  const updateGoal = (index: number, patch: Partial<GoalInput>) => {
    setGoals((current) =>
      current.map((goal, goalIndex) =>
        goalIndex === index
          ? {
              ...goal,
              ...patch,
              text:
                patch.text == null
                  ? goal.text
                  : patch.text.slice(0, MAX_GOAL_TEXT_LENGTH),
              _clientId: goal._clientId,
            }
          : goal,
      ),
    );

    if (patch.crewId != null) {
      const nextCrewIndex = Math.max(
        availableCrewCharacters.findIndex(
          (character) => character.id === patch.crewId,
        ),
        0,
      );
      const nextCrewEmoji =
        availableCrewCharacters[nextCrewIndex]?.emoji ??
        availableCrewCharacters[0]?.emoji ??
        CREW_EMOJIS[0];

      setVisualCrewSlots((current) =>
        current.map((slot) =>
          slot.clientId === goals[index]?._clientId
            ? {
                ...slot,
                emoji: nextCrewEmoji,
                crewIndex: nextCrewIndex,
              }
            : slot,
        ),
      );
    }
  };

  const removeGoal = (index: number) => {
    if (isChainActive || isLaunching) return;

    setGoals((current) => {
      const goalToRemove = current[index];
      const nextGoals = current.filter((_, goalIndex) => goalIndex !== index);
      if (goalToRemove != null) {
        setVisualCrewSlots((currentSlots) =>
          currentSlots
            .filter((slot) => slot.clientId !== goalToRemove._clientId)
            .map((slot) => ({ ...slot, status: "settled" })),
        );
      }
      return nextGoals;
    });
  };

  const submit = () => {
    if (!canSubmit || isLaunching || isChainActive) return;

    const nextGoals = goals.map((goal) => ({
      id: goal.id,
      text: normalizeText(goal.text),
      emoji: goal.emoji,
      crewId: goal.crewId,
    }));
    if (!isOnboarding) {
      onSubmit(nextGoals);
      return;
    }

    if (shouldReduceMotion) {
      onSubmit(nextGoals);
      return;
    }

    clearLaunchTimers();
    setIsLaunching(true);
    setLaunchPhase("mission-pack");
    const layoutSettleStart = LAUNCH_MISSION_PACKING_END;
    const crewShakeStart = layoutSettleStart + LAUNCH_LAYOUT_SETTLE_MS;
    const countdownStart = crewShakeStart + LAUNCH_CREW_SHAKE_MS;
    const crewLaunchStart = countdownStart + LAUNCH_COUNTDOWN_MS;
    const doneStart = crewLaunchStart + LAUNCH_CREW_LAUNCH_MS;
    const submitStart = doneStart + LAUNCH_DONE_HOLD_MS;

    launchTimersRef.current.push(
      window.setTimeout(
        () => setLaunchPhase("layout-settle"),
        layoutSettleStart,
      ),
      window.setTimeout(() => setLaunchPhase("crew-shake"), crewShakeStart),
      window.setTimeout(() => setLaunchPhase("countdown"), countdownStart),
      window.setTimeout(() => setLaunchPhase("crew-launch"), crewLaunchStart),
      window.setTimeout(() => setLaunchPhase("done"), doneStart),
      window.setTimeout(
        () => onSubmit(nextGoals),
        Math.max(submitDelayMs, submitStart),
      ),
    );
  };

  const goalCreationSection = (
    <section>
      <SegmentedControl
        aria-label="목표 카드 추가 방식"
        value={creationMode}
        onChange={(value) => {
          if (isLaunching || isChainActive) return;
          const nextMode = toGoalCreationMode(value);
          setCreationMode((current) =>
            nextMode === "recommended" || nextMode === "custom"
              ? nextMode
              : current,
          );
        }}
        size="large"
        style={{
          marginBottom: 12,
          opacity: isLaunchActive ? 0.38 : isChainActive ? 0.5 : 1,
          pointerEvents: isLaunchActive || isChainActive ? "none" : "auto",
        }}
      >
        <SegmentedControl.Item
          value="recommended"
          onClick={() => setCreationMode("recommended")}
        >
          추천 목표
        </SegmentedControl.Item>
        <SegmentedControl.Item
          value="custom"
          onClick={() => setCreationMode("custom")}
        >
          직접 작성
        </SegmentedControl.Item>
      </SegmentedControl>

      <motion.div
        animate={{
          opacity: isLaunchActive ? 0.38 : isChainActive ? 0.5 : 1,
        }}
        style={{
          marginBottom: 12,
          pointerEvents: isLaunchActive || isChainActive ? "none" : "auto",
        }}
      >
        <Text
          typography="t6"
          fontWeight="bold"
          color={colors.grey800}
          display="block"
          style={{ margin: "0 0 8px" }}
        >
          다음 목표를 응원할 크루
        </Text>
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 2,
            scrollbarWidth: "none",
          }}
        >
          {availableCrewCharacters.map((character, index) => {
            const selected = character.id === selectedNextCrew?.id;
            const crewColor =
              character.bgColor ?? CREW_COLORS[index % CREW_COLORS.length];

            return (
              <button
                key={character.id}
                type="button"
                disabled={isLaunchActive || isChainActive}
                onClick={() => setSelectedNextCrewId(character.id)}
                style={{
                  flex: "0 0 auto",
                  minWidth: 74,
                  border: selected
                    ? `2px solid ${crewColor}`
                    : `1px solid ${withAlpha(colors.grey900, 0.1)}`,
                  borderRadius: 14,
                  backgroundColor: selected
                    ? withAlpha(crewColor, 0.12)
                    : colors.white,
                  color: selected ? crewColor : colors.grey700,
                  padding: "9px 10px",
                  boxShadow: selected
                    ? `0 0 0 4px ${withAlpha(crewColor, 0.08)}`
                    : "0 6px 14px rgba(0,27,55,0.04)",
                  cursor:
                    isLaunchActive || isChainActive ? "default" : "pointer",
                }}
                aria-pressed={selected}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: 24,
                    lineHeight: 1,
                    marginBottom: 5,
                  }}
                >
                  {character.emoji}
                </span>
                <Text
                  typography="t7"
                  fontWeight="bold"
                  color={selected ? crewColor : colors.grey700}
                  display="block"
                  style={{
                    maxWidth: 72,
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
      </motion.div>

      {SHOW_DEV_GOAL_FILL && (
        <Button
          type="button"
          size="small"
          variant="weak"
          disabled={isLaunching || isChainActive || goals.length >= MIN_GOALS}
          onClick={fillDevGoals}
          style={{
            width: "100%",
            marginBottom: 12,
            borderRadius: 12,
          }}
        >
          개발용: 목표 3개 채우기
        </Button>
      )}

      {creationMode === "custom" ? (
        <CustomGoalCard
          canAddCustom={canAddCustom}
          customEmoji={customEmoji}
          customText={customText}
          addPhase={addPhase}
          isDuplicateCustom={isDuplicateCustom}
          isChainActive={isChainActive}
          isCustomLaunching={
            addPhase === "card-exit" && launchingCardKey == null
          }
          isLaunching={isLaunching}
          onAddCustomGoal={addCustomGoal}
          setCustomEmoji={setCustomEmoji}
          setCustomText={setCustomText}
          trimmedCustomTextLength={trimmedCustomText.length}
          nextCrewEmoji={nextCrewEmoji}
          nextCrewColor={nextCrewColor}
        />
      ) : (
        <RecommendedGoalGrid
          availableRecommendations={availableRecommendations}
          goalsLength={goals.length}
          isFull={isFull}
          addPhase={addPhase}
          isChainActive={isChainActive}
          isLaunching={isLaunching}
          isOnboarding={isOnboarding}
          launchingCardKey={launchingCardKey}
          nextCrewEmoji={nextCrewEmoji}
          nextCrewColor={nextCrewColor}
          onAddGoal={(goal, sourceElement, emojiElement) =>
            addGoal(
              { ...goal, crewId: selectedNextCrew?.id },
              "recommended",
              sourceElement,
              emojiElement,
            )
          }
        />
      )}
    </section>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: colors.grey50,
        padding: "28px 20px 64px",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <ConfettiBurst
        burstKey={crewJumpKey}
        show={isOnboarding && showConfetti}
        shouldReduceMotion={shouldReduceMotion}
      />
      <CountdownOverlay
        isActive={launchPhase === "countdown"}
        shouldReduceMotion={shouldReduceMotion}
      />
      <StarTrail
        particles={starTrailParticles}
        shouldReduceMotion={shouldReduceMotion}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      >
        <div
          style={{ display: "flex", justifyContent: "space-between", gap: 16 }}
        >
          <div>
            <Text
              typography="t7"
              fontWeight="bold"
              color={colors.purple500}
              display="block"
              style={{ margin: "0 0 8px" }}
            >
              {isOnboarding ? "미션 브리핑" : "미션 재정비"}
            </Text>
            <Text
              typography="t2"
              fontWeight="bold"
              color={colors.grey900}
              display="block"
              style={{ margin: 0, lineHeight: 1.25 }}
            >
              {title}
            </Text>
          </div>
          {onCancel != null && (
            <IconButton
              type="button"
              name="close"
              aria-label="닫기"
              variant="clear"
              color={colors.grey600}
              iconSize={24}
              onClick={onCancel}
              style={{
                flex: "0 0 auto",
              }}
            />
          )}
        </div>
        <Text
          typography="t6"
          color={colors.grey600}
          display="block"
          style={{ margin: "12px 0 20px", lineHeight: 1.55 }}
        >
          {subtitle}
        </Text>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: isLaunching ? 0.52 : 1,
            y: 0,
            borderColor: canSubmit
              ? withAlpha(colors.purple500, 0.34)
              : withAlpha(colors.grey900, 0.08),
          }}
          transition={{ delay: 0.08, duration: 0.2 }}
          style={{
            border: `1px solid ${withAlpha(colors.grey900, 0.08)}`,
            borderRadius: 18,
            backgroundColor: colors.white,
            boxShadow: "0 10px 24px rgba(0,27,55,0.06)",
            padding: "14px 14px 13px",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 10,
            }}
          >
            <Text typography="t6" fontWeight="bold" color={colors.grey800}>
              오늘의 목표 진행도
            </Text>
            <Badge size="small" color="blue" variant="weak">
              {goals.length}/{MIN_GOALS} 준비
            </Badge>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              backgroundColor: colors.grey100,
              overflow: "hidden",
              marginBottom: 9,
            }}
          >
            <motion.div
              animate={{ width: `${goalProgress * 100}%` }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              style={{
                height: "100%",
                borderRadius: 999,
                background: `linear-gradient(90deg, ${colors.blue400}, ${colors.purple500})`,
              }}
            />
          </div>
          <Text
            typography="t7"
            color={canSubmit ? colors.purple700 : colors.grey600}
          >
            {briefingMessage}
          </Text>
        </motion.div>
      </motion.div>

      {goalCreationSection}

      <FlowTrail
        addPhase={addPhase}
        enteringCrewIndex={
          pendingAddMetaRef.current?.nextCrewIndex ?? enteringCrewIndex
        }
        onEmojiArrive={continueToCrewEnter}
        onCardArrive={continueToGoalLand}
        pendingVisualGoal={pendingVisualGoal}
        shouldReduceMotion={shouldReduceMotion}
        stageRect={stageRect}
      />

      <motion.div
        animate={
          shouldShowLaunchVisuals ? { y: -18, scale: 1.04 } : { y: 0, scale: 1 }
        }
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        style={{
          position: "relative",
          isolation: "isolate",
          zIndex: shouldShowLaunchVisuals ? 3 : 1,
        }}
      >
        {shouldShowLaunchVisuals && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: "-26px -16px -12px",
              zIndex: 0,
              borderRadius: 28,
              background: `radial-gradient(circle at 50% 44%, ${withAlpha(
                colors.purple500,
                0.28,
              )}, transparent 72%)`,
              boxShadow: `0 28px 64px ${withAlpha(colors.purple500, 0.2)}`,
              pointerEvents: "none",
            }}
          />
        )}
        <GoalStage
          ref={stageRef}
          canSubmit={canSubmit}
          addPhase={addPhase}
          crewSlots={visualCrewSlots}
          enteringCrewIndex={enteringCrewIndex}
          isCompletionPreview={stageReadyPreview}
          isChainActive={isChainActive}
          isLaunching={shouldShowLaunchVisuals}
          launchPhase={launchPhase}
          shouldReduceMotion={shouldReduceMotion}
          activeMission={pendingVisualGoal}
        />
      </motion.div>

      <GoalBoard
        availableCrewCharacters={availableCrewCharacters}
        creationMode={creationMode}
        goals={goals}
        crewSlots={visualCrewSlots}
        isBoardLocked={isChainActive || isLaunchActive}
        isFlowActive={addPhase === "goal-land" || addPhase === "celebrate"}
        isImpacting={addPhase === "goal-land"}
        landedClientId={landedClientId}
        isLaunching={isLaunching}
        launchPhase={launchPhase}
        isOnboarding={isOnboarding}
        onRemoveGoal={removeGoal}
        onUpdateGoal={updateGoal}
      />

      <CTAEffects
        canSubmit={canSubmit}
        crewJumpKey={crewJumpKey}
        ctaHintKey={ctaHintKey}
        isLaunching={isLaunching}
        launchPhase={launchPhase}
        isOnboarding={isOnboarding}
        needsMoreGoals={needsMoreGoals}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 480,
          margin: "24px auto 0",
          boxSizing: "border-box",
          minHeight: 56,
        }}
      >
        {launchPhase === "idle" && (
          <Button
            type="button"
            disabled={!canSubmit || isLaunching}
            onClick={submit}
            display="full"
            size="large"
            variant="fill"
            style={{
              width: "100%",
              overflow: "hidden",
              borderRadius: 999,
              boxShadow:
                canSubmit && !isLaunching
                  ? "0 12px 26px rgba(49,130,246,0.24)"
                  : "0 8px 18px rgba(0,27,55,0.1)",
              boxSizing: "border-box",
            }}
          >
            {`${submitLabel}`}
          </Button>
        )}
      </div>
    </div>
  );
}
