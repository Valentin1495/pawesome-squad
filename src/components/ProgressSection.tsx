import { ProgressBar } from "@toss/tds-mobile";
import { motion } from "framer-motion";

interface ProgressSectionProps {
  done: number;
  total: number;
}

export function ProgressSection({ done, total }: ProgressSectionProps) {
  const ratio = total === 0 ? 0 : done / total;

  return (
    <div style={{ padding: "20px 20px 0" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 13, color: "#666", fontWeight: 600 }}>오늘의 목표</span>
        <motion.span
          key={done}
          initial={{ scale: 1.3, color: "#9575CD" }}
          animate={{ scale: 1, color: "#9575CD" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{ fontSize: 14, fontWeight: 800 }}
        >
          {done} / {total}
        </motion.span>
      </div>

      <ProgressBar progress={ratio} size="bold" color="#9575CD" animate />
    </div>
  );
}
