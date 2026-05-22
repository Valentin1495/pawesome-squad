import { colors } from "@toss/tds-colors";
import {
  Badge,
  Button,
  Text,
  TextField,
  useBottomSheet,
} from "@toss/tds-mobile";
import { motion } from "framer-motion";
import { useRef } from "react";
import type { CSSProperties } from "react";
import { MAX_GOAL_TEXT_LENGTH, withAlpha, type AddPhase } from "./constants";
import { EmojiPalette } from "./EmojiPalette";

const CUSTOM_GOAL_GRID_COLUMNS = "52px minmax(0, 1fr) 58px";
const CUSTOM_GOAL_TEXT_FIELD_INPUT_STYLE = {
  color: colors.grey800,
  fontSize: 15,
  fontWeight: 700,
  lineHeight: "22px",
} as CSSProperties;

interface CustomGoalCardProps {
  addPhase: AddPhase;
  canAddCustom: boolean;
  customEmoji: string;
  customText: string;
  isChainActive: boolean;
  isCustomLaunching: boolean;
  isDuplicateCustom: boolean;
  isLaunching: boolean;
  nextCrewEmoji: string;
  nextCrewColor: string;
  onAddCustomGoal: (
    sourceElement: HTMLElement | null,
    emojiElement: HTMLElement | null,
  ) => void;
  setCustomEmoji: (emoji: string) => void;
  setCustomText: (text: string) => void;
  trimmedCustomTextLength: number;
}

