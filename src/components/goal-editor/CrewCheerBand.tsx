import { colors } from "@toss/tds-colors";
import { Text } from "@toss/tds-mobile";
import { AnimatePresence, motion } from "framer-motion";
import type { CrewCharacter } from "./constants";
import { withAlpha } from "./constants";

interface CrewCheerBandProps {
  characters: CrewCharacter[];
  selectedIndex: number;
  cheerKey: number;
  onSelect: (index: number) => void;
  message: string;
  shouldReduceMotion: boolean;
}

export function CrewCheerBand({
  characters,
  selectedIndex,
  cheerKey,
  onSelect,
  message,
  shouldReduceMotion,
}: CrewCheerBandProps) {
  const selectedCharacter = characters[selectedIndex] ?? characters[0];

  if (selectedCharacter == null) {
    return null;
  }

  return (
    <section
      style={{
        backgroundColor: colors.grey50,
        padding: "12px 16px 18px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          minHeight: 44,
          borderRadius: 14,
          border: `1px solid ${withAlpha(colors.grey900, 0.1)}`,
          backgroundColor: colors.white,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 12px",
          boxSizing: "border-box",
          boxShadow: "0 6px 16px rgba(0,27,55,0.04)",
        }}
      >
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "0 0 auto",
            backgroundColor: withAlpha(selectedCharacter.bgColor, 0.16),
            fontSize: 17,
            boxShadow: `inset 0 -4px 8px ${withAlpha(selectedCharacter.bgColor, 0.12)}`,
          }}
        >
          {selectedCharacter.emoji}
        </span>
        <div
          style={{
            minWidth: 0,
            flex: 1,
            height: "2.9em",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <AnimatePresence>
            <motion.span
              key={`${selectedCharacter.id}-${cheerKey}-${message}`}
              initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: 6 }}
              transition={{ duration: 0.14 }}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Text
                typography="t7"
                color={colors.grey800}
                fontWeight="bold"
                display="block"
                style={{
                  lineHeight: 1.45,
                  whiteSpace: "normal",
                  wordBreak: "keep-all",
                  overflowWrap: "anywhere",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                }}
              >
                {message}
              </Text>
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "flex-end",
          gap: 8,
          marginTop: 24,
          paddingTop: 8,
        }}
      >
        {characters.map((character, index) => {
          const selected = selectedIndex === index;

          return (
            <button
              key={character.id}
              type="button"
              onClick={() => onSelect(index)}
              style={{
                minWidth: 0,
                flex: "1 1 0",
                border: "none",
                background: "transparent",
                padding: 0,
                color: colors.grey700,
                cursor: "pointer",
                textAlign: "center",
              }}
              aria-pressed={selected}
            >
              <motion.div
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: [0, -5, 0],
                      }
                }
                transition={{
                  duration: 2.2 + index * 0.4,
                  repeat: shouldReduceMotion ? 0 : Infinity,
                  ease: "easeInOut",
                  delay: index * 0.3,
                }}
              >
                <motion.div
                  key={
                    selected
                      ? `cheer-${selectedIndex}-${cheerKey}`
                      : `idle-${index}`
                  }
                  animate={
                    selected && !shouldReduceMotion
                      ? {
                          y: [0, -12, -12, -6, -6, 0],
                          rotate: [0, -8, 8, -4, 4, 0],
                        }
                      : undefined
                  }
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  style={{
                    width: 52,
                    height: 52,
                    margin: "0 auto 6px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: selected
                      ? `2px solid ${colors.purple500}`
                      : `1px solid ${withAlpha(colors.grey900, 0.08)}`,
                    backgroundColor: withAlpha(
                      character.bgColor,
                      selected ? 0.2 : 0.12,
                    ),
                    boxShadow: selected
                      ? `0 0 0 4px ${withAlpha(colors.purple500, 0.1)}`
                      : `inset 0 -8px 14px ${withAlpha(character.bgColor, 0.12)}`,
                    boxSizing: "border-box",
                    fontSize: 30,
                  }}
                >
                  {character.emoji}
                </motion.div>
              </motion.div>
              <Text
                typography="t7"
                color={selected ? colors.purple700 : colors.grey700}
                fontWeight="bold"
                display="block"
                style={{ lineHeight: 1.2 }}
              >
                {character.name}
              </Text>
              <span
                style={{
                  display: "block",
                  marginTop: 2,
                  color: colors.grey500,
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                {character.role}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
