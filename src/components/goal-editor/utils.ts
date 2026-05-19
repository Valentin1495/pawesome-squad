import type { GoalInput } from "../../store/useAppStore";
import { CHEER_LINES, MAX_GOAL_TEXT_LENGTH, MIN_GOALS, type ConfettiCorner } from "./constants";

export type LocalGoalInput = GoalInput & { _clientId: string };

let localGoalIdSequence = 0;

export function normalizeText(text: string) {
  return text.trim().replace(/\s+/g, " ");
}

export function normalizeKey(text: string) {
  return normalizeText(text).toLocaleLowerCase("ko-KR");
}

export function createLocalGoal(goal: GoalInput): LocalGoalInput {
  localGoalIdSequence += 1;
  return {
    ...goal,
    text: normalizeText(goal.text).slice(0, MAX_GOAL_TEXT_LENGTH),
    _clientId: goal.id ?? `local-goal-${Date.now()}-${localGoalIdSequence}`,
  };
}

export function hasDuplicateText(goals: GoalInput[]) {
  const normalized = goals.map((goal) => normalizeKey(goal.text));
  return new Set(normalized).size !== normalized.length;
}

export function getRandomCheerLine(goalText: string, count: number) {
  if (count >= MIN_GOALS) return "응원단 출동 준비 완료!";
  const index = Math.abs(goalText.length + count) % CHEER_LINES.length;
  return CHEER_LINES[index];
}

export function getConfettiPosition(corner: ConfettiCorner) {
  switch (corner) {
    case "top-left":
      return { left: "42%", top: "40%" };
    case "top-right":
      return { left: "58%", top: "40%" };
    case "bottom-left":
      return { left: "44%", top: "54%" };
    default:
      return { left: "56%", top: "54%" };
  }
}

type CrewDialoguePhase = "waiting" | "settled" | "ready" | "launching";
type CrewProgressDialoguePhase = Exclude<CrewDialoguePhase, "waiting">;

const FIRST_GOAL_WAITING_LINE = "첫 목표 카드, 크루가 받아볼게요!";

const CREW_DIALOGUES: Array<Record<CrewProgressDialoguePhase, string>> = [
  {
    settled: "접수 완료! 다음 크루가 준비해요",
    ready: "",
    launching: "",
  },
  {
    settled: "기록 완료! 흐름이 좋아요",
    ready: "",
    launching: "",
  },
  {
    settled: "",
    ready: "이 정도면 오늘 분위기 최고예요!",
    launching: "응원단 출동!",
  },
  {
    settled: "",
    ready: "몸이 근질근질해요!",
    launching: "출발합니다!",
  },
  {
    settled: "",
    ready: "크루 준비 완료!",
    launching: "오늘의 미션, 가동합니다!",
  },
];

function getCrewDialogueIndex(crewIndex: number) {
  return Math.abs(crewIndex) % CREW_DIALOGUES.length;
}

export function getCrewStageLine(crewIndex: number, phase: CrewDialoguePhase): string {
  if (phase === "waiting") return FIRST_GOAL_WAITING_LINE;
  return CREW_DIALOGUES[getCrewDialogueIndex(crewIndex)][phase];
}
