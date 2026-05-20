import { contactsViral } from "@apps-in-toss/web-framework";
import { BottomSheet, Button, useBottomSheet, useDialog, useToast } from "@toss/tds-mobile";
import confetti from "canvas-confetti";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CharacterCard } from "../components/CharacterCard";
import { SHARE_REWARD_CHARACTER_ID } from "../components/goal-editor/constants";
import { useHaptic } from "../hooks/useHaptic";
import { ALL_CHARACTERS, useAppStore, type Character } from "../store/useAppStore";

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

const LIGHT_COUNT = 7;
const STREAK_DAYS = 3;
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
        height: "clamp(330px, 44vh, 500px)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 12,
        padding: "26px 0 18px",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,215,64,0.14) 0%, rgba(149,117,205,0.1) 34%, rgba(149,117,205,0.035) 68%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 10,
          left: "50%",
          width: "92%",
          height: "70%",
          transform: "translateX(-50%)",
          clipPath: "polygon(36% 0%, 64% 0%, 100% 100%, 0% 100%)",
          background:
            "linear-gradient(180deg, rgba(255,215,64,0.12), rgba(149,117,205,0.08) 48%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "56%",
          width: "92%",
          height: 148,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(149,117,205,0.34) 0%, rgba(149,117,205,0.14) 42%, transparent 74%)",
          pointerEvents: "none",
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

function StageLights({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-around",
        padding: "22px 56px 8px",
      }}
    >
      {Array.from({ length: LIGHT_COUNT }, (_, index) => (
        <motion.div
          key={index}
          animate={{
            opacity: shouldReduceMotion ? 0.75 : [0.3, 1, 0.3],
            boxShadow: shouldReduceMotion
              ? "0 0 6px 2px rgba(255,215,64,0.35)"
              : [
                  "0 0 4px 1px rgba(255,215,64,0.2)",
                  "0 0 10px 3px rgba(255,215,64,0.7)",
                  "0 0 4px 1px rgba(255,215,64,0.2)",
                ],
          }}
          transition={{
            duration: 1.8,
            delay: index * 0.18,
            repeat: shouldReduceMotion ? 0 : Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "#ffd740",
          }}
        />
      ))}
    </div>
  );
}

function StreakCard({ hasNewCharacter }: { hasNewCharacter: boolean }) {
  const streakDays = STREAK_DAYS;

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
          내일도 같은 목표로 만나요 💪
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
    </motion.div>
  );
}

function buildWeeklyProgress(
  streakDays: number,
): WeeklyProgressProps["weekData"] {
  const todayIndex = (new Date().getDay() + 6) % 7;

  return WEEK_DAYS.map((day, index) => {
    if (index === todayIndex) {
      return { day, status: "today" };
    }

    const daysBeforeToday = todayIndex - index;
    if (daysBeforeToday > 0 && daysBeforeToday < streakDays) {
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

function ShareRewardChip({
  children,
  onClick,
  disabled = false,
}: {
  children: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      size="medium"
      color="light"
      variant="weak"
      display="inline"
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: 42,
        borderRadius: 999,
        backgroundColor: disabled
          ? "rgba(255,255,255,0.06)"
          : "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#ffffff",
        cursor: disabled ? "default" : "pointer",
        fontSize: 14,
        fontWeight: 800,
        padding: "0 16px",
        whiteSpace: "nowrap",
        boxShadow: "inset 0 -6px 14px rgba(0,0,0,0.12)",
        opacity: disabled ? 0.62 : 1,
        width: "100%",
      }}
    >
      {children}
    </Button>
  );
}

function RewardPreview({ character }: { character: Character }) {
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
        친구에게 오늘의 달성을 공유하면 해금돼요.
      </div>
    </div>
  );
}

function StageHeader({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      style={{
        backgroundColor: "#1a1545",
        paddingBottom: 16,
        textAlign: "center",
        borderBottom: "2px solid #3d2f7a",
        boxShadow: "0 2px 12px rgba(149,117,205,0.3)",
      }}
    >
      <StageLights shouldReduceMotion={shouldReduceMotion} />

      <div style={{ padding: "16px 20px 0" }}>
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
            margin: "0 0 6px",
          }}
        >
          오늘 목표 완료!
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          관중석이 들썩이고 있어요
        </p>
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
    clearNewCharacter,
    newCharacter,
    setShowCelebration,
    unlockShareRewardCharacter,
  } = useAppStore();
  const [sharing, setSharing] = useState(false);
  const contactsViralCleanupRef = useRef<(() => void) | null>(null);
  const weekData = buildWeeklyProgress(STREAK_DAYS);
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
            const unlockedCharacter = unlockShareRewardCharacter();
            haptic("success");
            toast.openToast(
              `${unlockedCharacter?.name ?? "새 캐릭터"} 해금 완료!`,
            );
          }

          if (event.type === "close") {
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
  }, [dialog, haptic, toast, unlockShareRewardCharacter]);

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
      children: <RewardPreview character={shareRewardCharacter} />,
      onClose: closeBottomSheet,
    });
  }, [closeBottomSheet, haptic, openBottomSheet, shareRewardCharacter]);

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
      <StageHeader shouldReduceMotion={shouldReduceMotion} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
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
          <StreakCard hasNewCharacter={newCharacter != null} />
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
            <ShareRewardChip onClick={handleShareReward} disabled={sharing}>
              {sharing ? "공유 준비 중" : "📸 공유하기"}
            </ShareRewardChip>
            <ShareRewardChip onClick={handleRewardPreview}>
              🎁 리워드 보기
            </ShareRewardChip>
          </motion.div>
        </div>
      </div>

      <div style={{ padding: "24px 20px 40px", backgroundColor: "#0d0b1e" }}>
        <Button onClick={handleReturn} style={{ width: "100%" }}>
          응원판으로 돌아가기
        </Button>
      </div>
    </div>
  );
}
