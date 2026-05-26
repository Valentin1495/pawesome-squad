import { Storage } from "@apps-in-toss/web-framework";
import { create } from "zustand";
import {
  ALL_CREW_CHARACTERS,
  DEFAULT_CREW_IDS,
  SHARE_REWARD_CHARACTER_ID,
} from "../components/goal-editor/constants";

export interface Goal {
  id: string;
  text: string;
  emoji: string;
  crewId?: string;
  done: boolean;
  createdAt: string;
}

export interface GoalInput {
  id?: string;
  text: string;
  emoji: string;
  crewId?: string;
}

export interface Character {
  id: string;
  emoji: string;
  name: string;
  unlockedAt: string;
  requiredCount: number;
}

export interface CompletedGoalRecord {
  key: string;
  text: string;
  emoji: string;
  count: number;
  lastCompletedAt: string;
}

export const ALL_CHARACTERS: Character[] = ALL_CREW_CHARACTERS.map(
  (character) => ({
    id: character.id,
    emoji: character.emoji,
    name: character.name,
    unlockedAt: "",
    requiredCount: character.requiredCount,
  }),
);

const DEFAULT_UNLOCKED_CHARACTERS: Character[] = ALL_CHARACTERS.filter(
  (character) => (DEFAULT_CREW_IDS as readonly string[]).includes(character.id),
).map((character) => ({ ...character, unlockedAt: "default" }));

const LEGACY_CHARACTER_ID_MAP: Record<string, string> = {
  cat: "nabi",
  rabbit: "dalto",
  fox: "yeowoobi",
  panda: "podo",
  unicorn: "uni",
  choco: SHARE_REWARD_CHARACTER_ID,
};

export const RECOMMENDED_GOALS: GoalInput[] = [
  { text: "물 마시기", emoji: "💧" },
  { text: "산책하기", emoji: "🚶" },
  { text: "책 읽기", emoji: "📚" },
  { text: "스트레칭", emoji: "🧘" },
  { text: "햇빛 쬐기", emoji: "☀️" },
];

const STORAGE_KEY = "pawesome-squad-state";
const DAILY_SHARE_REWARD_SNACKS = 5;

export type ShareRewardClaimResult =
  | {
      type: "character-unlocked";
      character: Character;
      earnedSnacks: number;
      snackCount: number;
      streakDays: number;
    }
  | {
      type: "snacks-earned";
      character: Character;
      earnedSnacks: number;
      snackCount: number;
      streakDays: number;
    }
  | {
      type: "already-recorded";
      character: Character;
      snackCount: number;
      streakDays: number;
    }
  | {
      type: "unavailable";
      snackCount: number;
      streakDays: number;
    };

interface PersistedState {
  goals: Goal[];
  unlockedCharacters: Character[];
  totalCompletionCount: number;
  dailyCompletedGoalIds: string[];
  completedMissionDates: string[];
  completedGoalRecords: CompletedGoalRecord[];
  shareRewardSnackCount: number;
  shareRewardDates: string[];
  lastResetDate: string;
  hasOnboarded: boolean;
}

type LegacyPersistedState = Partial<PersistedState> & {
  goals?: Array<Partial<Goal>>;
  lastShareRewardDate?: string | null;
};

interface AppState extends PersistedState {
  isLoaded: boolean;
  showCelebration: boolean;
  newCharacter: Character | null;
  toggleGoal: (id: string) => void;
  resetGoals: () => void;
  loadFromStorage: () => Promise<void>;
  completeOnboarding: (goals: GoalInput[]) => void;
  saveGoals: (goals: GoalInput[]) => void;
  updateGoals: (goals: GoalInput[]) => void;
  startNewMission: () => void;
  resetOnboarding: () => void;
  claimShareReward: (earnedSnacks?: number) => ShareRewardClaimResult;
  spendShareRewardSnacks: (amount: number) => boolean;
  setShowCelebration: (show: boolean) => void;
  clearNewCharacter: () => void;
}

function createGoalId(): string {
  return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayString(): string {
  return getDateString(new Date());
}

function normalizeCompletedMissionDates(dates: string[] = []): string[] {
  return Array.from(
    new Set(dates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))),
  ).sort();
}

function normalizeShareRewardDates(
  dates: string[] = [],
  legacyDate?: string | null,
): string[] {
  return normalizeCompletedMissionDates([
    ...dates,
    ...(legacyDate == null ? [] : [legacyDate]),
  ]);
}

function calculateDateStreak(dates: string[]): number {
  const dateSet = new Set(dates);
  let streakDays = 0;
  const cursor = new Date();

  while (dateSet.has(getDateString(cursor))) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streakDays;
}

