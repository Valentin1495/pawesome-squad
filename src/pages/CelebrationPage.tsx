import { contactsViral } from "@apps-in-toss/web-framework";
import {
  BottomSheet,
  Button,
  IconButton,
  useBottomSheet,
  useDialog,
  useToast,
} from "@toss/tds-mobile";
import type { ButtonProps } from "@toss/tds-mobile";
import confetti from "canvas-confetti";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CharacterCard } from "../components/CharacterCard";
import { SHARE_REWARD_CHARACTER_ID } from "../components/goal-editor/constants";
import { useHaptic } from "../hooks/useHaptic";
import {
  ALL_CHARACTERS,
  useAppStore,
  type Character,
} from "../store/useAppStore";

const CONTACTS_VIRAL_MODULE_ID =
  import.meta.env.VITE_CONTACTS_VIRAL_MODULE_ID?.trim() ?? "";
const CONFETTI_COLORS = ["#7B6EF6", "#FFD166", "#06D6A0", "#FF6B6B", "#A99BFF"];
const SIDE_CONFETTI_COLORS = ["#FFD166", "#7B6EF6", "#06D6A0"];

const CROWD_ROWS: Array<{
  id: string;
  emojis: readonly string[];
  scale: number;
  opacity: number;
}> = [
  {
    id: "front",
    emojis: ["🐷", "🐸", "🐱", "🐶", "🐭", "🐰", "🦄"],
    scale: 1,
    opacity: 1,
  },
  {
    id: "lower",
    emojis: ["🐼", "🐨", "🐻", "🦁", "🐯", "🦊", "🐮"],
    scale: 0.82,
    opacity: 0.92,
  },
  {
    id: "middle",
    emojis: ["🐹", "🐸", "🐱", "🐶", "🐭", "🐰", "🦄"],
    scale: 0.68,
    opacity: 0.76,
  },
  {
    id: "upper",
    emojis: ["🐼", "🐻", "🐨", "🐥", "🦁", "🦊", "🐯"],
    scale: 0.56,
    opacity: 0.56,
  },
  {
    id: "back",
    emojis: ["🐱", "🐶", "🐹", "🐰", "🦊", "🐸", "🦄"],
    scale: 0.44,
    opacity: 0.38,
  },
];

const STAGE_SPOTLIGHT = {
  sourceLeft: 50,
  beamLeft: 50,
  beamWidth: 86,
  color: "255,215,64",
} as const;
const WEEK_DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;

type WeekDay = (typeof WEEK_DAYS)[number];
type WeeklyProgressStatus = "done" | "today" | "pending";

interface WeeklyProgressProps {
  weekData: {
    day: WeekDay;
    status: WeeklyProgressStatus;
  }[];
}

interface CrowdSeatProps {
  emoji: string;
  waveDelay: number;
  seatScale: number;
  shouldReduceMotion: boolean;
}

function CrowdSeat({
  emoji,
  waveDelay,
  seatScale,
  shouldReduceMotion,
}: CrowdSeatProps) {
  const size = Math.round(44 * seatScale);
  const fontSize = Math.round(24 * seatScale);

  return (
    <motion.div
      animate={shouldReduceMotion ? { y: 0 } : { y: [0, -12 * seatScale, 0] }}
      transition={{
        duration: 0.55,
        delay: waveDelay,
        repeat: shouldReduceMotion ? 0 : Infinity,
        repeatDelay: 1.55,
        ease: [0.33, 1, 0.68, 1],
      }}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(12 * seatScale),
        backgroundColor: "#1f1a4a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        flexShrink: 0,
        boxShadow: "inset 0 -8px 12px rgba(0,0,0,0.16)",
      }}
    >
      {emoji}
    </motion.div>
  );
}

