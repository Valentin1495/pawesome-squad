import { BottomSheet, Button } from "@toss/tds-mobile";
import { useState } from "react";
import {
  ALL_CHARACTERS,
  type Character,
  type CompletedGoalRecord,
} from "../store/useAppStore";
import { CharacterCard } from "./CharacterCard";

type DrawerTab = "goals" | "crew";

interface CollectionDrawerProps {
  open: boolean;
  onClose: () => void;
  unlockedCharacters: Character[];
  totalCompletionCount: number;
  completedGoalRecords: CompletedGoalRecord[];
}

function formatCompletedDate(value: string) {
  const completedDate = new Date(value);
  if (Number.isNaN(completedDate.getTime())) {
    return "";
  }

  return completedDate.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

export function CollectionDrawer({
  open,
  onClose,
  unlockedCharacters,
  totalCompletionCount,
  completedGoalRecords,
}: CollectionDrawerProps) {
  const [selectedTab, setSelectedTab] = useState<DrawerTab>("goals");
  const unlockedIds = new Set(
    unlockedCharacters.map((character) => character.id),
  );
  const hasGoalRecords = completedGoalRecords.length > 0;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      onDimmerClick={onClose}
      header={<BottomSheet.Header>기록 보관함</BottomSheet.Header>}
      headerDescription={
        <BottomSheet.HeaderDescription>
          누적 달성 {totalCompletionCount}개 · 응원단{" "}
          {unlockedCharacters.length}/{ALL_CHARACTERS.length}명 합류
        </BottomSheet.HeaderDescription>
      }
      maxHeight="75vh"
      expandBottomSheet
      expandBottomSheetWhenScroll
      disableChildrenDragging
    >
      <div style={{ padding: "0 20px 24px" }}>
        <div
          style={{
            display: "flex",
            padding: 4,
            borderRadius: 14,
            backgroundColor: "#f4f4f4",
            marginBottom: 16,
          }}
        >
          <TabButton
            selected={selectedTab === "goals"}
            onClick={() => setSelectedTab("goals")}
          >
            달성 목표
          </TabButton>
          <TabButton
            selected={selectedTab === "crew"}
            onClick={() => setSelectedTab("crew")}
          >
            응원단
          </TabButton>
        </div>

        {selectedTab === "goals" &&
          (hasGoalRecords ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 24,
              }}
            >
              {completedGoalRecords.map((record) => (
                <GoalRecordRow key={record.key} record={record} />
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "30px 18px",
                borderRadius: 16,
                backgroundColor: "#fafaf8",
                color: "#888",
                fontSize: 14,
                fontWeight: 700,
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              아직 달성한 목표가 없어요.
            </div>
          ))}

        {selectedTab === "crew" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              marginBottom: 24,
            }}
          >
            {ALL_CHARACTERS.map((character, index) => (
              <CharacterCard
                key={character.id}
                character={character}
                unlocked={unlockedIds.has(character.id)}
                index={index}
              />
            ))}
          </div>
        )}

        <Button onClick={onClose} style={{ width: "100%" }}>
          닫기
        </Button>
      </div>
    </BottomSheet>
  );
}

function TabButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        border: "none",
        borderRadius: 11,
        backgroundColor: selected ? "#fff" : "transparent",
        color: selected ? "#7957b8" : "#666",
        boxShadow: selected ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
        fontSize: 14,
        fontWeight: 800,
        padding: "10px 12px",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function GoalRecordRow({ record }: { record: CompletedGoalRecord }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 16,
        border: "1px solid rgba(149,117,205,0.14)",
        backgroundColor: "#fff",
        boxShadow: "0 6px 18px rgba(0,27,55,0.04)",
      }}
    >
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          backgroundColor: "rgba(149,117,205,0.1)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
          fontSize: 22,
        }}
      >
        {record.emoji}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{
            color: "#191919",
            fontSize: 15,
            fontWeight: 800,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {record.text}
        </p>
        <p
          style={{
            color: "#888",
            fontSize: 12,
            fontWeight: 700,
            margin: "3px 0 0",
          }}
        >
          마지막 달성 {formatCompletedDate(record.lastCompletedAt)}
        </p>
      </div>
      <strong
        style={{
          color: "#9575CD",
          fontSize: 15,
          whiteSpace: "nowrap",
        }}
      >
        {record.count}회
      </strong>
    </div>
  );
}
