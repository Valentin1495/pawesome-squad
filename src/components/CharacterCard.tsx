import { motion } from "framer-motion";
import { useState } from "react";
import { SHARE_REWARD_CHARACTER_ID } from "./goal-editor/constants";
import type { Character } from "../store/useAppStore";

interface CharacterCardProps {
  character: Character;
  unlocked: boolean;
  isNew?: boolean;
  index?: number;
}

const CHARACTER_EMOJI_SRC: Record<string, string> = {
  mung: "https://static.toss.im/2d-emojis/svg/u1F43B.svg",
  yeowoobi: "https://static.toss.im/2d-emojis/svg/u1F98A.svg",
  kkumgom: "https://static.toss.im/2d-emojis/svg/u1F428.svg",
  dalto: "https://static.toss.im/2d-emojis/svg/u1F430.svg",
  bambi: "https://static.toss.im/2d-emojis/svg/u1F425.svg",
  nabi: "https://static.toss.im/2d-emojis/svg/u1F431.svg",
  podo: "https://static.toss.im/2d-emojis/svg/u1F43C.svg",
  uni: "https://static.toss.im/2d-emojis/svg/u1F984.svg",
  choco: "https://static.toss.im/2d-emojis/svg/u1F36B.svg",
};

function CharacterAvatar({ character }: { character: Character }) {
  const [imageFailed, setImageFailed] = useState(false);
  const src = CHARACTER_EMOJI_SRC[character.id];

  if (src != null && !imageFailed) {
    return (
      <img
        src={src}
        alt={character.name}
        onError={() => setImageFailed(true)}
        style={{
          width: 40,
          height: 40,
          display: "block",
          objectFit: "contain",
        }}
      />
    );
  }

  return (
    <span
      style={{
        fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
        fontSize: 32,
        lineHeight: "40px",
      }}
    >
      {character.emoji}
    </span>
  );
}

export function CharacterCard({
  character,
  unlocked,
  isNew = false,
  index = 0,
}: CharacterCardProps) {
  return (
    <motion.div
      initial={isNew ? { scale: 0, rotate: -20 } : { opacity: 0, y: 10 }}
      animate={{ scale: 1, rotate: 0, opacity: 1, y: 0 }}
      transition={
        isNew
          ? { type: "spring", stiffness: 300, damping: 10, delay: index * 0.05 }
          : { type: "spring", stiffness: 200, damping: 20, delay: index * 0.04 }
      }
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "14px 10px",
        borderRadius: 16,
        backgroundColor: unlocked ? "#fff" : "#f5f5f5",
        border: `1.5px solid ${unlocked ? "rgba(149,117,205,0.3)" : "#eee"}`,
        minWidth: 80,
        filter: unlocked ? "none" : "grayscale(100%)",
        opacity: unlocked ? 1 : 0.45,
        position: "relative",
      }}
    >
      {isNew && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.3 }}
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            backgroundColor: "#FF6B6B",
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 99,
          }}
        >
          NEW
        </motion.div>
      )}
      <CharacterAvatar character={character} />
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: unlocked ? "#444" : "#aaa",
          textAlign: "center",
        }}
      >
        {character.name}
      </span>
      {!unlocked && character.id === SHARE_REWARD_CHARACTER_ID && (
        <span style={{ fontSize: 10, color: "#bbb" }}>공유 리워드</span>
      )}
      {!unlocked && character.id !== SHARE_REWARD_CHARACTER_ID && (
        <span style={{ fontSize: 10, color: "#bbb" }}>
          {character.requiredCount}개 달성
        </span>
      )}
    </motion.div>
  );
}