export function CustomGoalCard({
  addPhase,
  canAddCustom,
  customEmoji,
  customText,
  isChainActive,
  isCustomLaunching,
  isDuplicateCustom,
  isLaunching,
  nextCrewEmoji,
  nextCrewColor,
  onAddCustomGoal,
  setCustomEmoji,
  setCustomText,
  trimmedCustomTextLength,
}: CustomGoalCardProps) {
  const { open: openBottomSheet, close: closeBottomSheet } = useBottomSheet();
  const sourceRef = useRef<HTMLDivElement | null>(null);
  const selectedEmojiRef = useRef<HTMLButtonElement | null>(null);

  const openEmojiPalette = () => {
    if (isLaunching || isChainActive) return;

    openBottomSheet({
      header: (
        <div
          style={{
            textAlign: "center",
            color: colors.grey900,
            fontSize: 20,
            fontWeight: 800,
            lineHeight: 1.35,
            padding: "0 24px",
          }}
        >
          목표 이모지 선택
        </div>
      ),
      children: (
        <EmojiPalette
          selectedEmoji={customEmoji}
          onSelectEmoji={(nextEmoji) => {
            setCustomEmoji(nextEmoji);
            closeBottomSheet();
          }}
        />
      ),
      onClose: closeBottomSheet,
    });
  };

  const submitCustomGoal = () => {
    onAddCustomGoal(sourceRef.current, selectedEmojiRef.current ?? sourceRef.current);
  };

  return (
    <motion.section
      animate={
        isLaunching
          ? { opacity: 0.28, y: -8, scale: 0.98 }
          : isChainActive
            ? { opacity: 0.72, y: -4, scale: 0.995 }
            : { opacity: 1, y: 0, scale: 1 }
      }
      style={{
        marginBottom: 16,
        perspective: 900,
        pointerEvents: isLaunching || isChainActive ? "none" : "auto",
      }}
    >
      <motion.div
        ref={sourceRef}
        initial={{ opacity: 0, y: 8, scale: 0.99 }}
        animate={
          isCustomLaunching
            ? { opacity: [1, 0.86, 0.3], y: -8, scale: [1, 1.03, 0.98] }
            : { opacity: 1, y: 0, scale: 1 }
        }
        transition={{ delay: isCustomLaunching ? 0 : 0.14, duration: 0.2, ease: "easeOut" }}
        style={{
          position: "relative",
          border: isCustomLaunching
            ? `2px solid ${nextCrewColor}`
            : `1px solid ${colors.grey200}`,
          borderLeft: `4px solid ${nextCrewColor}`,
          borderRadius: 16,
          background: isCustomLaunching
            ? `linear-gradient(135deg, ${colors.white} 0%, #f4f8ff 100%)`
            : colors.white,
          boxShadow: isCustomLaunching
            ? "0 18px 34px rgba(0,27,55,0.16)"
            : "0 8px 18px rgba(0,27,55,0.06)",
          padding: 14,
          overflow: "hidden",
        }}
      >
        {isCustomLaunching && (
          <span style={{ position: "absolute", right: 12, top: 12, zIndex: 2 }}>
            <Badge size="xsmall" color="blue" variant="fill">
              전달 중
            </Badge>
          </span>
        )}
        <Text
          typography="t5"
          fontWeight="bold"
          color={colors.grey800}
          display="block"
          style={{ margin: "0 0 4px" }}
        >
          내가 직접 쓰는 목표 카드
        </Text>
        <Text
          typography="t7"
          fontWeight="bold"
          color={nextCrewColor}
          display="block"
          style={{ marginBottom: 12 }}
        >
          담당 예정 크루 {nextCrewEmoji}
        </Text>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: CUSTOM_GOAL_GRID_COLUMNS,
            gap: 2,
            alignItems: "center",
          }}
        >
          <button
            ref={selectedEmojiRef}
            type="button"
            aria-label={`${customEmoji} 목표 이모지 선택`}
            disabled={isLaunching || isChainActive}
            onClick={openEmojiPalette}
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              border: `1px solid ${withAlpha(nextCrewColor, 0.42)}`,
              backgroundColor: withAlpha(nextCrewColor, 0.08),
              color: colors.grey900,
              fontSize: 22,
              lineHeight: 1,
              padding: 0,
              flex: "0 0 auto",
              opacity: isLaunching || isChainActive ? 0.5 : 1,
            }}
          >
            {customEmoji}
          </button>
          <div style={{ minWidth: 0 }}>
            <TextField
              variant="box"
              value={customText}
              disabled={isChainActive}
              onChange={(event) =>
                setCustomText(event.target.value.slice(0, MAX_GOAL_TEXT_LENGTH))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" && addPhase === "idle") submitCustomGoal();
              }}
              placeholder="예: 물 마시기"
              maxLength={MAX_GOAL_TEXT_LENGTH}
              paddingTop={0}
              paddingBottom={0}
              containerProps={{
                style: {
                  width: "100%",
                  opacity: isChainActive ? 0.5 : 1,
                  "--text-field-container-font-size": "15px",
                  "--text-field-container-line-height": "22px",
                  "--text-field-container-children-padding": "0 14px",
                } as CSSProperties,
              }}
              style={CUSTOM_GOAL_TEXT_FIELD_INPUT_STYLE}
            />
          </div>
          <Button
            size="medium"
            disabled={!canAddCustom || isLaunching || isChainActive}
            onClick={submitCustomGoal}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 12,
              padding: 0,
            }}
          >
            전달
          </Button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "52px minmax(0, 1fr) 58px",
            columnGap: 2,
            marginTop: 6,
            alignItems: "start",
          }}
        >
          <span />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              minWidth: 0,
              padding: "0 8px 0 14px",
            }}
          >
            <Text
              typography="t7"
              color={isDuplicateCustom ? colors.red500 : colors.grey500}
              display="block"
              style={{
                lineHeight: 1.35,
                minWidth: 0,
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {isDuplicateCustom
                ? "이미 미션에 있는 목표예요."
                : "짧고 간단한 목표부터 시작해 보세요."}
            </Text>
            <Text
              typography="t7"
              color={colors.grey500}
              display="block"
              style={{ lineHeight: 1.35, whiteSpace: "nowrap" }}
            >
              {trimmedCustomTextLength}/{MAX_GOAL_TEXT_LENGTH}
            </Text>
          </div>
          <span />
        </div>
      </motion.div>
    </motion.section>
  );
}
