import { Button } from "@toss/tds-mobile";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { CharacterCard } from "../components/CharacterCard";
import { useHaptic } from "../hooks/useHaptic";
import { useAppStore } from "../store/useAppStore";

const CROWD_ROWS: Array<{
  label: string;
  emojis: readonly string[];
  scale: number;
  opacity: number;
  blur?: number;
}> = [
  { label: "A", emojis: ["🐸", "🐱", "🐶", "🦄", "🐼"], scale: 1, opacity: 1 },
  {
    label: "B",
    emojis: ["🐻", "🐨", "🐥", "🦊", "🐯", "🐹"],
    scale: 0.94,
    opacity: 0.88,
  },
  {
    label: "C",
    emojis: ["🐹", "🐸", "🐱", "🐶", "🦄", "🐼", "🐻"],
    scale: 0.88,
    opacity: 0.75,
  },
  {
    label: "D",
    emojis: ["🐼", "🐻", "🐨", "🐥", "🦁", "🦊", "🐯", "🐰"],
    scale: 0.8,
    opacity: 0.52,
    blur: 0.3,
  },
  {
    label: "E",
    emojis: ["🐱", "🐶", "🐹", "🐰", "🦊", "🐸", "🦄", "🐨", "🐥"],
    scale: 0.72,
    opacity: 0.35,
    blur: 0.6,
  },
];

const TICKER_ITEMS = [
  "★ 3일 연속 달성",
  "내일도 같은 목표로 만나요",
  "오늘도 해냈어요",
];

const LIGHT_COUNT = 7;

interface CrowdSeatProps {
  emoji: string;
  waveDelay: number;
  seatScale: number;
}

function CrowdSeat({ emoji, waveDelay, seatScale }: CrowdSeatProps) {
  const size = Math.round(44 * seatScale);
  const fontSize = Math.round(24 * seatScale);

  return (
    <motion.div
      animate={{ y: [0, -14 * seatScale, 0] }}
      transition={{
        duration: 0.55,
        delay: waveDelay,
        repeat: Infinity,
        repeatDelay: 1.6,
        ease: [0.33, 1, 0.68, 1],
      }}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(10 * seatScale),
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

function CrowdSection() {
  const reversedRows = [...CROWD_ROWS].reverse();

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-evenly",
        width: "100%",
      }}
    >
      {reversedRows.map((row, i) => (
        <div
          key={row.label}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            opacity: row.opacity,
            filter: row.blur ? `blur(${row.blur}px)` : undefined,
            width: "100%",
            padding: "0 32px",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 8,
              fontSize: 10,
              color: "rgba(149, 117, 205, 0.5)",
              fontWeight: 700,
              letterSpacing: "0.5px",
            }}
          >
            {row.label}
          </span>
          {row.emojis.map((emoji, j) => (
            <CrowdSeat
              key={`${row.label}-${j}`}
              emoji={emoji}
              waveDelay={i * 0.15 + j * 0.12}
              seatScale={row.scale}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function StageLights() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-around",
        padding: "10px 32px 0",
      }}
    >
      {Array.from({ length: LIGHT_COUNT }, (_, i) => (
        <motion.div
          key={i}
          animate={{
            opacity: [0.3, 1, 0.3],
            boxShadow: [
              "0 0 4px 1px rgba(255,215,64,0.2)",
              "0 0 10px 3px rgba(255,215,64,0.7)",
              "0 0 4px 1px rgba(255,215,64,0.2)",
            ],
          }}
          transition={{
            duration: 1.8,
            delay: i * 0.18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "#ffd740",
          }}
        />
      ))}
    </div>
  );
}

function TickerBanner({ hasNewCharacter }: { hasNewCharacter: boolean }) {
  const items = [
    ...TICKER_ITEMS,
    ...(hasNewCharacter ? ["★ 새 응원단원 합류!"] : []),
  ];
  const text = items.join("   ·   ");

  return (
    <div
      style={{
        backgroundColor: "#080614",
        overflow: "hidden",
        padding: "7px 0",
      }}
    >
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        style={{
          display: "flex",
          whiteSpace: "nowrap",
          fontSize: 11,
          color: "#9575CD",
          letterSpacing: "0.5px",
          gap: 32,
        }}
      >
        <span>{text}</span>
        <span>{text}</span>
      </motion.div>
    </div>
  );
}

function StageHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        backgroundColor: "#1a1545",
        paddingBottom: 18,
        textAlign: "center",
        borderBottom: "2px solid #3d2f7a",
        boxShadow: "0 2px 12px rgba(149,117,205,0.3)",
      }}
    >
      <StageLights />

      <div style={{ padding: "14px 20px 0" }}>
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
  const { clearNewCharacter, newCharacter, setShowCelebration } = useAppStore();

  useEffect(() => {
    haptic("confetti");
  }, [haptic]);

  const handleReturn = () => {
    haptic("success");
    clearNewCharacter();
    setShowCelebration(false);
  };

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
      <StageHeader />

      <CrowdSection />

      {newCharacter && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.8,
            type: "spring",
            stiffness: 220,
            damping: 18,
          }}
          style={{
            margin: "0 20px",
            padding: 16,
            borderRadius: 16,
            backgroundColor: "#1a1545",
            border: "1.5px solid rgba(149,117,205,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#9575CD",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            새 응원단원
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <CharacterCard character={newCharacter} unlocked isNew />
          </div>
        </motion.div>
      )}

      <div style={{ marginTop: "auto", paddingTop: 12 }}>
        <TickerBanner hasNewCharacter={newCharacter != null} />
      </div>

      <div style={{ padding: "16px 20px 40px" }}>
        <Button onClick={handleReturn} style={{ width: "100%" }}>
          응원판으로 돌아가기
        </Button>
      </div>
    </div>
  );
}