function normalizeGoal(goal: Partial<Goal>, fallbackIndex: number): Goal {
  return {
    id: goal.id ?? `legacy-${fallbackIndex}`,
    text: goal.text ?? "",
    emoji: goal.emoji ?? "💧",
    crewId: goal.crewId,
    done: goal.done ?? false,
    createdAt: goal.createdAt ?? new Date().toISOString(),
  };
}

function createGoalRecordKey(goal: Pick<Goal, "text" | "emoji">): string {
  return `${goal.emoji}:${goal.text.trim().toLowerCase()}`;
}

function updateCompletedGoalRecords(
  records: CompletedGoalRecord[],
  goal: Goal,
): CompletedGoalRecord[] {
  const now = new Date().toISOString();
  const key = createGoalRecordKey(goal);
  const existingRecord = records.find((record) => record.key === key);

  if (existingRecord == null) {
    return [
      {
        key,
        text: goal.text,
        emoji: goal.emoji,
        count: 1,
        lastCompletedAt: now,
      },
      ...records,
    ];
  }

  return records
    .map((record) =>
      record.key === key
        ? {
            ...record,
            text: goal.text,
            emoji: goal.emoji,
            count: record.count + 1,
            lastCompletedAt: now,
          }
        : record,
    )
    .sort((left, right) =>
      right.lastCompletedAt.localeCompare(left.lastCompletedAt),
    );
}

function withDefaultUnlockedCharacters(characters: Character[] = []) {
  const knownCharactersById = new Map(
    ALL_CHARACTERS.map((character) => [character.id, character]),
  );
  const mergedById = new Map<string, Character>();

  DEFAULT_UNLOCKED_CHARACTERS.forEach((character) => {
    mergedById.set(character.id, character);
  });

  characters.forEach((character) => {
    const characterId = LEGACY_CHARACTER_ID_MAP[character.id] ?? character.id;
    const knownCharacter = knownCharactersById.get(characterId);
    if (knownCharacter == null) return;
    mergedById.set(knownCharacter.id, {
      ...knownCharacter,
      unlockedAt: character.unlockedAt || new Date().toISOString(),
    });
  });

  return Array.from(mergedById.values()).sort(
    (left, right) => left.requiredCount - right.requiredCount,
  );
}

function buildGoals(inputs: GoalInput[], previousGoals: Goal[] = []): Goal[] {
  const previousById = new Map(previousGoals.map((goal) => [goal.id, goal]));

  return inputs.map((input) => {
    const previous = input.id == null ? undefined : previousById.get(input.id);

    return {
      id: previous?.id ?? input.id ?? createGoalId(),
      text: input.text.trim(),
      emoji: input.emoji,
      crewId: input.crewId ?? previous?.crewId,
      done: previous?.done ?? false,
      createdAt: previous?.createdAt ?? new Date().toISOString(),
    };
  });
}

function getPersistedState(state: AppState): PersistedState {
  return {
    goals: state.goals,
    unlockedCharacters: state.unlockedCharacters,
    totalCompletionCount: state.totalCompletionCount,
    dailyCompletedGoalIds: state.dailyCompletedGoalIds,
    completedMissionDates: state.completedMissionDates,
    completedGoalRecords: state.completedGoalRecords,
    shareRewardSnackCount: state.shareRewardSnackCount,
    shareRewardDates: state.shareRewardDates,
    lastResetDate: state.lastResetDate,
    hasOnboarded: state.hasOnboarded,
  };
}

async function persistSave(state: PersistedState): Promise<void> {
  try {
    await Storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 저장할 수 없는 환경에서는 현재 세션 상태만 유지해요.
    }
  }
}

async function persistLoad(): Promise<LegacyPersistedState | null> {
  try {
    const raw = await Storage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LegacyPersistedState;
  } catch {
    // 브리지 환경이 아니면 localStorage fallback을 사용해요.
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LegacyPersistedState;
  } catch {
    // localStorage가 없는 환경에서는 빈 상태로 시작해요.
  }

  return null;
}