function CrowdSection({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  const rowsFromBack = [...CROWD_ROWS].reverse();

  return (
    <div
      style={{
        flex: "0 0 auto",
        height: "clamp(300px, 39vh, 440px)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        gap: 10,
        padding: "52px 0 14px",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <StageLights shouldReduceMotion={shouldReduceMotion} />
      <CrowdSpotlights shouldReduceMotion={shouldReduceMotion} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,215,64,0.08) 0%, rgba(30,24,76,0.5) 22%, rgba(18,15,45,0.72) 58%, rgba(13,11,30,0) 100%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "104%",
          height: 210,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(149,117,205,0.3) 0%, rgba(80,65,155,0.16) 38%, rgba(26,21,69,0.08) 62%, transparent 78%)",
          filter: "blur(2px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: "18px 0 0",
          background:
            "radial-gradient(ellipse at 50% 34%, transparent 0%, transparent 38%, rgba(7,6,18,0.18) 68%, rgba(7,6,18,0.5) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 0,
          width: "88%",
          height: 92,
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(0,0,0,0.34) 0%, rgba(13,11,30,0.18) 45%, transparent 72%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {rowsFromBack.map((row, rowIndex) => (
        <div
          key={row.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            opacity: row.opacity,
            width: "100%",
            padding: "0 16px",
            position: "relative",
            zIndex: 2,
          }}
        >
          {row.emojis.map((emoji, seatIndex) => (
            <CrowdSeat
              key={`${row.id}-${seatIndex}`}
              emoji={emoji}
              waveDelay={rowIndex * 0.12 + seatIndex * 0.08}
              seatScale={row.scale}
              shouldReduceMotion={shouldReduceMotion}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function CrowdSpotlights({
  shouldReduceMotion,
}: {
  shouldReduceMotion: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: "0 0 0",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <motion.div
        animate={
          shouldReduceMotion
            ? { opacity: 0.58 }
            : { opacity: [0.42, 0.64, 0.5] }
        }
        transition={{
          duration: 2.4,
          repeat: shouldReduceMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          top: 0,
          left: `${STAGE_SPOTLIGHT.beamLeft}%`,
          width: `${STAGE_SPOTLIGHT.beamWidth}%`,
          height: "84%",
          transform: "translateX(-50%)",
          transformOrigin: "50% 0%",
          clipPath: "polygon(47.5% 0%, 52.5% 0%, 100% 100%, 0% 100%)",
          background: `linear-gradient(180deg, rgba(${STAGE_SPOTLIGHT.color},0.28) 0%, rgba(${STAGE_SPOTLIGHT.color},0.2) 36%, rgba(${STAGE_SPOTLIGHT.color},0.06) 86%, transparent 100%)`,
          mixBlendMode: "screen",
          filter: "blur(0.5px)",
        }}
      />
      <motion.div
        animate={
          shouldReduceMotion
            ? { opacity: 0.7 }
            : { opacity: [0.48, 0.76, 0.58] }
        }
        transition={{
          duration: 2.4,
          repeat: shouldReduceMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          left: "50%",
          bottom: 12,
          width: "94%",
          height: 188,
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background: `radial-gradient(ellipse, rgba(${STAGE_SPOTLIGHT.color},0.24) 0%, rgba(149,117,205,0.2) 34%, rgba(149,117,205,0.08) 66%, transparent 82%)`,
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}

function StageLights({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 4,
        height: 24,
        pointerEvents: "none",
      }}
    >
      <motion.div
        animate={{
          opacity: shouldReduceMotion ? 0.85 : [0.62, 1, 0.78],
          boxShadow: shouldReduceMotion
            ? "0 0 16px 6px rgba(255,215,64,0.42)"
            : [
                "0 0 10px 4px rgba(255,215,64,0.36)",
                "0 0 22px 8px rgba(255,215,64,0.78)",
                "0 0 14px 5px rgba(255,215,64,0.48)",
              ],
        }}
        transition={{
          duration: 2.4,
          repeat: shouldReduceMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          left: `${STAGE_SPOTLIGHT.sourceLeft}%`,
          top: 0,
          width: 16,
          height: 16,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, #ffe47a 0%, #d8b83f 48%, rgba(255,215,64,0.34) 72%, transparent 100%)",
          border: "1px solid rgba(255,238,154,0.42)",
        }}
      />
    </div>
  );
}

function StreakCard({
  hasNewCharacter,
  streakDays,
}: {
  hasNewCharacter: boolean;
  streakDays: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.35, ease: "easeOut" }}
      style={{
        margin: "0 20px",
        padding: "16px 18px",
        borderRadius: 20,
        backgroundColor: "#1b153f",
        border: "1px solid rgba(149,117,205,0.34)",
        boxShadow: "0 14px 30px rgba(0,0,0,0.24)",
        display: "flex",
        alignItems: "center",
        gap: 13,
      }}
    >
      <div
        style={{
          color: "#ffd740",
          fontSize: 32,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: "-0.2px",
          flex: "0 0 auto",
        }}
      >
        {streakDays}일
      </div>

      <div
        style={{
          minWidth: 0,
          flex: 1,
        }}
      >
        <div
          style={{
            color: "#fff",
            fontSize: 15,
            fontWeight: 900,
            lineHeight: 1.25,
          }}
        >
          연속 달성 중!
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.58)",
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.35,
            marginTop: 4,
          }}
        >
          내일도 만나요 💪
        </div>
        {hasNewCharacter && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 8,
              padding: "4px 8px",
              borderRadius: 99,
              backgroundColor: "rgba(149,117,205,0.18)",
              color: "#c3adff",
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            새 응원단원 합류!
          </div>
        )}
      </div>

      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          backgroundColor: "rgba(255,215,64,0.16)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 23,
          boxShadow: "inset 0 -8px 14px rgba(255,149,0,0.12)",
          flex: "0 0 auto",
        }}
      >
        🔥
      </div>
    </motion.div>
  );
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function calculateStreakDays(completedMissionDates: string[]): number {
  const completedDateSet = new Set(completedMissionDates);
  let streakDays = 0;
  let cursor = new Date();

  while (completedDateSet.has(formatDate(cursor))) {
    streakDays += 1;
    cursor = addDays(cursor, -1);
  }

  return streakDays;
}

function calculateShareRewardStreak(shareRewardDates: string[]): number {
  const rewardDateSet = new Set(shareRewardDates);
  let streakDays = 0;
  let cursor = new Date();

  while (rewardDateSet.has(formatDate(cursor))) {
    streakDays += 1;
    cursor = addDays(cursor, -1);
  }

  return streakDays;
}

function buildWeeklyProgress(
  completedMissionDates: string[],
): WeeklyProgressProps["weekData"] {
  const completedDateSet = new Set(completedMissionDates);
  const today = new Date();
  const todayIndex = (today.getDay() + 6) % 7;
  const monday = addDays(today, -todayIndex);
  const todayKey = formatDate(today);

  return WEEK_DAYS.map((day, index) => {
    const date = addDays(monday, index);
    const dateKey = formatDate(date);

    if (dateKey === todayKey) {
      return { day, status: "today" };
    }

    if (date < today && completedDateSet.has(dateKey)) {
      return { day, status: "done" };
    }

    return { day, status: "pending" };
  });
}

function WeeklyProgress({ weekData }: WeeklyProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.34, duration: 0.35, ease: "easeOut" }}
      style={{
        margin: "0 20px",
        padding: "14px 16px 13px",
        borderRadius: 18,
        backgroundColor: "rgba(27,21,63,0.82)",
        border: "1px solid rgba(149,117,205,0.24)",
        boxShadow: "0 12px 26px rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.42)",
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: "0.7px",
          marginBottom: 12,
        }}
      >
        이번 주 달성 현황
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 6,
        }}
      >
        {weekData.map(({ day, status }) => {
          const isDone = status === "done";
          const isToday = status === "today";

          return (
            <div
              key={day}
              style={{
                flex: "1 1 0",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isDone ? 18 : 14,
                  fontWeight: isDone ? 900 : 700,
                  backgroundColor: isToday
                    ? "rgba(149,117,205,0.95)"
                    : isDone
                      ? "rgba(62,213,170,0.88)"
                      : "rgba(255,255,255,0.06)",
                  border: isToday
                    ? "1px solid rgba(255,255,255,0.32)"
                    : isDone
                      ? "1px solid rgba(143,245,213,0.35)"
                      : "1px solid rgba(255,255,255,0.1)",
                  color: "#ffffff",
                  boxShadow: isToday
                    ? "0 0 0 4px rgba(149,117,205,0.22), 0 0 16px rgba(149,117,205,0.72)"
                    : isDone
                      ? "0 0 12px rgba(62,213,170,0.2)"
                      : "none",
                }}
              >
                {isToday ? "⭐" : isDone ? "✓" : ""}
              </div>
              <div
                style={{
                  color: isToday ? "#ffffff" : "rgba(255,255,255,0.38)",
                  fontSize: 10,
                  fontWeight: isToday ? 900 : 700,
                  lineHeight: 1,
                }}
              >
                {day}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function ShareRewardButton({
  children,
  ...buttonProps
}: Omit<ButtonProps, "type"> & {
  children: string;
}) {
  return (
    <Button
      type="button"
      size="medium"
      display="full"
      style={{ borderRadius: 999 }}
      {...buttonProps}
    >
      {children}
    </Button>
  );
}

function RewardPreview({
  character,
  shareRewardSnackCount,
  shareRewardStreak,
}: {
  character: Character;
  shareRewardSnackCount: number;
  shareRewardStreak: number;
}) {
  return (
    <div style={{ padding: "0 20px 24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "12px 0 16px",
        }}
      >
        <CharacterCard character={character} unlocked isNew />
      </div>
      <div
        style={{
          borderRadius: 16,
          backgroundColor: "#f7f4ff",
          color: "#4d3f78",
          fontSize: 14,
          fontWeight: 800,
          lineHeight: 1.55,
          padding: "14px 16px",
          textAlign: "center",
        }}
      >
        {character.name}는 공유 리워드로만 만날 수 있어요.
        <br />
        처음 공유하면 해금되고, 이후 하루 한 번 공유 리워드 지급 때마다 간식을
        받아요.
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginTop: 10,
        }}
      >
        <div
          style={{
            borderRadius: 14,
            backgroundColor: "#fff7e6",
            color: "#6f4b00",
            padding: "12px 10px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 900 }}>
            {shareRewardSnackCount}개
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, marginTop: 2 }}>
            햄찌 간식
          </div>
        </div>
        <div
          style={{
            borderRadius: 14,
            backgroundColor: "#eef8ff",
            color: "#28506f",
            padding: "12px 10px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 900 }}>
            {shareRewardStreak}일
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, marginTop: 2 }}>
            공유 연속 기록
          </div>
        </div>
      </div>
    </div>
  );
}

function StageHeader({ onReturn }: { onReturn: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      style={{
        backgroundColor: "#1a1545",
        paddingBottom: 16,
        position: "relative",
        textAlign: "center",
        borderBottom: "2px solid #3d2f7a",
        boxShadow: "0 2px 12px rgba(149,117,205,0.3)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 16,
          zIndex: 2,
        }}
      >
        <IconButton
          src="https://static.toss.im/icons/svg/icon-x-mono.svg"
          aria-label="완료"
          type="button"
          variant="fill"
          iconSize={20}
          color="#ffffff"
          bgColor="rgba(255,255,255,0.16)"
          onClick={onReturn}
          style={{
            borderRadius: 18,
            boxShadow: "inset 0 -4px 10px rgba(0,0,0,0.12)",
          }}
        />
      </div>

      <div style={{ padding: "32px 20px 0" }}>
        <p
          style={{
            fontSize: 11,
            color: "#ffd740",
            letterSpacing: "0.8px",
            margin: "0 0 6px",
            fontWeight: 800,
          }}
        >
          TODAY&apos;S GOAL
        </p>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#ffffff",
            margin: 0,
          }}
        >
          오늘 목표 완료!
        </h1>
      </div>
    </motion.div>
  );
}

