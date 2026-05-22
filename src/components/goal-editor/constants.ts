import { colors } from "@toss/tds-colors";

export const MIN_GOALS = 3;
export const MAX_GOALS = 5;
export const MAX_GOAL_TEXT_LENGTH = 24;
export const LAUNCH_FEEDBACK_DELAY_MS = 2200;
export const CREW_COLORS = [
  colors.orange400,
  colors.blue300,
  colors.green400,
  colors.yellow400,
  colors.purple400,
  colors.red300,
  colors.teal400,
  colors.blue500,
];

export function withAlpha(hexColor: string, alpha: number) {
  const hex = hexColor.replace("#", "");
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

export type AddPhase =
  | "idle"
  | "card-exit"
  | "crew-enter"
  | "aim"
  | "goal-land"
  | "celebrate"
  | "bubble-update";

export type LaunchPhase =
  | "idle"
  | "mission-pack"
  | "layout-settle"
  | "crew-shake"
  | "countdown"
  | "crew-launch"
  | "done";

export const ADD_PHASE_DURATIONS = {
  CARD_EXIT: 1500,
  CREW_ENTER: 900,
  GOAL_LAND: 360,
  CELEBRATE: 260,
} as const;

export interface CrewCharacter {
  id: string;
  emoji: string;
  name: string;
  role: string;
  bgColor: string;
  requiredCount: number;
  messages: {
    idle: string[];
    onGoalAdd: string[];
    onReady: string[];
    onLaunch: string;
    onGoalCheck: string[];
    onAllDone: string;
  };
}

export const DEFAULT_CREW_IDS = [
  "mung",
  "yeowoobi",
  "kkumgom",
  "dalto",
  "bambi",
] as const;

export const SHARE_REWARD_CHARACTER_ID = "hamzzi";

export const ALL_CREW_CHARACTERS: CrewCharacter[] = [
  {
    id: "mung",
    emoji: "🐻",
    name: "뭉이",
    role: "격려 담당",
    bgColor: CREW_COLORS[0],
    requiredCount: 0,
    messages: {
      idle: [
        "오늘도 할 수 있어! 뭉이가 응원할게 🐻",
        "같이 해보자, 파이팅! 🔥",
        "뭉이는 늘 네 편이야 💜",
      ],
      onGoalAdd: [
        "좋아! 이 미션 완벽해 🐻",
        "한 개 추가됐다! 뭉이 두근거려 🎉",
        "오, 멋진 목표야! 같이 해보자 ✨",
      ],
      onReady: [
        "미션 다 모았어! 이제 출발하자 🚀",
        "크루 집합 완료! 뭉이 준비됐어 💜",
      ],
      onLaunch: "뭉이가 앞장설게, 다 같이 출발! 🐻🚀",
      onGoalCheck: [
        "하나 완료! 뭉이 너무 기뻐 🐻🎉",
        "잘 했어!! 이 기세로 계속 가 🔥",
        "역시 최고야, 뭉이가 자랑스러워 ✨",
      ],
      onAllDone: "세 개 다 완료?! 뭉이 너무 감동받았어 🥹🐻",
    },
  },
  {
    id: "yeowoobi",
    emoji: "🦊",
    name: "여우비",
    role: "동기부여 담당",
    bgColor: CREW_COLORS[1],
    requiredCount: 0,
    messages: {
      idle: [
        "오늘 딱 하나만 해봐, 그게 시작이야 🦊",
        "작은 것부터, 여우비가 지켜볼게 👀",
        "오늘도 네가 자랑스러워 💙",
      ],
      onGoalAdd: [
        "이 목표 좋은데? 여우비도 해볼까 🦊",
        "목표가 하나 더! 여우비 심장 두근 ✨",
        "좋아, 이 기세로 가자 💙",
      ],
      onReady: [
        "미션 준비 완료! 여우비는 이미 달릴 준비가 됐어 🦊",
        "오늘 다 해낼 수 있어, 여우비가 보장해 💙",
      ],
      onLaunch: "여우비도 같이 달릴게! 출발 🦊🚀",
      onGoalCheck: [
        "오! 하나 체크! 여우비도 덩달아 신나 🦊",
        "완료 하나 추가! 이 기세로 달려 💙",
        "잘 해냈어, 여우비가 보고 있었어 ✨",
      ],
      onAllDone: "전부 다 해냈어?! 여우비 너무 놀랐잖아 🦊🎉",
    },
  },
  {
    id: "kkumgom",
    emoji: "🐨",
    name: "꿈곰",
    role: "위로 담당",
    bgColor: CREW_COLORS[2],
    requiredCount: 0,
    messages: {
      idle: [
        "힘들 땐 잠깐 쉬어도 돼, 꿈곰이 기다릴게 🐨",
        "오늘 피곤해도 괜찮아, 조금만 💛",
        "꿈곰은 항상 여기 있어 🌙",
      ],
      onGoalAdd: [
        "잘 골랐어! 꿈곰이 같이 할게 🐨",
        "이 목표 딱이야, 무리하지 말고 💛",
        "하나 추가! 꿈곰도 응원해 🌟",
      ],
      onReady: [
        "다 모였어! 꿈곰이 뒤에서 밀어줄게 🐨",
        "준비 완료, 오늘 함께 해내자 💛",
      ],
      onLaunch: "꿈곰이 응원할게, 천천히 나아가자 🐨💛",
      onGoalCheck: [
        "잘 했어! 꿈곰도 기뻐 🐨💛",
        "피곤해도 해냈구나, 진짜 대단해 💫",
        "오늘 하루 수고했어! 🌟",
      ],
      onAllDone: "다 했어!! 오늘 진짜 최고야, 꿈곰 칭찬해 🐨💛",
    },
  },
  {
    id: "dalto",
    emoji: "🐰",
    name: "달토",
    role: "칭찬 담당",
    bgColor: CREW_COLORS[3],
    requiredCount: 0,
    messages: {
      idle: [
        "달토가 응원하고 있어! 잊지 마 🐰",
        "오늘 목표, 달토랑 같이 해 🌸",
        "넌 항상 멋진 사람이야 🩷",
      ],
      onGoalAdd: [
        "오, 이 목표 완전 좋아! 달토 기대돼 🐰",
        "목표 추가 완료! 달토 칭찬 준비 🌸",
        "잘 골랐어! 달토도 같이 할게 🩷",
      ],
      onReady: [
        "다 준비됐어! 달토 방방 뜀 🐰🩷",
        "미션 완벽해! 달토 최고 칭찬 예약 🌸",
      ],
      onLaunch: "달토가 제일 크게 응원할게! 출발 🐰🚀",
      onGoalCheck: [
        "와, 하나 완료! 달토 심장이 두근두근 🐰",
        "대단해!! 달토도 따라 할래 💪",
        "잘 한다 잘 한다~ 🌸",
      ],
      onAllDone: "전부 완료!! 달토 너무 기쁜 나머지 방방 뜀 🐰🩷",
    },
  },
  {
    id: "bambi",
    emoji: "🐥",
    name: "밤비",
    role: "리듬 담당",
    bgColor: CREW_COLORS[4],
    requiredCount: 0,
    messages: {
      idle: [
        "밤비가 박자 맞춰 응원할게 🐥",
        "한 걸음씩 가면 돼, 착착착!",
        "오늘 흐름 좋아 보여 ✨",
      ],
      onGoalAdd: [
        "새 미션 입장! 밤비가 박수 짝짝 🐥",
        "좋아, 리듬이 살아났어 🎵",
        "이 목표도 같이 데려가자!",
      ],
      onReady: [
        "박자 맞췄어! 이제 출발만 남았어 🐥",
        "준비 완료, 밤비도 두근두근!",
      ],
      onLaunch: "밤비가 박수 치면서 따라갈게 🐥🚀",
      onGoalCheck: [
        "체크 소리 좋다! 짝짝짝 🐥",
        "하나 끝! 흐름이 점점 좋아져 🎵",
        "멋져, 다음 박자도 가보자!",
      ],
      onAllDone: "전부 완료! 오늘 리듬 완전 최고였어 🐥🎉",
    },
  },
  {
    id: "nabi",
    emoji: "🐱",
    name: "나비",
    role: "집중 담당",
    bgColor: CREW_COLORS[5],
    requiredCount: 7,
    messages: {
      idle: [
        "나비가 조용히 집중 모드 켜둘게 🐱",
        "작게 시작해도 충분해.",
        "오늘의 한 칸, 같이 채워보자 🐾",
      ],
      onGoalAdd: [
        "좋은 목표야. 나비가 표시해둘게 🐱",
        "집중할 미션 하나 추가!",
        "깔끔해. 이건 해낼 수 있어.",
      ],
      onReady: [
        "미션 정리 완료. 나비도 준비됐어 🐱",
        "좋아, 오늘 집중할 것들이 모였어.",
      ],
      onLaunch: "나비가 차분히 따라갈게. 출발 🐱🚀",
      onGoalCheck: [
        "하나 완료. 집중력 좋았어 🐱",
        "잘했어, 오늘의 기록에 남겨둘게.",
        "한 칸 채웠다. 아주 좋아.",
      ],
      onAllDone: "전부 끝냈어. 나비가 조용히 크게 칭찬 중이야 🐱✨",
    },
  },
  {
    id: "podo",
    emoji: "🐼",
    name: "포도",
    role: "휴식 담당",
    bgColor: CREW_COLORS[6],
    requiredCount: 12,
    messages: {
      idle: [
        "포도랑 천천히 가자 🐼",
        "급하지 않아. 오늘 할 만큼만.",
        "작은 완료도 충분히 멋져.",
      ],
      onGoalAdd: [
        "좋아, 포도가 옆에 앉아 있을게 🐼",
        "무리 없이 해볼 만한 미션이야.",
        "하나 추가했네. 이미 잘하고 있어.",
      ],
      onReady: [
        "준비됐어. 끝나면 같이 쉬자 🐼",
        "오늘의 미션이 모였어. 천천히 가자.",
      ],
      onLaunch: "포도가 뒤에서 든든히 밀어줄게 🐼🚀",
      onGoalCheck: [
        "완료했구나. 이제 숨 한 번 쉬자 🐼",
        "잘했어, 포도가 엄지 척!",
        "한 칸 끝. 오늘 꽤 멋진데?",
      ],
      onAllDone: "다 끝냈어! 이제 포도랑 편하게 쉬자 🐼💚",
    },
  },
  {
    id: "uni",
    emoji: "🦄",
    name: "유니",
    role: "상상 담당",
    bgColor: CREW_COLORS[7],
    requiredCount: 20,
    messages: {
      idle: [
        "유니가 반짝이는 쪽으로 안내할게 🦄",
        "오늘도 의외로 멋진 일이 생길지도!",
        "작은 목표가 큰 장면을 만들 거야 ✨",
      ],
      onGoalAdd: [
        "새 미션 반짝! 유니가 좋아해 🦄",
        "이 목표, 오늘의 하이라이트 후보야.",
        "좋아. 상상보다 더 잘할 수 있어.",
      ],
      onReady: [
        "미션 준비 완료! 유니가 빛을 켰어 🦄",
        "출발하면 꽤 근사한 장면이 될 거야.",
      ],
      onLaunch: "유니가 길을 반짝이게 만들게 🦄🚀",
      onGoalCheck: [
        "하나 완료! 반짝임이 늘었어 🦄",
        "대단해, 방금 꽤 멋진 장면이었어 ✨",
        "이 기세면 오늘 엔딩 좋겠다!",
      ],
      onAllDone: "완벽한 엔딩이야! 유니가 별빛 박수 보내는 중 🦄✨",
    },
  },
  {
    id: "guri",
    emoji: "🐸",
    name: "구리",
    role: "분위기 담당",
    bgColor: CREW_COLORS[0],
    requiredCount: 30,
    messages: {
      idle: [
        "구리가 톡톡 뛰면서 응원 중이야 🐸",
        "분위기 좋아. 오늘도 한 칸 채워보자!",
        "작은 성공도 크게 축하할 준비 됐어.",
      ],
      onGoalAdd: [
        "새 목표 등장! 구리가 먼저 박수칠게 🐸",
        "좋아, 흐름이 살아났어.",
        "이 목표도 충분히 해낼 수 있어!",
      ],
      onReady: [
        "준비 완료! 구리가 응원석 잡았어 🐸",
        "오늘 분위기 괜찮은데? 가보자.",
      ],
      onLaunch: "구리가 폴짝 따라갈게 🐸🚀",
      onGoalCheck: [
        "하나 완료! 구리가 폴짝 뛰었어 🐸",
        "좋아, 분위기 더 좋아졌어!",
        "멋져. 다음 것도 가볍게 가자.",
      ],
      onAllDone: "오늘 목표 전부 완료! 구리가 축제 분위기 만드는 중 🐸🎉",
    },
  },
  {
    id: "pengu",
    emoji: "🐧",
    name: "펭수",
    role: "꾸준함 담당",
    bgColor: CREW_COLORS[1],
    requiredCount: 45,
    messages: {
      idle: [
        "펭수랑 천천히 오래 가자 🐧",
        "급하지 않아. 미끄러져도 다시 서면 돼.",
        "꾸준함은 조용히 강해져.",
      ],
      onGoalAdd: [
        "좋은 목표야. 펭수가 같이 걸을게 🐧",
        "작게 쌓이면 꽤 멀리 가.",
        "오늘도 한 걸음이면 충분해.",
      ],
      onReady: [
        "준비됐어. 펭수가 줄 맞춰 출발할게 🐧",
        "오늘 목표, 차분하게 끝내보자.",
      ],
      onLaunch: "펭수가 뒤뚱뒤뚱 따라갈게 🐧🚀",
      onGoalCheck: [
        "하나 완료! 꾸준함이 쌓였어 🐧",
        "좋아. 방금 아주 안정적이었어.",
        "천천히 가도 제대로 가고 있어.",
      ],
      onAllDone: "전부 완료! 펭수가 조용히 크게 축하해 🐧🎉",
    },
  },
  {
    id: "hoya",
    emoji: "🐯",
    name: "호야",
    role: "용기 담당",
    bgColor: CREW_COLORS[2],
    requiredCount: 60,
    messages: {
      idle: [
        "호야가 용기 한 스푼 보탤게 🐯",
        "어려워 보여도 시작하면 달라져.",
        "오늘의 너, 꽤 강해 보여.",
      ],
      onGoalAdd: [
        "좋아! 호야가 으르렁 응원할게 🐯",
        "이 목표, 해볼 만해.",
        "멋진 선택이야. 자신 있게 가자.",
      ],
      onReady: [
        "준비 완료! 호야가 앞에서 길 열게 🐯",
        "오늘은 조금 더 과감하게 가보자.",
      ],
      onLaunch: "호야가 힘차게 출발해 🐯🚀",
      onGoalCheck: [
        "하나 완료! 용기 제대로 냈어 🐯",
        "좋아, 방금 멋있었다.",
        "이 흐름이면 다음도 가능해.",
      ],
      onAllDone: "전부 완료! 호야가 크게 포효하며 축하해 🐯🎉",
    },
  },
  {
    id: "yongyong",
    emoji: "🐲",
    name: "용용",
    role: "레전드 담당",
    bgColor: CREW_COLORS[3],
    requiredCount: 80,
    messages: {
      idle: [
        "용용이 오늘의 전설을 기다리는 중 🐲",
        "작은 완료가 멋진 이야기로 남을 거야.",
        "오늘도 기록 하나 만들어볼까?",
      ],
      onGoalAdd: [
        "새 목표 확인! 용용이 불꽃 켰어 🐲",
        "이건 오늘의 명장면 후보야.",
        "좋아, 전설의 한 줄 추가!",
      ],
      onReady: [
        "준비 완료! 용용이 무대 열었어 🐲",
        "이제 멋지게 끝내기만 하면 돼.",
      ],
      onLaunch: "용용이 불꽃 길을 열게 🐲🚀",
      onGoalCheck: [
        "하나 완료! 이야기가 쌓이고 있어 🐲",
        "방금 꽤 전설적이었어.",
        "좋아, 마지막까지 멋지게 가자.",
      ],
      onAllDone: "오늘 목표 전부 완료! 용용이 전설로 기록했어 🐲✨",
    },
  },
  {
    id: SHARE_REWARD_CHARACTER_ID,
    emoji: "🐹",
    name: "햄찌",
    role: "공유 리워드 담당",
    bgColor: CREW_COLORS[4],
    requiredCount: 9999,
    messages: {
      idle: [
        "친구에게 공유하면 햄찌가 찾아와요 🐹",
        "햄찌는 공유 리워드로만 만날 수 있어요.",
        "오늘의 작은 성공을 친구에게도 살짝 보내볼까요?",
      ],
      onGoalAdd: [
        "새 목표 좋다! 햄찌가 응원할게 🐹",
        "목표가 늘었네요. 볼따구 힘내서 가보자!",
        "좋아요, 햄찌도 같이 준비할게요.",
      ],
      onReady: [
        "미션 준비 완료! 햄찌도 같이 갈게요.",
        "오늘 목표, 야무지게 끝내봐요 🐹",
      ],
      onLaunch: "햄찌가 응원을 품고 출발해요 🐹🚀",
      onGoalCheck: [
        "하나 완료! 햄찌가 박수 보내요.",
        "좋아요, 야무진 흐름이에요 🐹",
        "멋져요. 다음 목표도 가볍게!",
      ],
      onAllDone: "오늘 목표 전부 완료! 햄찌가 볼 빵빵하게 축하해요 🐹🎉",
    },
  },
];

export const CREW_CHARACTERS = ALL_CREW_CHARACTERS.filter((character) =>
  (DEFAULT_CREW_IDS as readonly string[]).includes(character.id),
);

export const CREW_EMOJIS = CREW_CHARACTERS.map((character) => character.emoji);

export function getAvailableCrewCharacters(
  unlockedCharacters: Array<{ id: string }>,
) {
  const unlockedIds = new Set<string>([
    ...DEFAULT_CREW_IDS,
    ...unlockedCharacters.map((character) => character.id),
  ]);
  return ALL_CREW_CHARACTERS.filter((character) =>
    unlockedIds.has(character.id),
  );
}

export function getAvailableCrewEmojis(
  unlockedCharacters: Array<{ id: string }>,
) {
  return getAvailableCrewCharacters(unlockedCharacters).map(
    (character) => character.emoji,
  );
}

export const EMOJI_OPTIONS = [
  "💧",
  "🚶",
  "📚",
  "🧘",
  "☀️",
  "🛌",
  "🧹",
  "🍎",
  "📝",
  "🎧",
  "🌙",
  "💪",
  "🧠",
  "🌿",
  "🎨",
  "🧺",
  "📖",
  "☕",
  "🪴",
  "🧡",
];

export type ConfettiCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export const STAGE_SPARKLES = [
  { left: "14%", top: "28%", size: 6, delay: 0 },
  { left: "78%", top: "24%", size: 5, delay: 0.1 },
  { left: "24%", top: "66%", size: 4, delay: 0.18 },
  { left: "68%", top: "70%", size: 6, delay: 0.28 },
  { left: "88%", top: "54%", size: 4, delay: 0.36 },
];

export const CONFETTI_PARTICLES: Array<{
  emoji: string;
  corner: ConfettiCorner;
  x: number;
  y: number;
  rotate: number;
}> = [
  { emoji: "🎉", corner: "top-left", x: -52, y: -86, rotate: 110 },
  { emoji: "✨", corner: "top-left", x: 24, y: -112, rotate: 260 },
  { emoji: "💜", corner: "top-left", x: -8, y: -96, rotate: 180 },
  { emoji: "🌟", corner: "top-right", x: 48, y: -92, rotate: 310 },
  { emoji: "🎊", corner: "top-right", x: -28, y: -118, rotate: 140 },
  { emoji: "💙", corner: "top-right", x: 10, y: -82, rotate: 240 },
  { emoji: "🥳", corner: "bottom-left", x: -44, y: -120, rotate: 220 },
  { emoji: "✨", corner: "bottom-left", x: 36, y: -94, rotate: 90 },
  { emoji: "🐰", corner: "bottom-left", x: 4, y: -106, rotate: 360 },
  { emoji: "🌟", corner: "bottom-right", x: 52, y: -116, rotate: 170 },
  { emoji: "✨", corner: "bottom-right", x: -36, y: -88, rotate: 280 },
  { emoji: "🦊", corner: "bottom-right", x: 14, y: -104, rotate: 120 },
];

export const LAUNCH_BOARD_TEXT = "오늘의 미션을 들고 출동해요!";

export const CHEER_LINES = [
  "목표 카드 접수 완료!",
  "좋아요, 크루가 바로 받아갈게요.",
  "미션이 추가됐어요!",
  "이 목표는 오늘 해낼 수 있을 거예요.",
  "기록 완료. 이제 응원단에게 맡겨요.",
];