export const useAppStore = create<AppState>((set, get) => ({
  goals: [],
  unlockedCharacters: DEFAULT_UNLOCKED_CHARACTERS,
  totalCompletionCount: 0,
  dailyCompletedGoalIds: [],
  completedMissionDates: [],
  completedGoalRecords: [],
  shareRewardSnackCount: 0,
  shareRewardDates: [],
  lastResetDate: getTodayString(),
  hasOnboarded: false,
  isLoaded: false,
  showCelebration: false,
  newCharacter: null,

  loadFromStorage: async () => {
    const saved = await persistLoad();
    const today = getTodayString();

    if (!saved) {
      set({
        unlockedCharacters: DEFAULT_UNLOCKED_CHARACTERS,
        dailyCompletedGoalIds: [],
        completedMissionDates: [],
        completedGoalRecords: [],
        shareRewardSnackCount: 0,
        shareRewardDates: [],
        isLoaded: true,
        lastResetDate: today,
        hasOnboarded: false,
      });
      return;
    }

    const savedGoals = (saved.goals ?? []).map(normalizeGoal);
    const goals =
      saved.lastResetDate !== today
        ? savedGoals.map((goal) => ({ ...goal, done: false }))
        : savedGoals;
    const dailyCompletedGoalIds =
      saved.lastResetDate !== today ? [] : (saved.dailyCompletedGoalIds ?? []);
    const completedMissionDates = normalizeCompletedMissionDates(
      saved.completedMissionDates,
    );
    const shareRewardDates = normalizeShareRewardDates(
      saved.shareRewardDates,
      saved.lastShareRewardDate,
    );
    const shouldBackfillTodayCompletion =
      saved.completedMissionDates == null &&
      saved.lastResetDate === today &&
      goals.length > 0 &&
      goals.every((goal) => goal.done);
    const hasOnboarded = saved.hasOnboarded ?? savedGoals.length > 0;

    set({
      goals,
      unlockedCharacters: withDefaultUnlockedCharacters(saved.unlockedCharacters),
      totalCompletionCount: saved.totalCompletionCount ?? 0,
      dailyCompletedGoalIds,
      completedMissionDates: shouldBackfillTodayCompletion
        ? normalizeCompletedMissionDates([...completedMissionDates, today])
        : completedMissionDates,
      completedGoalRecords: saved.completedGoalRecords ?? [],
      shareRewardSnackCount: saved.shareRewardSnackCount ?? 0,
      shareRewardDates,
      lastResetDate: today,
      hasOnboarded,
      isLoaded: true,
    });
  },

  toggleGoal: (id: string) => {
    const {
      goals,
      totalCompletionCount,
      dailyCompletedGoalIds,
      completedMissionDates,
      completedGoalRecords,
      unlockedCharacters,
    } = get();
    const goal = goals.find((item) => item.id === id);
    if (!goal) return;

    const nextDone = !goal.done;
    const isFirstCompletionToday =
      nextDone && !dailyCompletedGoalIds.includes(id);

    const newGoals = goals.map((item) =>
      item.id === id ? { ...item, done: nextDone } : item,
    );
    const newDailyCompletedGoalIds = isFirstCompletionToday
      ? [...dailyCompletedGoalIds, id]
      : dailyCompletedGoalIds;
    const newCompletedGoalRecords = isFirstCompletionToday
      ? updateCompletedGoalRecords(completedGoalRecords, goal)
      : completedGoalRecords;
    const newCount = isFirstCompletionToday
      ? totalCompletionCount + 1
      : totalCompletionCount;
    const isMissionCompletedToday =
      nextDone &&
      newGoals.length > 0 &&
      newGoals.every((item) => item.done) &&
      !completedMissionDates.includes(getTodayString());
    const newCompletedMissionDates = isMissionCompletedToday
      ? normalizeCompletedMissionDates([
          ...completedMissionDates,
          getTodayString(),
        ])
      : completedMissionDates;
    const alreadyUnlockedIds = new Set(
      unlockedCharacters.map((character) => character.id),
    );
    const newCharacter = ALL_CHARACTERS.find(
      (character) =>
        character.requiredCount === newCount &&
        !alreadyUnlockedIds.has(character.id),
    );
    const newUnlockedCharacters =
      newCharacter == null
        ? unlockedCharacters
        : [
            ...unlockedCharacters,
            { ...newCharacter, unlockedAt: new Date().toISOString() },
          ];

    set({
      goals: newGoals,
      totalCompletionCount: newCount,
      dailyCompletedGoalIds: newDailyCompletedGoalIds,
      completedMissionDates: newCompletedMissionDates,
      completedGoalRecords: newCompletedGoalRecords,
      unlockedCharacters: newUnlockedCharacters,
      showCelebration: false,
      newCharacter: newCharacter ?? null,
    });

    persistSave({
      ...getPersistedState(get()),
      goals: newGoals,
      unlockedCharacters: newUnlockedCharacters,
      totalCompletionCount: newCount,
      dailyCompletedGoalIds: newDailyCompletedGoalIds,
      completedMissionDates: newCompletedMissionDates,
      completedGoalRecords: newCompletedGoalRecords,
    });
  },

  resetGoals: () => {
    const today = getTodayString();
    const goals = get().goals.map((goal) => ({ ...goal, done: false }));

    set({ goals, lastResetDate: today, showCelebration: false });
    persistSave({ ...getPersistedState(get()), goals, lastResetDate: today });
  },

  completeOnboarding: (inputs: GoalInput[]) => {
    const goals = buildGoals(inputs);
    const today = getTodayString();

    set({
      goals,
      hasOnboarded: true,
      dailyCompletedGoalIds: [],
      completedGoalRecords: [],
      lastResetDate: today,
      showCelebration: false,
    });
    persistSave({
      ...getPersistedState(get()),
      goals,
      hasOnboarded: true,
      dailyCompletedGoalIds: [],
      completedGoalRecords: [],
      lastResetDate: today,
    });
  },

  saveGoals: (inputs: GoalInput[]) => {
    get().updateGoals(inputs);
  },

  updateGoals: (inputs: GoalInput[]) => {
    const goals = buildGoals(inputs, get().goals);

    set({ goals, hasOnboarded: true });
    persistSave({ ...getPersistedState(get()), goals, hasOnboarded: true });
  },

  startNewMission: () => {
    const today = getTodayString();
    const nextState = {
      goals: [],
      dailyCompletedGoalIds: [],
      lastResetDate: today,
      hasOnboarded: false,
      showCelebration: false,
      newCharacter: null,
    };

    set(nextState);
    persistSave({ ...getPersistedState(get()), ...nextState });
  },

  claimShareReward: (earnedSnacks = DAILY_SHARE_REWARD_SNACKS) => {
    const { shareRewardDates, shareRewardSnackCount, unlockedCharacters } =
      get();
    const today = getTodayString();
    const streakBefore = calculateDateStreak(shareRewardDates);
    const nextShareRewardDates = normalizeShareRewardDates([
      ...shareRewardDates,
      today,
    ]);
    const nextStreakDays = calculateDateStreak(nextShareRewardDates);
    const alreadyUnlocked = unlockedCharacters.find(
      (character) => character.id === SHARE_REWARD_CHARACTER_ID,
    );
    if (alreadyUnlocked != null) {
      if (shareRewardDates.includes(today)) {
        return {
          type: "already-recorded",
          character: alreadyUnlocked,
          snackCount: shareRewardSnackCount,
          streakDays: streakBefore,
        };
      }

      const nextSnackCount = shareRewardSnackCount + earnedSnacks;

      set({
        shareRewardSnackCount: nextSnackCount,
        shareRewardDates: nextShareRewardDates,
        newCharacter: null,
      });
      persistSave({
        ...getPersistedState(get()),
        shareRewardSnackCount: nextSnackCount,
        shareRewardDates: nextShareRewardDates,
      });

      return {
        type: "snacks-earned",
        character: alreadyUnlocked,
        earnedSnacks,
        snackCount: nextSnackCount,
        streakDays: nextStreakDays,
      };
    }

    const rewardCharacter = ALL_CHARACTERS.find(
      (character) => character.id === SHARE_REWARD_CHARACTER_ID,
    );
    if (rewardCharacter == null) {
      return {
        type: "unavailable",
        snackCount: shareRewardSnackCount,
        streakDays: streakBefore,
      };
    }

    const unlockedCharacter = {
      ...rewardCharacter,
      unlockedAt: new Date().toISOString(),
    };
    const nextSnackCount = shareRewardSnackCount + earnedSnacks;
    const newUnlockedCharacters = [
      ...unlockedCharacters,
      unlockedCharacter,
    ].sort((left, right) => left.requiredCount - right.requiredCount);

    set({
      unlockedCharacters: newUnlockedCharacters,
      shareRewardSnackCount: nextSnackCount,
      shareRewardDates: nextShareRewardDates,
      newCharacter: unlockedCharacter,
    });
    persistSave({
      ...getPersistedState(get()),
      unlockedCharacters: newUnlockedCharacters,
      shareRewardSnackCount: nextSnackCount,
      shareRewardDates: nextShareRewardDates,
    });

    return {
      type: "character-unlocked",
      character: unlockedCharacter,
      earnedSnacks,
      snackCount: nextSnackCount,
      streakDays: nextStreakDays,
    };
  },

  spendShareRewardSnacks: (amount: number) => {
    const { shareRewardSnackCount } = get();
    if (amount <= 0 || shareRewardSnackCount < amount) {
      return false;
    }

    const nextSnackCount = shareRewardSnackCount - amount;

    set({ shareRewardSnackCount: nextSnackCount });
    persistSave({
      ...getPersistedState(get()),
      shareRewardSnackCount: nextSnackCount,
    });

    return true;
  },

  resetOnboarding: () => {
    const today = getTodayString();
    const nextState: PersistedState = {
      goals: [],
      unlockedCharacters: DEFAULT_UNLOCKED_CHARACTERS,
      totalCompletionCount: 0,
      dailyCompletedGoalIds: [],
      completedMissionDates: [],
      completedGoalRecords: [],
      shareRewardSnackCount: 0,
      shareRewardDates: [],
      lastResetDate: today,
      hasOnboarded: false,
    };

    set({
      ...nextState,
      showCelebration: false,
      newCharacter: null,
    });
    persistSave(nextState);
  },

  setShowCelebration: (show: boolean) => set({ showCelebration: show }),
  clearNewCharacter: () => set({ newCharacter: null }),
}));