export function CelebrationPage() {
  const haptic = useHaptic();
  const dialog = useDialog();
  const toast = useToast();
  const { open: openBottomSheet, close: closeBottomSheet } = useBottomSheet();
  const shouldReduceMotion = useReducedMotion() === true;
  const {
    claimShareReward,
    clearNewCharacter,
    completedMissionDates,
    newCharacter,
    setShowCelebration,
    shareRewardDates,
    shareRewardSnackCount,
  } = useAppStore();
  const [sharing, setSharing] = useState(false);
  const contactsViralCleanupRef = useRef<(() => void) | null>(null);
  const streakDays = calculateStreakDays(completedMissionDates);
  const weekData = buildWeeklyProgress(completedMissionDates);
  const shareRewardStreak = calculateShareRewardStreak(shareRewardDates);
  const shareRewardCharacter = useMemo(
    () =>
      ALL_CHARACTERS.find(
        (character) => character.id === SHARE_REWARD_CHARACTER_ID,
      ) ?? null,
    [],
  );

  useEffect(() => {
    haptic("confetti");
    if (shouldReduceMotion) return;

    const isLowEnd = navigator.hardwareConcurrency <= 2;
    const particleScale = isLowEnd ? 0.5 : 1;
    let sideTimer: number | undefined;

    const timer = window.setTimeout(() => {
      confetti({
        particleCount: Math.round(120 * particleScale),
        spread: 80,
        origin: { x: 0.5, y: 0.45 },
        colors: CONFETTI_COLORS,
        scalar: 0.9,
        zIndex: 9999,
      });

      sideTimer = window.setTimeout(() => {
        confetti({
          particleCount: Math.round(60 * particleScale),
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: SIDE_CONFETTI_COLORS,
          zIndex: 9999,
        });
        confetti({
          particleCount: Math.round(60 * particleScale),
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: SIDE_CONFETTI_COLORS,
          zIndex: 9999,
        });
      }, 250);
    }, 300);

    return () => {
      window.clearTimeout(timer);
      if (sideTimer != null) {
        window.clearTimeout(sideTimer);
      }
    };
  }, [haptic, shouldReduceMotion]);

  useEffect(() => {
    return () => {
      contactsViralCleanupRef.current?.();
    };
  }, []);

  const handleReturn = () => {
    haptic("success");
    clearNewCharacter();
    setShowCelebration(false);
  };

  const handleShareReward = useCallback(() => {
    if (CONTACTS_VIRAL_MODULE_ID.length === 0) {
      dialog.openAlert({
        title: "공유 리워드 설정이 필요해요",
        description:
          "앱인토스 콘솔의 공유 리워드 moduleId를 VITE_CONTACTS_VIRAL_MODULE_ID에 설정해 주세요.",
      });
      return;
    }

    haptic("basicMedium");
    setSharing(true);

    try {
      const cleanup = contactsViral({
        options: { moduleId: CONTACTS_VIRAL_MODULE_ID },
        onEvent: (event) => {
          if (event.type === "sendViral") {
            const rewardResult = claimShareReward(event.data.rewardAmount);
            haptic("success");
            if (rewardResult.type === "character-unlocked") {
              toast.openToast(
                `${rewardResult.character.name} 해금 + 간식 ${rewardResult.earnedSnacks}개!`,
              );
            } else if (rewardResult.type === "snacks-earned") {
              toast.openToast(
                `햄찌 간식 ${rewardResult.earnedSnacks}개 받았어요!`,
              );
            } else if (rewardResult.type === "already-recorded") {
              toast.openToast("오늘 공유 리워드는 이미 기록됐어요.");
            } else {
              toast.openToast("공유 리워드를 지급할 수 없어요.");
            }
          }

          if (event.type === "close") {
            if (event.data.closeReason === "noReward") {
              toast.openToast("오늘 받을 수 있는 공유 리워드는 이미 받았어요.");
            }
            contactsViralCleanupRef.current?.();
            contactsViralCleanupRef.current = null;
            setSharing(false);
          }
        },
        onError: (error) => {
          console.error("contactsViral failed:", error);
          toast.openToast("공유 리워드를 불러오지 못했어요.");
          contactsViralCleanupRef.current?.();
          contactsViralCleanupRef.current = null;
          setSharing(false);
        },
      });

      contactsViralCleanupRef.current = cleanup;
    } catch (error) {
      console.error("contactsViral failed:", error);
      toast.openToast("공유 리워드를 실행할 수 없어요.");
      setSharing(false);
    }
  }, [claimShareReward, dialog, haptic, toast]);

  const handleRewardPreview = useCallback(() => {
    if (shareRewardCharacter == null) return;

    haptic("basicMedium");
    openBottomSheet({
      header: <BottomSheet.Header>공유 리워드</BottomSheet.Header>,
      headerDescription: (
        <BottomSheet.HeaderDescription>
          공유로만 해금되는 전용 캐릭터예요.
        </BottomSheet.HeaderDescription>
      ),
      children: (
        <RewardPreview
          character={shareRewardCharacter}
          shareRewardSnackCount={shareRewardSnackCount}
          shareRewardStreak={shareRewardStreak}
        />
      ),
      onClose: closeBottomSheet,
    });
  }, [
    closeBottomSheet,
    haptic,
    openBottomSheet,
    shareRewardCharacter,
    shareRewardSnackCount,
    shareRewardStreak,
  ]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0d0b1e",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <StageHeader onReturn={handleReturn} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          gap: 18,
          minHeight: 0,
          padding: "0 0 10px",
        }}
      >
        <CrowdSection shouldReduceMotion={shouldReduceMotion} />

        {newCharacter && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.6,
              type: "spring",
              stiffness: 220,
              damping: 18,
            }}
            style={{
              margin: "0 20px 8px",
              padding: 14,
              borderRadius: 16,
              backgroundColor: "#1a1545",
              border: "1.5px solid rgba(149,117,205,0.4)",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                fontSize: 13,
                color: "#9575CD",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              새 응원단원
              <span
                style={{
                  color: "rgba(255,255,255,0.78)",
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                {newCharacter.name}
              </span>
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <CharacterCard character={newCharacter} unlocked isNew />
            </div>
          </motion.div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <StreakCard
            hasNewCharacter={newCharacter != null}
            streakDays={streakDays}
          />
          <WeeklyProgress weekData={weekData} />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.35, ease: "easeOut" }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "0 20px 2px",
            }}
          >
            <ShareRewardButton
              variant="fill"
              loading={sharing}
              onClick={handleShareReward}
            >
              {sharing ? "공유 준비 중" : "💫 공유하기"}
            </ShareRewardButton>
            <ShareRewardButton
              size="medium"
              display="full"
              variant="weak"
              onClick={handleRewardPreview}
            >
              🎁 리워드 보기
            </ShareRewardButton>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
