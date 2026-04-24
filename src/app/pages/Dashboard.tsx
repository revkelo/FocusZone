import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  CheckCircle,
  Circle,
  Clock,
  Coffee,
  ListTodo,
  LogOut,
  Mail,
  MessageCircle,
  Minus,
  Moon,
  PauseCircle,
  PlayCircle,
  Plus,
  RotateCcw,
  SendHorizontal,
  Target,
  Trophy,
  User,
  Users,
  Check,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { CHALLENGES } from "../lib/challenges";
import {
  GUIDED_CATEGORIES,
  getGuidedCategoryById,
  getQuickReplyForOption,
  getQuickReplyForQuestion,
} from "../lib/lumiGuidedFlow";
import { getNicknameValidationError } from "../lib/nicknamePolicy";
import { supabase } from "../lib/supabase";

interface Session {
  id: number;
  durationSeconds: number;
  completedAt: string;
}

interface CustomChallenge {
  id: number;
  title: string;
  targetSessions: number;
  points: number;
  isGroup: boolean;
  createdAt: string;
}

interface Reward {
  id: number;
  title: string;
  description: string;
  costPoints: number;
}

interface Redemption {
  id: number;
  rewardId: number;
  pointsSpent: number;
  createdAt: string;
}

interface ChallengeItem {
  id: string;
  title: string;
  points: number;
  kind: "base" | "custom";
  week: number;
  day: number;
}

interface ChallengeCatalogEntry {
  code: string;
  title: string;
  points: number;
  week: number;
  day: number;
}

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  totalPoints: number;
}

interface PomodoroRoom {
  id: number;
  name: string;
  ownerId: string;
}

interface RoomMember {
  userId: string;
  displayName: string;
  timeLeft: number;
  modeDurationSeconds: number;
  isActive: boolean;
  isPaused: boolean;
  timerMode: TimerMode;
  isDisconnected: boolean;
}

type ToastType = "success" | "error" | "info";

interface AppToast {
  id: number;
  type: ToastType;
  title: string;
  description: string;
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  pending: boolean;
}

type TimerMode = "focus" | "shortBreak" | "longBreak";
interface PomodoroSnapshot {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  timerMode: TimerMode;
  focusStreak: number;
  timeLeft: number;
  isActive: boolean;
  isPaused: boolean;
  savedAt: number;
}

const SESSION_POINTS = 10;
const MAX_CUSTOM_CHALLENGES = 10;
const MAX_CUSTOM_CHALLENGES_PER_DAY = 5;
const MAX_CHALLENGE_TITLE_LENGTH = 80;
const MAX_CHALLENGE_TARGET = 10;
const MAX_CHALLENGE_POINTS = 10;
const MAX_REWARD_TITLE_LENGTH = 80;
const MAX_REWARD_DESCRIPTION_LENGTH = 180;
const MAX_REWARD_COST = 5000;
const MAX_ROOM_NAME_LENGTH = 40;
const MAX_NUMERIC_INPUT_LENGTH = 4;
const ROOM_PRESENCE_STALE_MS = 3_000;
const DEFAULT_DAILY_REMINDER_HOUR = 18;
const DEFAULT_POMODORO_REMINDER_MINUTES = 10;
const DEFAULT_NOTIFICATION_VOLUME_UI = 100;
const NOTIFICATION_VOLUME_BOOST_FACTOR = 4;
const STREAK_WEEK_BONUS: Record<number, number> = {
  1: 5,
  2: 10,
  3: 15,
};
const LUMI_CHAT_PRESETS = [
  "/assets/chatbot/lumi-speaking-01.png",
  "/assets/chatbot/lumi-speaking-02.png",
  "/assets/chatbot/lumi-speaking-03.png",
  "/assets/chatbot/lumi-speaking-04.png",
];

const getChallengeStreakBonus = (challenge: { week?: number; day?: number }) => {
  if (!challenge.week || !challenge.day || challenge.day < 2) {
    return 0;
  }
  return STREAK_WEEK_BONUS[challenge.week] ?? 0;
};

const getCurrentStreak = (completedIds: Set<string>, baseChallenges: ChallengeItem[]) => {
  const completedDays = new Set(
    baseChallenges.filter((challenge) => completedIds.has(challenge.id)).map((challenge) => challenge.day).filter((day): day is number => typeof day === "number"),
  );
  let streak = 0;
  for (let day = 1; day <= 21; day += 1) {
    if (!completedDays.has(day)) {
      break;
    }
    streak += 1;
  }
  return streak;
};

const getLocalDateKey = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const playEventSound = (event: "pomodoro" | "reward" | "notification" | "error", volumeScale = 1) => {
  try {
    const audioContext = new window.AudioContext();
    const safeVolumeScale = Math.max(0, Math.min(3, Number(volumeScale) || 0));
    const peakGain = Math.max(0.0001, 0.16 * safeVolumeScale);
    const patterns: Record<"pomodoro" | "reward" | "notification" | "error", { freq: number; duration: number; delay: number }[]> = {
      pomodoro: [
        { freq: 880, duration: 0.16, delay: 0 },
        { freq: 1175, duration: 0.18, delay: 0.18 },
      ],
      reward: [
        { freq: 660, duration: 0.14, delay: 0 },
        { freq: 880, duration: 0.14, delay: 0.16 },
        { freq: 1320, duration: 0.2, delay: 0.32 },
      ],
      notification: [{ freq: 740, duration: 0.2, delay: 0 }],
      error: [
        { freq: 420, duration: 0.18, delay: 0 },
        { freq: 320, duration: 0.22, delay: 0.2 },
      ],
    };

    for (const note of patterns[event]) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const startAt = audioContext.currentTime + note.delay;
      const endAt = startAt + note.duration;

      oscillator.type = event === "error" ? "square" : "triangle";
      oscillator.frequency.setValueAtTime(note.freq, startAt);
      gainNode.gain.setValueAtTime(0.0001, startAt);
      gainNode.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(startAt);
      oscillator.stop(endAt);
    }
  } catch {
    // Ignore audio playback errors on restricted browsers/devices.
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const [challengeCompletionDateKeys, setChallengeCompletionDateKeys] = useState<Map<string, string>>(new Map());
  const [catalogChallenges, setCatalogChallenges] = useState<ChallengeCatalogEntry[]>([]);
  const [customChallenges, setCustomChallenges] = useState<CustomChallenge[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardTotalUsers, setLeaderboardTotalUsers] = useState(0);
  const [myLeaderboardRank, setMyLeaderboardRank] = useState<number | null>(null);
  const [rooms, setRooms] = useState<PomodoroRoom[]>([]);
  const [roomMemberCounts, setRoomMemberCounts] = useState<Record<number, number>>({});
  const [joinedRoomIds, setJoinedRoomIds] = useState<Set<number>>(new Set());
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [focusMinutes, setFocusMinutes] = useState(40);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [timerMode, setTimerMode] = useState<TimerMode>("focus");
  const [focusStreak, setFocusStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(40 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState("pomodoro");
  const [tasksSubTab, setTasksSubTab] = useState("retosGenerales");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingChallenge, setIsSavingChallenge] = useState(false);
  const [redeemingRewardId, setRedeemingRewardId] = useState<number | null>(null);
  const [isSavingReward, setIsSavingReward] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState("");
  const [newChallengeTarget, setNewChallengeTarget] = useState("5");
  const [newChallengePoints, setNewChallengePoints] = useState("10");
  const [newRewardTitle, setNewRewardTitle] = useState("");
  const [newRewardDescription, setNewRewardDescription] = useState("");
  const [newRewardCost, setNewRewardCost] = useState("60");
  const [newRoomName, setNewRoomName] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [isUpdatingNickname, setIsUpdatingNickname] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<number | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);
  const [roomSearchQuery, setRoomSearchQuery] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(true);
  const [dailyReminderHour, setDailyReminderHour] = useState(String(DEFAULT_DAILY_REMINDER_HOUR));
  const [pomodoroReminderEnabled, setPomodoroReminderEnabled] = useState(true);
  const [pomodoroReminderMinutes, setPomodoroReminderMinutes] = useState(String(DEFAULT_POMODORO_REMINDER_MINUTES));
  const [notificationVolume, setNotificationVolume] = useState(String(DEFAULT_NOTIFICATION_VOLUME_UI));
  const [lastNonZeroNotificationVolume, setLastNonZeroNotificationVolume] = useState(String(DEFAULT_NOTIFICATION_VOLUME_UI));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "Soy Lumi. Puedes explorar por opciones o escribirme directo. Si eliges varias opciones, te doy una recomendación personalizada.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [lumiSpeakingFrame, setLumiSpeakingFrame] = useState(0);
  const [chatRetryAt, setChatRetryAt] = useState<number>(0);
  const [guidedCategoryId, setGuidedCategoryId] = useState<string | null>(null);
  const [guidedOptionIds, setGuidedOptionIds] = useState<string[]>([]);
  const [isGuidedMenuOpen, setIsGuidedMenuOpen] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [toasts, setToasts] = useState<AppToast[]>([]);
  const [hydratedPomodoroKey, setHydratedPomodoroKey] = useState<string | null>(null);
  const lastToastRef = useRef<{ signature: string; at: number } | null>(null);
  const lastPomodoroReminderAtRef = useRef<number>(0);
  const lastTimerTickAtRef = useRef<number | null>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const chatScrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const ownPresenceRef = useRef({
    timeLeft: 40 * 60,
    modeDurationSeconds: 40 * 60,
    isActive: false,
    isPaused: false,
    timerMode: "focus" as TimerMode,
    displayName: "Usuario",
  });

  const pomodoroStorageKey = useMemo(() => {
    if (!userId) {
      return null;
    }
    return `focuszone:pomodoro:${userId}`;
  }, [userId]);
  const notificationSettingsStorageKey = useMemo(() => {
    if (!userId) {
      return null;
    }
    return `focuszone:notification-settings:${userId}`;
  }, [userId]);

  const getModeSeconds = (mode: TimerMode) => {
    if (mode === "focus") {
      return Math.max(1, Math.round(focusMinutes * 60));
    }
    if (mode === "shortBreak") {
      return Math.max(1, Math.round(shortBreakMinutes * 60));
    }
    return Math.max(1, Math.round(longBreakMinutes * 60));
  };

  const getModeLabel = (mode: TimerMode) => {
    if (mode === "focus") {
      return "En foco";
    }
    if (mode === "shortBreak") {
      return "Descanso corto";
    }
    return "Descanso largo";
  };
  const getMemberStatusMeta = (member: RoomMember) => {
    if (member.isDisconnected) {
      return { label: "Desconectado", badgeClassName: "bg-[#f1ebff] text-[#5b30d9]" };
    }
    if (member.timerMode === "focus") {
      return { label: "En foco", badgeClassName: "bg-[#d5fff2] text-[#00684f]" };
    }
    if (member.timerMode === "longBreak") {
      return { label: "Descanso largo", badgeClassName: "bg-[#ffe8b3] text-[#7d5a00]" };
    }
    return { label: "Descanso", badgeClassName: "bg-[#fff2cc] text-[#7d5a00]" };
  };

  const sanitizeDigitsInput = (value: string, maxLength = MAX_NUMERIC_INPUT_LENGTH) => value.replace(/\D/g, "").slice(0, maxLength);
  const normalizeInputText = (value: string) => value.replace(/\s+/g, " ").trim();
  const parseNotificationVolume = (value: unknown) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_NOTIFICATION_VOLUME_UI;
    }
    return Math.max(0, Math.min(100, parsed));
  };
  const notificationVolumeScale = (parseNotificationVolume(notificationVolume) / 100) * NOTIFICATION_VOLUME_BOOST_FACTOR;
  const isSoundEnabled = parseNotificationVolume(notificationVolume) > 0;
  const ALLOWED_TEXT_PATTERN = /^[\p{L}\p{N}\s.,:;!'"()\-_/+#&]+$/u;
  const selectedGuidedCategory = useMemo(() => (guidedCategoryId ? getGuidedCategoryById(guidedCategoryId) : null), [guidedCategoryId]);
  const renderInlineMarkdown = (value: string) => {
    const parts = value.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return (
          <strong key={`${part}-${index}`} className="font-extrabold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return (
          <strong key={`${part}-${index}`} className="font-extrabold">
            {part.slice(1, -1)}
          </strong>
        );
      }
      return <span key={`${part}-${index}`}>{part}</span>;
    });
  };
  const renderChatMessageText = (value: string) => {
    const blocks = value
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);

    return (
      <div className="space-y-2 leading-relaxed break-words [overflow-wrap:anywhere]">
        {blocks.map((block, blockIndex) => {
          const lines = block.split("\n").map((line) => line.trimEnd());
          const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
          const isListBlock = nonEmptyLines.length > 0 && nonEmptyLines.every((line) => line.trim().startsWith("- "));

          if (isListBlock) {
            return (
              <ul key={`list-${blockIndex}`} className="list-disc space-y-1 pl-5">
                {nonEmptyLines.map((line, lineIndex) => (
                  <li key={`item-${blockIndex}-${lineIndex}`}>{renderInlineMarkdown(line.trim().replace(/^- /, ""))}</li>
                ))}
              </ul>
            );
          }

          return (
            <p key={`paragraph-${blockIndex}`}>
              {lines.map((line, lineIndex) => (
                <Fragment key={`line-${blockIndex}-${lineIndex}`}>
                  {renderInlineMarkdown(line)}
                  {lineIndex < lines.length - 1 ? <br /> : null}
                </Fragment>
              ))}
            </p>
          );
        })}
      </div>
    );
  };
  const withLumiPresentation = (content: string) => {
    return content;
  };
  const activeLumiIcon = LUMI_CHAT_PRESETS[lumiSpeakingFrame] ?? LUMI_CHAT_PRESETS[0];
  const staticLumiIcon = "/assets/chatbot/lumi-speaking-01.png";
  const menuLumiIcon = "/assets/chatbot/lumi-speaking-03.png";

  useEffect(() => {
    if (activeTab !== "chatbot" || !isSendingChat) {
      setLumiSpeakingFrame(0);
      return;
    }

    const interval = window.setInterval(() => {
      setLumiSpeakingFrame((previous) => (previous + 1) % LUMI_CHAT_PRESETS.length);
    }, 260);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeTab, isSendingChat]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        navigate("/login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");
      const userNickname = (user.user_metadata.nickname as string) || (user.user_metadata.full_name as string) || user.email || "Usuario";
      setName(userNickname);
      setNicknameInput(userNickname);

      const [sessionsResult, challengesResult, catalogChallengesResult, customChallengesResult, roomsResult, membershipsResult, membersByRoomResult] = await Promise.all([
        supabase
          .from("pomodoro_sessions")
          .select("id, duration_seconds, completed_at")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false }),
        supabase.from("user_challenge_progress").select("challenge_id, created_at").eq("user_id", user.id),
        supabase.from("challenge_catalog").select("code, title, points, week, day").eq("is_active", true).order("week", { ascending: true }).order("day", { ascending: true }),
        supabase
          .from("custom_challenges")
          .select("id, title, target_sessions, points, is_group, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("pomodoro_rooms")
          .select("id, name, owner_id")
          .order("created_at", { ascending: false }),
        supabase
          .from("pomodoro_room_members")
          .select("room_id")
          .eq("user_id", user.id),
        supabase.from("pomodoro_room_members").select("room_id"),
      ]);

      if (
        sessionsResult.error ||
        challengesResult.error ||
        catalogChallengesResult.error ||
        customChallengesResult.error ||
        roomsResult.error ||
        membershipsResult.error ||
        membersByRoomResult.error
      ) {
        setError("No se pudieron cargar todos los datos del dashboard.");
      }

      if (sessionsResult.data) {
        setSessions(
          sessionsResult.data.map((item) => ({
            id: item.id,
            durationSeconds: item.duration_seconds,
            completedAt: item.completed_at,
          })),
        );
      }

      if (challengesResult.data) {
        setCompletedChallenges(new Set(challengesResult.data.map((item) => item.challenge_id)));
        setChallengeCompletionDateKeys(
          new Map(
            challengesResult.data.map((item) => [
              item.challenge_id,
              item.created_at ? getLocalDateKey(item.created_at) : "",
            ]),
          ),
        );
      }

      if (catalogChallengesResult.data) {
        setCatalogChallenges(
          catalogChallengesResult.data.map((item) => ({
            code: item.code,
            title: item.title,
            points: item.points,
            week: item.week,
            day: item.day,
          })),
        );
      }

      if (customChallengesResult.data) {
        setCustomChallenges(
          customChallengesResult.data.map((item) => ({
            id: item.id,
            title: item.title,
            targetSessions: item.target_sessions,
            points: item.points,
            isGroup: item.is_group,
            createdAt: item.created_at,
          })),
        );
      }

      if (roomsResult.data) {
        setRooms(
          roomsResult.data.map((item) => ({
            id: item.id,
            name: item.name,
            ownerId: item.owner_id,
          })),
        );
      }

      if (membersByRoomResult.data) {
        const nextCounts: Record<number, number> = {};
        for (const item of membersByRoomResult.data) {
          if (typeof item.room_id === "number") {
            nextCounts[item.room_id] = (nextCounts[item.room_id] ?? 0) + 1;
          }
        }
        setRoomMemberCounts(nextCounts);
      }

      if (membershipsResult.data) {
        const existingRoomIds = new Set((roomsResult.data ?? []).map((room) => room.id));
        const membershipRoomIds = membershipsResult.data
          .map((item) => item?.room_id)
          .filter((roomId): roomId is number => typeof roomId === "number");

        const invalidRoomIds = membershipRoomIds.filter((roomId) => !existingRoomIds.has(roomId));
        if (invalidRoomIds.length > 0) {
          await supabase.from("pomodoro_room_presence").delete().eq("user_id", user.id).in("room_id", invalidRoomIds);
          await supabase.from("pomodoro_room_members").delete().eq("user_id", user.id).in("room_id", invalidRoomIds);
        }

        const validRoomIds = membershipRoomIds.filter((roomId) => existingRoomIds.has(roomId));
        if (validRoomIds.length > 1) {
          const roomIdsToRemove = validRoomIds.slice(1);
          await supabase.from("pomodoro_room_presence").delete().eq("user_id", user.id).in("room_id", roomIdsToRemove);
          await supabase.from("pomodoro_room_members").delete().eq("user_id", user.id).in("room_id", roomIdsToRemove);
        }

        const roomId = validRoomIds[0] ?? null;
        const singleMembership = roomId ? new Set([roomId]) : new Set<number>();
        setJoinedRoomIds(singleMembership);
        setSelectedRoomId((previous) => {
          if (previous && roomId && previous === roomId) {
            return previous;
          }
          return roomId;
        });
      }

      setIsLoading(false);
    };

    void loadDashboardData();
  }, [navigate]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    const askPermission = async () => {
      let permission = window.Notification.permission;
      if (permission !== "granted") {
        permission = await window.Notification.requestPermission();
      }
      setNotificationPermission(permission);
    };

    void askPermission();
  }, []);

  useEffect(() => {
    if (!notificationSettingsStorageKey || typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(notificationSettingsStorageKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        dailyReminderEnabled: boolean;
        dailyReminderHour: number;
        pomodoroReminderEnabled: boolean;
        pomodoroReminderMinutes: number;
        notificationVolume: number;
      };

      setDailyReminderEnabled(Boolean(parsed.dailyReminderEnabled));
      setDailyReminderHour(String(Math.max(0, Math.min(23, Number(parsed.dailyReminderHour) || DEFAULT_DAILY_REMINDER_HOUR))));
      setPomodoroReminderEnabled(Boolean(parsed.pomodoroReminderEnabled));
      setPomodoroReminderMinutes(String(Math.max(1, Math.min(60, Number(parsed.pomodoroReminderMinutes) || DEFAULT_POMODORO_REMINDER_MINUTES))));
      setNotificationVolume(String(parseNotificationVolume(parsed.notificationVolume)));
    } catch {
      // Ignore invalid local settings.
    }
  }, [notificationSettingsStorageKey]);

  useEffect(() => {
    if (!notificationSettingsStorageKey || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      notificationSettingsStorageKey,
      JSON.stringify({
        dailyReminderEnabled,
        dailyReminderHour: Math.max(0, Math.min(23, Number(dailyReminderHour) || DEFAULT_DAILY_REMINDER_HOUR)),
        pomodoroReminderEnabled,
        pomodoroReminderMinutes: Math.max(1, Math.min(60, Number(pomodoroReminderMinutes) || DEFAULT_POMODORO_REMINDER_MINUTES)),
        notificationVolume: parseNotificationVolume(notificationVolume),
      }),
    );
  }, [
    notificationSettingsStorageKey,
    dailyReminderEnabled,
    dailyReminderHour,
    pomodoroReminderEnabled,
    pomodoroReminderMinutes,
    notificationVolume,
  ]);

  useEffect(() => {
    if (parseNotificationVolume(notificationVolume) > 0) {
      setLastNonZeroNotificationVolume(String(parseNotificationVolume(notificationVolume)));
    }
  }, [notificationVolume]);

  useEffect(() => {
    if (!pomodoroStorageKey || hydratedPomodoroKey === pomodoroStorageKey || typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(pomodoroStorageKey);
      if (!raw) {
        setHydratedPomodoroKey(pomodoroStorageKey);
        return;
      }

      const snapshot = JSON.parse(raw) as PomodoroSnapshot;
      const safeFocusMinutes = Math.max(1, Math.min(90, Number(snapshot.focusMinutes) || 40));
      const safeShortBreakMinutes = Math.max(1, Math.min(90, Number(snapshot.shortBreakMinutes) || 5));
      const safeLongBreakMinutes = Math.max(1, Math.min(90, Number(snapshot.longBreakMinutes) || 15));
      const safeMode: TimerMode =
        snapshot.timerMode === "focus" || snapshot.timerMode === "shortBreak" || snapshot.timerMode === "longBreak"
          ? snapshot.timerMode
          : "focus";
      const safeFocusStreak = Math.max(0, Number(snapshot.focusStreak) || 0);
      const safeSavedAt = Number(snapshot.savedAt) || Date.now();

      const fallbackSeconds =
        safeMode === "focus" ? safeFocusMinutes * 60 : safeMode === "shortBreak" ? safeShortBreakMinutes * 60 : safeLongBreakMinutes * 60;
      const storedSeconds = Math.max(0, Number(snapshot.timeLeft) || fallbackSeconds);
      const wasRunning = Boolean(snapshot.isActive) && !Boolean(snapshot.isPaused);
      const elapsedSeconds = wasRunning ? Math.max(0, Math.floor((Date.now() - safeSavedAt) / 1000)) : 0;
      const recoveredSeconds = Math.max(0, storedSeconds - elapsedSeconds);
      const didExpireWhileAway = wasRunning && recoveredSeconds === 0;
      const recoveredIsActive = wasRunning ? recoveredSeconds > 0 : Boolean(snapshot.isActive);
      const recoveredIsPaused = recoveredIsActive ? Boolean(snapshot.isPaused) : false;
      const restoredTimeLeft = didExpireWhileAway ? fallbackSeconds : recoveredSeconds;

      setFocusMinutes(safeFocusMinutes);
      setShortBreakMinutes(safeShortBreakMinutes);
      setLongBreakMinutes(safeLongBreakMinutes);
      setTimerMode(safeMode);
      setFocusStreak(safeFocusStreak);
      setTimeLeft(restoredTimeLeft);
      setIsActive(recoveredIsActive);
      setIsPaused(recoveredIsPaused);

      if (didExpireWhileAway) {
        setSuccessMessage("El pomodoro terminó mientras estabas fuera. Estado recuperado.");
      }
    } catch {
      // Ignore invalid local snapshots.
    }

    setHydratedPomodoroKey(pomodoroStorageKey);
  }, [pomodoroStorageKey, hydratedPomodoroKey]);

  useEffect(() => {
    if (!pomodoroStorageKey || hydratedPomodoroKey !== pomodoroStorageKey || typeof window === "undefined") {
      return;
    }

    const snapshot: PomodoroSnapshot = {
      focusMinutes,
      shortBreakMinutes,
      longBreakMinutes,
      timerMode,
      focusStreak,
      timeLeft,
      isActive,
      isPaused,
      savedAt: Date.now(),
    };

    window.localStorage.setItem(pomodoroStorageKey, JSON.stringify(snapshot));
  }, [
    pomodoroStorageKey,
    hydratedPomodoroKey,
    focusMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    timerMode,
    focusStreak,
    timeLeft,
    isActive,
    isPaused,
  ]);

  const removeToast = (toastId: number) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== toastId));
  };

  const toggleSoundEnabled = () => {
    if (isSoundEnabled) {
      setLastNonZeroNotificationVolume(String(Math.max(5, parseNotificationVolume(notificationVolume))));
      setNotificationVolume("0");
      return;
    }
    setNotificationVolume(lastNonZeroNotificationVolume || String(DEFAULT_NOTIFICATION_VOLUME_UI));
  };

  const pushToast = (type: ToastType, title: string, description: string) => {
    const signature = `${type}|${title}|${description || ""}`;
    const now = Date.now();
    if (lastToastRef.current && lastToastRef.current.signature === signature && now - lastToastRef.current.at < 1800) {
      return;
    }
    lastToastRef.current = { signature, at: now };

    const toastId = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((previous) => [...previous.slice(-3), { id: toastId, type, title, description }]);
    window.setTimeout(() => {
      removeToast(toastId);
    }, 4200);
  };

  const notifyUser = async (title: string, body: string, tag: string) => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }
    if (window.Notification.permission !== "granted") {
      return;
    }

    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.showNotification(title, {
            body,
            icon: "/favicon.svg",
            badge: "/favicon.svg",
            tag,
          });
          return;
        }
      }

      new window.Notification(title, {
        body,
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        tag,
      });
    } catch {
      // Ignore notification transport errors.
    }
  };

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    pushToast("success", "Listo", successMessage);
    playEventSound("notification", notificationVolumeScale);
    setSuccessMessage("");
  }, [successMessage, notificationVolumeScale]);

  useEffect(() => {
    if (!error) {
      return;
    }

    if (error.includes("Solo puedes completar 1 reto definido por d")) {
      pushToast("info", "Reto diario completado", "Hoy ya completaste tu reto definido. Mañana puedes continuar.");
      playEventSound("notification", notificationVolumeScale);
      setError("");
      return;
    }

    pushToast("error", "Ups", error);
    playEventSound("error", notificationVolumeScale);
    setError("");
  }, [error, notificationVolumeScale]);

  useEffect(() => {
    if (notificationPermission !== "granted") {
      return;
    }
    if (!pomodoroReminderEnabled) {
      return;
    }
    if (!isActive || isPaused || timeLeft <= 0) {
      return;
    }

    const reminderEveryMs = Math.max(1, Math.min(60, Number(pomodoroReminderMinutes) || DEFAULT_POMODORO_REMINDER_MINUTES)) * 60 * 1000;

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "hidden") {
        return;
      }

      const now = Date.now();
      if (now - lastPomodoroReminderAtRef.current < reminderEveryMs) {
        return;
      }
      lastPomodoroReminderAtRef.current = now;

      void notifyUser(
        "FocusZone | Pomodoro en curso",
        `${name || "Usuario"}, tu pomodoro sigue corriendo (${getModeLabel(timerMode)}).`,
        "focuszone-pomodoro-running",
      );
    }, 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [notificationPermission, pomodoroReminderEnabled, pomodoroReminderMinutes, isActive, isPaused, timeLeft, name, timerMode]);

  useEffect(() => {
    let interval: number | undefined;

    const applyElapsedTime = () => {
      const now = Date.now();
      const previousTick = lastTimerTickAtRef.current ?? now;
      const elapsedSeconds = Math.floor((now - previousTick) / 1000);

      if (elapsedSeconds <= 0) {
        return;
      }

      lastTimerTickAtRef.current = previousTick + elapsedSeconds * 1000;
      setTimeLeft((current) => Math.max(0, current - elapsedSeconds));
    };

    if (isActive && !isPaused && timeLeft > 0) {
      if (lastTimerTickAtRef.current === null) {
        lastTimerTickAtRef.current = Date.now();
      }

      interval = window.setInterval(applyElapsedTime, 500);
      const handleVisibilityChange = () => {
        if (typeof document !== "undefined" && !document.hidden) {
          applyElapsedTime();
        }
      };
      const handleWindowFocus = () => {
        applyElapsedTime();
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("focus", handleWindowFocus);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("focus", handleWindowFocus);
      };
    }

    lastTimerTickAtRef.current = null;

    if (isActive && timeLeft === 0) {
      void handleTimerComplete();
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, isPaused, timeLeft, timerMode, focusMinutes, shortBreakMinutes, longBreakMinutes]);

  useEffect(() => {
    if (isActive) {
      return;
    }

    setTimeLeft(getModeSeconds(timerMode));
  }, [timerMode, focusMinutes, shortBreakMinutes, longBreakMinutes, isActive]);

  const baseChallenges: ChallengeItem[] = useMemo(
    () =>
      (catalogChallenges.length > 0 ? catalogChallenges : CHALLENGES).map((challenge) => ({
        id: "code" in challenge ? challenge.code : challenge.id,
        title: challenge.title,
        points: challenge.points,
        kind: "base",
        week: "week" in challenge ? challenge.week : undefined,
        day: "day" in challenge ? challenge.day : undefined,
      })),
    [catalogChallenges],
  );

  const customChallengeItems: ChallengeItem[] = useMemo(
    () =>
      customChallenges.map((challenge) => ({
        id: `custom:${challenge.id}`,
        title: `${challenge.title} (${challenge.targetSessions} sesiones)`,
        points: challenge.points,
        kind: "custom",
      })),
    [customChallenges],
  );

  const allChallenges: ChallengeItem[] = useMemo(() => [...baseChallenges, ...customChallengeItems], [baseChallenges, customChallengeItems]);
  const orderedBaseChallenges = useMemo(
    () => [...baseChallenges].sort((a, b) => (a.week ?? 1) - (b.week ?? 1) || (a.day ?? 0) - (b.day ?? 0)),
    [baseChallenges],
  );
  const weeklyBaseChallenges = useMemo(() => {
    const grouped = new Map<number, ChallengeItem[]>();
    for (const challenge of baseChallenges) {
      const week = challenge.week ?? 1;
      const current = grouped.get(week) ?? [];
      current.push(challenge);
      grouped.set(week, current);
    }

    return Array.from(grouped.entries())
      .sort(([weekA], [weekB]) => weekA - weekB)
      .map(([week, items]) => ({
        week,
        items: items.sort((a, b) => (a.day ?? 0) - (b.day ?? 0)),
      }));
  }, [baseChallenges]);

  const filteredRooms = useMemo(() => {
    const query = roomSearchQuery.trim().toLowerCase();
    if (!query) {
      return rooms;
    }
    return rooms.filter((room) => room.name.toLowerCase().includes(query));
  }, [rooms, roomSearchQuery]);
  const ownedRoom = useMemo(() => rooms.find((room) => room.ownerId === userId) ?? null, [rooms, userId]);

  const challengeSummary = useMemo(() => {
    const completedCount = allChallenges.filter((challenge) => completedChallenges.has(challenge.id)).length;
    const completedBaseCount = baseChallenges.filter((challenge) => completedChallenges.has(challenge.id)).length;
    const nextBaseChallengeId = orderedBaseChallenges.find((challenge) => !completedChallenges.has(challenge.id))?.id ?? null;
    const allBaseCompleted = baseChallenges.length > 0 && completedBaseCount === baseChallenges.length;
    const todayKey = getLocalDateKey(new Date());
    const hasCompletedBaseToday = baseChallenges.some(
      (challenge) => completedChallenges.has(challenge.id) && challengeCompletionDateKeys.get(challenge.id) === todayKey,
    );
    const customCreatedToday = customChallenges.filter((challenge) => getLocalDateKey(challenge.createdAt) === todayKey).length;
    const remainingCustomCreationsToday = Math.max(0, MAX_CUSTOM_CHALLENGES_PER_DAY - customCreatedToday);
    const progressPercentage = allChallenges.length === 0 ? 0 : (completedCount / allChallenges.length) * 100;
    const challengePoints = allChallenges
      .filter((challenge) => completedChallenges.has(challenge.id))
      .reduce((sum, challenge) => sum + challenge.points, 0);
    const currentChallengeStreak = getCurrentStreak(completedChallenges, baseChallenges);
    const streakBonusPoints = baseChallenges.reduce((sum, challenge) => {
      if (!completedChallenges.has(challenge.id)) {
        return sum;
      }
      if (!challenge.day || challenge.day > currentChallengeStreak) {
        return sum;
      }
      return sum + getChallengeStreakBonus(challenge);
    }, 0);

    return {
      completedCount,
      nextBaseChallengeId,
      allBaseCompleted,
      hasCompletedBaseToday,
      remainingCustomCreationsToday,
      progressPercentage,
      challengePoints,
      currentChallengeStreak,
      streakBonusPoints,
    };
  }, [allChallenges, baseChallenges, orderedBaseChallenges, completedChallenges, challengeCompletionDateKeys, customChallenges]);

  const {
    completedCount,
    nextBaseChallengeId,
    allBaseCompleted,
    hasCompletedBaseToday,
    remainingCustomCreationsToday,
    progressPercentage,
    challengePoints,
    currentChallengeStreak,
    streakBonusPoints,
  } = challengeSummary;

  const points = sessions.length * SESSION_POINTS + challengePoints + streakBonusPoints;
  const availablePoints = points;

  useEffect(() => {
    if (!userId || notificationPermission !== "granted" || hasCompletedBaseToday || !dailyReminderEnabled) {
      return;
    }

    const reminderHour = Math.max(0, Math.min(23, Number(dailyReminderHour) || DEFAULT_DAILY_REMINDER_HOUR));

    const maybeNotifyDailyChallenge = () => {
      const now = new Date();
      const hour = now.getHours();
      if (hour < reminderHour) {
        return;
      }
      const todayKey = getLocalDateKey(now);

      const reminderKey = `focuszone:daily-challenge-reminder:${userId}:${todayKey}`;
      if (window.localStorage.getItem(reminderKey) === "1") {
        return;
      }

      window.localStorage.setItem(reminderKey, "1");
      void notifyUser(
        "FocusZone | Reto diario pendiente",
        `${name || "Usuario"}, aún tienes un reto diario por completar hoy.`,
        `focuszone-daily-challenge-${todayKey}`,
      );
    };

    maybeNotifyDailyChallenge();
    const interval = window.setInterval(maybeNotifyDailyChallenge, 15 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [userId, notificationPermission, hasCompletedBaseToday, dailyReminderEnabled, dailyReminderHour, name]);

  useEffect(() => {
    if (!userId || !name) {
      return;
    }

    const upsertOwnLeaderboard = async () => {
      await supabase.from("user_leaderboard").upsert({
        user_id: userId,
        display_name: name,
        total_points: points,
        updated_at: new Date().toISOString(),
      });
    };

    void upsertOwnLeaderboard();
  }, [userId, name, points]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;

    const refreshLeaderboard = async () => {
      const [leaderboardResult, leaderboardCountResult, leaderboardRankResult] = await Promise.all([
        supabase
          .from("user_leaderboard")
          .select("user_id, display_name, total_points")
          .order("total_points", { ascending: false })
          .order("updated_at", { ascending: true }),
        supabase.from("user_leaderboard").select("user_id", { count: "exact", head: true }),
        supabase
          .from("user_leaderboard")
          .select("user_id")
          .order("total_points", { ascending: false })
          .order("updated_at", { ascending: true }),
      ]);

      if (cancelled) {
        return;
      }

      if (leaderboardResult.data) {
        setLeaderboard(
          leaderboardResult.data.map((item) => ({
            userId: item.user_id,
            displayName: item.display_name,
            totalPoints: item.total_points,
          })),
        );
      }

      setLeaderboardTotalUsers(leaderboardCountResult.count ?? 0);

      if (leaderboardRankResult.data) {
        const rankIndex = leaderboardRankResult.data.findIndex((item) => item.user_id === userId);
        setMyLeaderboardRank(rankIndex >= 0 ? rankIndex + 1 : null);
      }
    };

    void refreshLeaderboard();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void refreshLeaderboard();
    }, 5000);

    const channel = supabase
      .channel(`leaderboard-live-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_leaderboard",
        },
        () => {
          void refreshLeaderboard();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    ownPresenceRef.current = {
      timeLeft,
      modeDurationSeconds: getModeSeconds(timerMode),
      isActive,
      isPaused,
      timerMode,
      displayName: name || email || "Usuario",
    };
  }, [timeLeft, isActive, isPaused, timerMode, name, email]);

  const pausePomodoroAndSync = async () => {
    if (!ownPresenceRef.current.isActive || ownPresenceRef.current.isPaused) {
      return;
    }

    ownPresenceRef.current = {
      ...ownPresenceRef.current,
      isPaused: true,
    };
    setIsPaused(true);

    if (!selectedRoomId || !userId) {
      return;
    }

    await supabase.from("pomodoro_room_presence").upsert({
      room_id: selectedRoomId,
      user_id: userId,
      time_left: ownPresenceRef.current.timeLeft,
      mode_duration_seconds: ownPresenceRef.current.modeDurationSeconds,
      is_active: ownPresenceRef.current.isActive,
      is_paused: true,
      timer_mode: ownPresenceRef.current.timerMode,
      updated_at: new Date().toISOString(),
    });
  };

  useEffect(() => {
    const loadRoomMembers = async () => {
      if (!selectedRoomId) {
        setRoomMembers([]);
        return;
      }

      const [membersResult, presenceResult] = await Promise.all([
        supabase
          .from("pomodoro_room_members")
          .select("user_id, display_name")
          .eq("room_id", selectedRoomId)
          .order("joined_at", { ascending: true }),
        supabase
          .from("pomodoro_room_presence")
          .select("user_id, time_left, mode_duration_seconds, is_active, is_paused, timer_mode, updated_at")
          .eq("room_id", selectedRoomId),
      ]);

      if (!membersResult.data) {
        return;
      }

      const presenceMap = new Map(
        (presenceResult.data ?? []).map((entry) => [
          entry.user_id,
          {
            timeLeft: entry.time_left,
            modeDurationSeconds: entry.mode_duration_seconds,
            isActive: entry.is_active,
            isPaused: entry.is_paused,
            timerMode: entry.timer_mode,
            updatedAt: entry.updated_at,
          },
        ]),
      );

      setRoomMembers(
        membersResult.data.map((member) => {
          if (member.user_id === userId) {
            return {
              userId: member.user_id,
              displayName: ownPresenceRef.current.displayName,
              timeLeft: ownPresenceRef.current.timeLeft,
              modeDurationSeconds: ownPresenceRef.current.modeDurationSeconds,
              isActive: ownPresenceRef.current.isActive,
              isPaused: ownPresenceRef.current.isPaused,
              timerMode: ownPresenceRef.current.timerMode,
              isDisconnected: !ownPresenceRef.current.isActive,
            };
          }

          const current = presenceMap.get(member.user_id);
          const stalePresence =
            Boolean(current?.isActive) &&
            typeof current?.updatedAt === "string" &&
            Date.now() - new Date(current.updatedAt).getTime() > ROOM_PRESENCE_STALE_MS;

          const safeTimeLeft = typeof current?.timeLeft === "number" ? Math.max(0, current.timeLeft) : getModeSeconds("focus");
          const safeIsActive = Boolean(current?.isActive);
          const safeIsPaused = stalePresence ? true : Boolean(current?.isPaused);
          const currentTimerMode = current?.timerMode;
          const safeTimerMode: TimerMode =
            currentTimerMode === "focus" || currentTimerMode === "shortBreak" || currentTimerMode === "longBreak"
              ? currentTimerMode
              : "focus";
          const safeModeDurationSeconds =
            typeof current?.modeDurationSeconds === "number"
              ? Math.max(1, current.modeDurationSeconds, safeTimeLeft)
              : Math.max(1, getModeSeconds(safeTimerMode), safeTimeLeft);
          const safeIsDisconnected = !current || stalePresence || !safeIsActive;

          return {
            userId: member.user_id,
            displayName: member.display_name,
            timeLeft: safeTimeLeft,
            modeDurationSeconds: safeModeDurationSeconds,
            isActive: safeIsActive,
            isPaused: safeIsPaused,
            timerMode: safeTimerMode,
            isDisconnected: safeIsDisconnected,
          };
        }),
      );
    };

    void loadRoomMembers();

    if (!selectedRoomId) {
      return;
    }

    const pollInterval = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void loadRoomMembers();
    }, 1000);

    const channel = supabase
      .channel(`room-live-${selectedRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pomodoro_room_presence",
          filter: `room_id=eq.${selectedRoomId}`,
        },
        () => {
          void loadRoomMembers();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pomodoro_room_members",
          filter: `room_id=eq.${selectedRoomId}`,
        },
        () => {
          void loadRoomMembers();
        },
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      void supabase.removeChannel(channel);
    };
  }, [selectedRoomId, focusMinutes, shortBreakMinutes, longBreakMinutes, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const refreshRooms = async () => {
      const [roomsResult, membershipsResult, membersByRoomResult] = await Promise.all([
        supabase.from("pomodoro_rooms").select("id, name, owner_id").order("created_at", { ascending: false }),
        supabase.from("pomodoro_room_members").select("room_id").eq("user_id", userId),
        supabase.from("pomodoro_room_members").select("room_id"),
      ]);

      if (roomsResult.data) {
        setRooms(
          roomsResult.data.map((item) => ({
            id: item.id,
            name: item.name,
            ownerId: item.owner_id,
          })),
        );
      }

      if (membersByRoomResult.data) {
        const nextCounts: Record<number, number> = {};
        for (const item of membersByRoomResult.data) {
          if (typeof item.room_id === "number") {
            nextCounts[item.room_id] = (nextCounts[item.room_id] ?? 0) + 1;
          }
        }
        setRoomMemberCounts(nextCounts);
      }

      if (membershipsResult.data) {
        const existingRoomIds = new Set((roomsResult.data ?? []).map((room) => room.id));
        const membershipRoomIds = membershipsResult.data
          .map((item) => item?.room_id)
          .filter((roomId): roomId is number => typeof roomId === "number");

        const invalidRoomIds = membershipRoomIds.filter((roomId) => !existingRoomIds.has(roomId));
        if (invalidRoomIds.length > 0) {
          await supabase.from("pomodoro_room_presence").delete().eq("user_id", userId).in("room_id", invalidRoomIds);
          await supabase.from("pomodoro_room_members").delete().eq("user_id", userId).in("room_id", invalidRoomIds);
        }

        const validRoomIds = membershipRoomIds.filter((roomId) => existingRoomIds.has(roomId));
        if (validRoomIds.length > 1) {
          const roomIdsToRemove = validRoomIds.slice(1);
          await supabase.from("pomodoro_room_presence").delete().eq("user_id", userId).in("room_id", roomIdsToRemove);
          await supabase.from("pomodoro_room_members").delete().eq("user_id", userId).in("room_id", roomIdsToRemove);
        }

        const roomId = validRoomIds[0] ?? null;
        const singleMembership = roomId ? new Set([roomId]) : new Set<number>();
        setJoinedRoomIds(singleMembership);
        setSelectedRoomId((previous) => {
          if (previous && roomId && previous === roomId) {
            return previous;
          }
          return roomId;
        });
      }
    };

    void refreshRooms();

    const roomsPollInterval = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void refreshRooms();
    }, 3000);

    const channel = supabase
      .channel(`rooms-live-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pomodoro_rooms",
        },
        () => {
          void refreshRooms();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pomodoro_room_members",
        },
        () => {
          void refreshRooms();
        },
      )
      .subscribe();

    return () => {
      clearInterval(roomsPollInterval);
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    const syncRoomPresence = async () => {
      if (!selectedRoomId || !userId) {
        return;
      }

      await supabase.from("pomodoro_room_presence").upsert({
        room_id: selectedRoomId,
        user_id: userId,
        time_left: timeLeft,
        mode_duration_seconds: getModeSeconds(timerMode),
        is_active: isActive,
        is_paused: isPaused,
        timer_mode: timerMode,
        updated_at: new Date().toISOString(),
      });
    };

    void syncRoomPresence();
  }, [selectedRoomId, userId, timeLeft, isActive, isPaused, timerMode]);

  useEffect(() => {
    if (activeTab !== "pomodoro" || !userId || !selectedRoomId || !joinedRoomIds.has(selectedRoomId)) {
      return;
    }

    setRoomMembers((previous) => {
      const ownMemberIndex = previous.findIndex((member) => member.userId === userId);

      if (ownMemberIndex === -1) {
        return [
          ...previous,
          {
            userId,
            displayName: name || email || "Usuario",
            timeLeft,
            modeDurationSeconds: getModeSeconds(timerMode),
            isActive,
            isPaused,
            timerMode,
            isDisconnected: !isActive,
          },
        ];
      }

      return previous.map((member) =>
        member.userId === userId
          ? {
              ...member,
              timeLeft,
              modeDurationSeconds: getModeSeconds(timerMode),
              isActive,
              isPaused,
              timerMode,
              isDisconnected: !isActive,
              displayName: member.displayName || name || email || "Usuario",
            }
          : member,
      );
    });
  }, [activeTab, userId, selectedRoomId, joinedRoomIds, timeLeft, isActive, isPaused, timerMode, name, email]);

  useEffect(() => {
    if (activeTab !== "pomodoro" || !selectedRoomId) {
      return;
    }

    const interval = window.setInterval(() => {
      setRoomMembers((previous) =>
        previous.map((member) => {
          if (member.userId === userId) {
            return member;
          }

          if (!member.isActive || member.isPaused || member.timeLeft <= 0) {
            return member;
          }

          return {
            ...member,
            timeLeft: Math.max(0, member.timeLeft - 1),
          };
        }),
      );
    }, 1500);

    return () => {
      clearInterval(interval);
    };
  }, [activeTab, selectedRoomId, userId]);

  const handleTimerComplete = async () => {
    if (!userId) {
      return;
    }

    const completedMode = timerMode;
    const focusDurationSeconds = getModeSeconds("focus");
    const shortDurationSeconds = getModeSeconds("shortBreak");
    const longDurationSeconds = getModeSeconds("longBreak");

    setIsActive(false);
    setIsPaused(false);

    if (completedMode === "focus") {
      const { data, error: insertError } = await supabase
        .from("pomodoro_sessions")
        .insert({
          user_id: userId,
          duration_seconds: focusDurationSeconds,
        })
        .select("id, duration_seconds, completed_at")
        .single();

      if (insertError || !data) {
        setError("No se pudo guardar la sesión.");
        return;
      }

      setSessions((previous) => [
        {
          id: data.id,
          durationSeconds: data.duration_seconds,
          completedAt: data.completed_at,
        },
        ...previous,
      ]);

      const nextFocusStreak = focusStreak + 1;
      const shouldUseLongBreak = nextFocusStreak % 4 === 0;
      const nextMode: TimerMode = shouldUseLongBreak ? "longBreak" : "shortBreak";
      setFocusStreak(nextFocusStreak);
      setTimerMode(nextMode);
      setTimeLeft(nextMode === "longBreak" ? longDurationSeconds : shortDurationSeconds);
      setSuccessMessage(`Sesión completada. +${SESSION_POINTS} puntos.`);

      void notifyUser("FocusZone | Pomodoro completado", `Sumaste +${SESSION_POINTS} puntos. Sigue así.`, "focuszone-pomodoro-complete");
      return;
    }

    setTimerMode("focus");
    setTimeLeft(focusDurationSeconds);
    setSuccessMessage(completedMode === "shortBreak" ? "Descanso corto terminado. Volvemos al foco." : "Descanso largo terminado. Volvemos al foco.");
    void notifyUser(
      "FocusZone | Descanso terminado",
      completedMode === "shortBreak" ? "Descanso corto finalizado. Volvemos al foco." : "Descanso largo finalizado. Volvemos al foco.",
      "focuszone-break-complete",
    );
  };

  const adjustDuration = (mode: TimerMode, delta: number) => {
    const applyDelta = (current: number) => Math.max(1, Math.min(90, current + delta));

    if (mode === "focus") {
      const next = applyDelta(focusMinutes);
      setFocusMinutes(next);
      if (!isActive && timerMode === "focus") {
        setTimeLeft(next * 60);
      }
      return;
    }

    if (mode === "shortBreak") {
      const next = applyDelta(shortBreakMinutes);
      setShortBreakMinutes(next);
      if (!isActive && timerMode === "shortBreak") {
        setTimeLeft(next * 60);
      }
      return;
    }

    const next = applyDelta(longBreakMinutes);
    setLongBreakMinutes(next);
    if (!isActive && timerMode === "longBreak") {
      setTimeLeft(next * 60);
    }
  };

  const switchTimerMode = (mode: TimerMode) => {
    setTimerMode(mode);
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(getModeSeconds(mode));
  };

  const toggleTimer = () => {
    if (!isActive) {
      setIsActive(true);
      setIsPaused(false);
      return;
    }

    setIsPaused((value) => !value);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(getModeSeconds(timerMode));
  };

  const toggleChallenge = async (challengeId: string) => {
    if (!userId) {
      return;
    }

    setError("");
    setSuccessMessage("");
    const isCompleted = completedChallenges.has(challengeId);
    const challenge = allChallenges.find((item) => item.id === challengeId);

    if (isCompleted) {
      const { error: deleteError } = await supabase
        .from("user_challenge_progress")
        .delete()
        .eq("user_id", userId)
        .eq("challenge_id", challengeId);

      if (deleteError) {
        setError("No se pudo desmarcar el reto.");
        return;
      }

      setCompletedChallenges((previous) => {
        const next = new Set(previous);
        next.delete(challengeId);
        return next;
      });
      setChallengeCompletionDateKeys((previous) => {
        const next = new Map(previous);
        next.delete(challengeId);
        return next;
      });
      setSuccessMessage("Reto desmarcado.");
      return;
    }

    if (challenge.kind === "base") {
      const todayKey = getLocalDateKey(new Date());
      const completedBaseToday = baseChallenges.some(
        (baseChallenge) =>
          baseChallenge.id !== challengeId &&
          completedChallenges.has(baseChallenge.id) &&
          challengeCompletionDateKeys.get(baseChallenge.id) === todayKey,
      );

      if (completedBaseToday) {
        setError("Solo puedes completar 1 reto definido por día.");
        return;
      }
    }

    const { error: insertError } = await supabase.from("user_challenge_progress").insert({
      user_id: userId,
      challenge_id: challengeId,
    });

    if (insertError) {
      setError("No se pudo actualizar el reto.");
      setSuccessMessage("");
      return;
    }

    const completedNext = new Set(completedChallenges).add(challengeId);
    const todayKey = getLocalDateKey(new Date());
    const previousStreak = getCurrentStreak(completedChallenges, baseChallenges);
    const nextStreak = getCurrentStreak(completedNext, baseChallenges);
    const completedBaseChallenge = baseChallenges.find((challenge) => challenge.id === challengeId);
    const streakBonus = completedBaseChallenge && nextStreak > previousStreak ? getChallengeStreakBonus(completedBaseChallenge) : 0;

    setCompletedChallenges(completedNext);
    setChallengeCompletionDateKeys((previous) => {
      const next = new Map(previous);
      next.set(challengeId, todayKey);
      return next;
    });
    if (streakBonus > 0) {
      setSuccessMessage(`Reto completado. +${completedBaseChallenge.points ?? 0} base y +${streakBonus} por racha.`);
      return;
    }

    setSuccessMessage("Reto marcado como completado.");
  };

  const handleCreateChallenge = async () => {
    if (!userId) {
      return;
    }

    const todayKey = getLocalDateKey(new Date());
    const title = normalizeInputText(newChallengeTitle);
    const targetSessions = Number(newChallengeTarget);
    const rewardPoints = Number(newChallengePoints);
    const createdTodayCount = customChallenges.filter((challenge) => getLocalDateKey(challenge.createdAt) === todayKey).length;
    const duplicatedChallenge = customChallenges.some(
      (challenge) => challenge.title.trim().toLowerCase() === title.toLowerCase(),
    );

    if (customChallenges.length >= MAX_CUSTOM_CHALLENGES) {
      setError(`Solo puedes crear ${MAX_CUSTOM_CHALLENGES} retos personalizados.`);
      setSuccessMessage("");
      return;
    }

    if (createdTodayCount >= MAX_CUSTOM_CHALLENGES_PER_DAY) {
      setError(`Solo puedes crear ${MAX_CUSTOM_CHALLENGES_PER_DAY} retos personalizados por día.`);
      setSuccessMessage("");
      return;
    }

    if (
      title.length < 3 ||
      title.length > MAX_CHALLENGE_TITLE_LENGTH ||
      !ALLOWED_TEXT_PATTERN.test(title) ||
      Number.isNaN(targetSessions) ||
      targetSessions < 1 ||
      targetSessions > MAX_CHALLENGE_TARGET ||
      Number.isNaN(rewardPoints) ||
      rewardPoints < 1 ||
      rewardPoints > MAX_CHALLENGE_POINTS
    ) {
      setError("Completa bien el formulario del reto personalizado.");
      setSuccessMessage("");
      return;
    }

    if (duplicatedChallenge) {
      setError("Ya tienes un reto personalizado con ese nombre.");
      setSuccessMessage("");
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsSavingChallenge(true);

    const { data, error: insertError } = await supabase
      .from("custom_challenges")
      .insert({
        user_id: userId,
        title,
        target_sessions: targetSessions,
        points: rewardPoints,
        is_group: false,
      })
      .select("id, title, target_sessions, points, is_group, created_at")
      .single();

    setIsSavingChallenge(false);

    if (insertError || !data) {
      setError("No se pudo crear el reto personalizado.");
      setSuccessMessage("");
      return;
    }

    setCustomChallenges((previous) => [
      {
        id: data.id,
        title: data.title,
        targetSessions: data.target_sessions,
        points: data.points,
        isGroup: data.is_group,
        createdAt: data.created_at,
      },
      ...previous,
    ]);

    setNewChallengeTitle("");
    setNewChallengeTarget("5");
    setNewChallengePoints("10");
    setSuccessMessage("Reto personalizado creado correctamente.");
  };

  const handleResetChallengeCycle = async () => {
    if (!userId) {
      return;
    }

    const baseChallengeIds = baseChallenges.map((challenge) => challenge.id);
    if (baseChallengeIds.length === 0) {
      return;
    }

    setError("");
    setSuccessMessage("");

    const { error: deleteError } = await supabase
      .from("user_challenge_progress")
      .delete()
      .eq("user_id", userId)
      .in("challenge_id", baseChallengeIds);

    if (deleteError) {
      setError("No se pudo reiniciar el ciclo de retos.");
      return;
    }

    setCompletedChallenges((previous) => {
      const next = new Set(previous);
      for (const challengeId of baseChallengeIds) {
        next.delete(challengeId);
      }
      return next;
    });
    setChallengeCompletionDateKeys((previous) => {
      const next = new Map(previous);
      for (const challengeId of baseChallengeIds) {
        next.delete(challengeId);
      }
      return next;
    });
    setSuccessMessage("Ciclo de 21 días reiniciado.");
  };

  const handleCreateReward = async () => {
    if (!userId) {
      return;
    }

    const title = normalizeInputText(newRewardTitle);
    const description = normalizeInputText(newRewardDescription);
    const costPoints = Number(newRewardCost);
    const duplicatedReward = rewards.some((reward) => reward.title.trim().toLowerCase() === title.toLowerCase());

    if (
      title.length < 3 ||
      title.length > MAX_REWARD_TITLE_LENGTH ||
      !ALLOWED_TEXT_PATTERN.test(title) ||
      description.length > MAX_REWARD_DESCRIPTION_LENGTH ||
      (description.length > 0 && !ALLOWED_TEXT_PATTERN.test(description)) ||
      Number.isNaN(costPoints) ||
      costPoints < 1 ||
      costPoints > MAX_REWARD_COST
    ) {
      setError("Completa bien el formulario de recompensa.");
      setSuccessMessage("");
      return;
    }

    if (duplicatedReward) {
      setError("Ya tienes una recompensa con ese nombre.");
      setSuccessMessage("");
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsSavingReward(true);

    const { data, error: insertError } = await supabase
      .from("user_rewards")
      .insert({
        user_id: userId,
        title,
        description,
        cost_points: costPoints,
      })
      .select("id, title, description, cost_points")
      .single();

    setIsSavingReward(false);

    if (insertError || !data) {
      setError("No se pudo crear la recompensa.");
      return;
    }

    setRewards((previous) => [
      {
        id: data.id,
        title: data.title,
        description: data.description,
        costPoints: data.cost_points,
      },
      ...previous,
    ]);

    setNewRewardTitle("");
    setNewRewardDescription("");
    setNewRewardCost("60");
    setSuccessMessage("Recompensa creada correctamente.");
  };

  const handleRedeemReward = async (reward: Reward) => {
    if (!userId || availablePoints < reward.costPoints) {
      setError("No tienes puntos suficientes para este canje.");
      setSuccessMessage("");
      return;
    }

    setError("");
    setSuccessMessage("");
    setRedeemingRewardId(reward.id);

    const { data, error: insertError } = await supabase
      .from("reward_redemptions")
      .insert({
        user_id: userId,
        reward_id: reward.id,
        points_spent: reward.costPoints,
      })
      .select("id, reward_id, points_spent, created_at")
      .single();

    setRedeemingRewardId(null);

    if (insertError || !data) {
      setError("No se pudo completar el canje.");
      setSuccessMessage("");
      return;
    }

    setRedemptions((previous) => [
      {
        id: data.id,
        rewardId: data.reward_id,
        pointsSpent: data.points_spent,
        createdAt: data.created_at,
      },
      ...previous,
    ]);

    setSuccessMessage(`Canje realizado: ${reward.title}.`);

    if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
      new window.Notification("FocusZone | Canje exitoso", {
        body: `Redimiste ${reward.title} por ${reward.costPoints} puntos.`,
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        tag: "focuszone-reward-redeem",
      });
    }
  };

  const handleCreateRoom = async () => {
    if (!userId) {
      return;
    }

    if (ownedRoom) {
      setError("Solo puedes ser dueño de 1 sala. Elimina tu sala actual para crear otra.");
      setSuccessMessage("");
      return;
    }

    const roomName = normalizeInputText(newRoomName);
    if (roomName.length < 3 || roomName.length > MAX_ROOM_NAME_LENGTH || !ALLOWED_TEXT_PATTERN.test(roomName)) {
      setError("El nombre de la sala debe tener al menos 3 caracteres.");
      setSuccessMessage("");
      return;
    }

    setIsCreatingRoom(true);
    setError("");
    setSuccessMessage("");

    const { data, error: insertRoomError } = await supabase
      .from("pomodoro_rooms")
      .insert({ owner_id: userId, name: roomName })
      .select("id, name, owner_id")
      .single();

    if (insertRoomError || !data) {
      setIsCreatingRoom(false);
      setError("No se pudo crear la sala.");
      return;
    }

    await supabase.from("pomodoro_room_presence").delete().eq("user_id", userId);
    await supabase.from("pomodoro_room_members").delete().eq("user_id", userId);

    const { error: memberError } = await supabase.from("pomodoro_room_members").upsert({
      room_id: data.id,
      user_id: userId,
      display_name: name || email || "Usuario",
    });

    setIsCreatingRoom(false);

    if (memberError) {
      setError("La sala se creó, pero no pudiste entrar automáticamente.");
      return;
    }

    await supabase.from("pomodoro_room_presence").upsert({
      room_id: data.id,
      user_id: userId,
      time_left: ownPresenceRef.current.timeLeft,
      mode_duration_seconds: ownPresenceRef.current.modeDurationSeconds,
      is_active: ownPresenceRef.current.isActive,
      is_paused: ownPresenceRef.current.isPaused,
      timer_mode: ownPresenceRef.current.timerMode,
      updated_at: new Date().toISOString(),
    });

    setRooms((previous) => [{ id: data.id, name: data.name, ownerId: data.owner_id }, ...previous]);
    setJoinedRoomIds(new Set([data.id]));
    setSelectedRoomId(data.id);
    setNewRoomName("");
    setSuccessMessage("Sala creada y te uniste correctamente. Solo puedes estar en una sala a la vez.");
  };

  const handleJoinRoom = async (room: PomodoroRoom) => {
    if (!userId) {
      return;
    }

    setJoiningRoomId(room.id);
    setError("");
    setSuccessMessage("");

    await supabase.from("pomodoro_room_presence").delete().eq("user_id", userId);
    await supabase.from("pomodoro_room_members").delete().eq("user_id", userId);

    const { error: joinError } = await supabase.from("pomodoro_room_members").upsert({
      room_id: room.id,
      user_id: userId,
      display_name: name || email || "Usuario",
    });

    setJoiningRoomId(null);

    if (joinError) {
      setError("No se pudo unir a la sala.");
      return;
    }

    await supabase.from("pomodoro_room_presence").upsert({
      room_id: room.id,
      user_id: userId,
      time_left: ownPresenceRef.current.timeLeft,
      mode_duration_seconds: ownPresenceRef.current.modeDurationSeconds,
      is_active: ownPresenceRef.current.isActive,
      is_paused: ownPresenceRef.current.isPaused,
      timer_mode: ownPresenceRef.current.timerMode,
      updated_at: new Date().toISOString(),
    });

    setJoinedRoomIds(new Set([room.id]));
    setSelectedRoomId(room.id);
    setSuccessMessage(`Te uniste a ${room.name}. Se salió de cualquier otra sala previa.`);
  };

  const handleLeaveRoom = async (roomId: number) => {
    if (!userId) {
      return;
    }

    await pausePomodoroAndSync();
    await supabase.from("pomodoro_room_presence").delete().eq("room_id", roomId).eq("user_id", userId);
    const { error: leaveError } = await supabase.from("pomodoro_room_members").delete().eq("room_id", roomId).eq("user_id", userId);

    if (leaveError) {
      setError("No se pudo salir de la sala.");
      return;
    }

    setJoinedRoomIds(new Set());

    setSelectedRoomId((current) => (current === roomId ? null : current));
    setSuccessMessage("Saliste de la sala. Tu pomodoro quedó en pausa.");
  };

  const handleDeleteRoom = async (room: PomodoroRoom) => {
    if (!userId) {
      return;
    }

    setDeletingRoomId(room.id);
    setError("");
    setSuccessMessage("");

    const { error: deleteError } = await supabase
      .from("pomodoro_rooms")
      .delete()
      .eq("id", room.id)
      .eq("owner_id", userId);

    setDeletingRoomId(null);

    if (deleteError) {
      setError("No se pudo eliminar la sala.");
      return;
    }

    setRooms((previous) => previous.filter((item) => item.id !== room.id));
    setRoomMembers((previous) => previous.filter((member) => member.userId !== userId));
    setJoinedRoomIds((previous) => {
      const next = new Set(previous);
      next.delete(room.id);
      return next;
    });
    setSelectedRoomId((current) => (current === room.id ? null : current));
    setSuccessMessage(`Sala "${room.name}" eliminada.`);
  };

  const handleUpdateNickname = async () => {
    const nextNickname = normalizeInputText(nicknameInput).replace(/\s+/g, "");
    const nicknameError = getNicknameValidationError(nextNickname);
    if (nicknameError) {
      setError(nicknameError);
      setSuccessMessage("");
      return;
    }

    setIsUpdatingNickname(true);
    setError("");
    setSuccessMessage("");
    try {
      const { data: existingNicknameEmail, error: existingNicknameError } = await supabase.rpc("get_email_by_nickname", {
        nickname_input: nextNickname,
      });
      if (existingNicknameError) {
        setError("No se pudo validar el nickname.");
        return;
      }
      if (existingNicknameEmail && existingNicknameEmail !== email) {
        setError("Ese nickname ya está en uso.");
        return;
      }

      const { data, error: updateError } = await supabase.auth.updateUser({
        data: {
          nickname: nextNickname,
          full_name: nextNickname,
        },
      });
      if (updateError) {
        setError("No se pudo actualizar el nickname.");
        return;
      }
      const updatedName = (data.user?.user_metadata.nickname as string) || nextNickname;
      setName(updatedName);
      setNicknameInput(updatedName);
      setSuccessMessage("Nickname actualizado correctamente.");
    } finally {
      setIsUpdatingNickname(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordInput.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      setSuccessMessage("");
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setError("Las contraseñas no coinciden.");
      setSuccessMessage("");
      return;
    }

    setIsUpdatingPassword(true);
    setError("");
    setSuccessMessage("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: passwordInput });
      if (updateError) {
        setError("No se pudo actualizar la contraseña.");
        return;
      }
      setPasswordInput("");
      setConfirmPasswordInput("");
      setSuccessMessage("Contraseña actualizada correctamente.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };
  const resetGuidedSelection = () => {
    setGuidedCategoryId(null);
    setGuidedOptionIds([]);
  };

  const sendMessageToLumi = async (message: string, userVisibleText: string) => {
    const now = Date.now();
    if (chatRetryAt > now) {
      const waitSeconds = Math.max(1, Math.ceil((chatRetryAt - now) / 1000));
      setError(`Lumi está ocupada. Espera ${waitSeconds}s e intenta de nuevo.`);
      return false;
    }

    if (!message) {
      return false;
    }

    const baseId = Date.now();
    const pendingAssistantId = baseId + 1;
    const userMessage: ChatMessage = {
      id: baseId,
      role: "user",
      text: userVisibleText || message,
    };
    const pendingAssistantMessage: ChatMessage = {
      id: pendingAssistantId,
      role: "assistant",
      text: "Lumi está escribiendo...",
      pending: true,
    };

    setChatMessages((previous) => [...previous, userMessage, pendingAssistantMessage]);
    setChatInput("");
    setIsSendingChat(true);

    try {
      const response = await fetch("/api/lumi-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const payload = (await response.json().catch(() => ({}))) as { reply: string; error: string; retryAfter: number };

      if (!response.ok || !payload.reply) {
        if (response.status === 429) {
          const retryAfterSeconds = Number(payload.retryAfter) > 0 ? Number(payload.retryAfter) : 20;
          setChatRetryAt(Date.now() + retryAfterSeconds * 1000);
          throw new Error(`Lumi está saturada. Intenta de nuevo en ${retryAfterSeconds}s.`);
        }
        throw new Error(payload.error || "No se pudo obtener respuesta.");
      }
      const cleanedReply = payload.reply.replace(/^lumi\s*[:\n-]\s*/i, "").trim();

      setChatMessages((previous) =>
        previous.map((item) =>
          item.id === pendingAssistantId
            ? {
                ...item,
                text: cleanedReply,
                pending: false,
              }
            : item,
        ),
      );
      playEventSound("notification", notificationVolumeScale);
      return true;
    } catch (chatError) {
      setChatMessages((previous) =>
        previous.map((item) =>
          item.id === pendingAssistantId
            ? {
                ...item,
                text: chatError instanceof Error ? chatError.message : "No pude responder ahora. Intenta de nuevo en unos segundos.",
                pending: false,
              }
            : item,
        ),
      );
      setError(chatError instanceof Error ? chatError.message : "No se pudo consultar a Lumi en este momento.");
      return false;
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleSendChat = async () => {
    const message = normalizeInputText(chatInput);
    if (!message) {
      return;
    }

    const quickReply = getQuickReplyForQuestion(message);
    if (quickReply) {
      const baseId = Date.now();
      setChatMessages((previous) => [
        ...previous,
        { id: baseId, role: "user", text: message },
        { id: baseId + 1, role: "assistant", text: withLumiPresentation(quickReply) },
      ]);
      setChatInput("");
      playEventSound("notification", notificationVolumeScale);
      return;
    }

    setChatInput("");
    await sendMessageToLumi(message, message);
  };

  const handleGuidedOptionSelect = (optionId: string) => {
    const selectedLabel = selectedGuidedCategory.options.find((option) => option.id === optionId)?.label || "Opción seleccionada";
    const quickReply = getQuickReplyForOption(optionId);

    setGuidedOptionIds([optionId]);

    if (!quickReply) {
      setError("No hay respuesta disponible para esta opción.");
      return;
    }

    const baseId = Date.now();
    setChatMessages((previous) => [
      ...previous,
      { id: baseId, role: "user", text: `Seleccion: ${selectedLabel}` },
      { id: baseId + 1, role: "assistant", text: withLumiPresentation(quickReply) },
    ]);
    playEventSound("notification", notificationVolumeScale);
    resetGuidedSelection();
    setIsGuidedMenuOpen(false);
  };

  useEffect(() => {
    if (activeTab !== "chatbot") {
      return;
    }
    const anchor = chatScrollAnchorRef.current;
    if (!anchor) {
      return;
    }
    anchor.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages, activeTab]);
  const handleLogout = async () => {
    await pausePomodoroAndSync();
    await supabase.auth.signOut();
    navigate("/");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const findRewardName = (rewardId: number) => {
    return rewards.find((reward) => reward.id === rewardId)?.title || "Recompensa";
  };

  const currentModeSeconds = getModeSeconds(timerMode);
  const timerProgress = Math.max(0, Math.min(100, Math.round(((currentModeSeconds - timeLeft) / currentModeSeconds) * 100)));
  if (isLoading) {
    return (
      <div className="focus-login-shell min-h-screen overflow-x-hidden">
        <div className="relative z-10 grid min-h-screen place-items-center text-xl font-bold">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="focus-login-shell min-h-screen overflow-x-hidden">
      <div className="relative z-10">
        <header className="mx-auto mt-3 flex w-[calc(100%-1rem)] max-w-[calc(72rem-2.5rem)] items-center justify-between gap-2 rounded-[1rem] border-2 border-[#9fd45a] bg-[#dff5b8]/90 px-3 py-3 shadow-[0_10px_20px_-18px_rgba(76,107,31,0.35),0_1px_0_0_rgba(159,212,90,0.9)] md:mt-3 md:w-full md:max-w-[calc(72rem-4rem)] md:gap-3 md:px-8 md:py-5">
          <div className="flex min-w-0 items-center">
            <img
              src="/assets/focuszone/logo.png"
              alt="Focus Zone"
              className="h-16 w-auto object-contain md:h-[5rem]"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="focus-cta h-9 shrink-0 rounded-xl border-2 border-[#5b30d9] bg-white/60 px-3 text-sm font-bold text-[#5b30d9] hover:bg-[#5b30d9] hover:text-white sm:h-10 sm:px-4 sm:text-base md:h-11 md:px-5"
          >
            <LogOut className="mr-2 size-4" />
            Cerrar sesión
          </Button>
        </header>

        <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(92vw,380px)] flex-col gap-3">
          {toasts.map((toast) => {
            const isError = toast.type === "error";
            const isSuccess = toast.type === "success";

            return (
              <div
                key={toast.id}
                className={`pointer-events-auto border p-4 shadow-[0_12px_30px_-16px_rgba(17,24,39,0.45)] backdrop-blur ${
                  isError
                    ? "border-[#d4183d]/35 bg-[#fff1f5]"
                    : isSuccess
                      ? "border-[#3f7f11]/30 bg-[#eefed8]"
                      : "border-[#5b30d9]/30 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
                      isError ? "bg-[#d4183d]/12 text-[#b31233]" : isSuccess ? "bg-[#4f7c0f]/15 text-[#356109]" : "bg-[#5b30d9]/12 text-[#5b30d9]"
                    }`}
                  >
                    {isError ? <X className="size-4" /> : isSuccess ? <CheckCircle className="size-4" /> : <Bell className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-extrabold ${isError ? "text-[#8e0f2a]" : isSuccess ? "text-[#2f5708]" : "text-[#4a22be]"}`}>{toast.title}</p>
                    {toast.description && <p className="mt-1 text-sm text-[#2a2a2a]/85">{toast.description}</p>}
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="rounded p-1 text-[#5b30d9]/60 transition hover:bg-[#5b30d9]/10 hover:text-[#5b30d9]"
                    aria-label="Cerrar notificación"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <main
          className={`mx-auto flex min-h-[calc(100dvh-84px)] w-full max-w-6xl flex-col px-3 py-2 ${activeTab === "chatbot" ? "pb-[4.5rem]" : "pb-24"} md:min-h-0 md:px-5 md:py-6 md:pb-10 lg:px-8 lg:py-8`}
        >

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex w-full flex-1 flex-col">
            <TabsList className="mb-6 hidden h-auto w-full flex-wrap rounded-2xl bg-[#5b30d9] p-1.5 md:flex">
              <TabsTrigger value="pomodoro" className="rounded-xl px-4 py-2 font-bold text-white data-[state=active]:bg-[#f47c0f] data-[state=active]:text-white">Pomodoro</TabsTrigger>
              <TabsTrigger value="resumen" className="rounded-xl px-4 py-2 font-bold text-white data-[state=active]:bg-[#f47c0f] data-[state=active]:text-white">Resumen</TabsTrigger>
              <TabsTrigger value="chatbot" className="rounded-xl px-4 py-2 font-bold text-white data-[state=active]:bg-[#f47c0f] data-[state=active]:text-white">Chatbot</TabsTrigger>
              <TabsTrigger value="tareas" className="rounded-xl px-4 py-2 font-bold text-white data-[state=active]:bg-[#f47c0f] data-[state=active]:text-white">Retos</TabsTrigger>
              <TabsTrigger value="cuenta" className="rounded-xl px-4 py-2 font-bold text-white data-[state=active]:bg-[#f47c0f] data-[state=active]:text-white">Cuenta</TabsTrigger>
            </TabsList>

            {activeTab === "pomodoro" && (
            <TabsContent value="pomodoro" className="focus-reveal space-y-5">
              <Card className="focus-card overflow-x-hidden rounded-[1.2rem] p-5 md:p-7">
                <div className="flex items-center gap-2">
                  <Clock className="size-5 text-[#f47c0f]" />
                  <h2 className="display-font text-5xl text-[#5b30d9]">Pomodoro</h2>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-[300px_1fr]">
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-[#5b30d9] p-3 text-white">
                      <p className="text-xs font-bold uppercase tracking-wide text-white/80">Duración de sesión</p>
                      <div className="mt-2 flex items-center justify-between">
                        <button
                          onClick={() => adjustDuration("focus", -1)}
                          className="grid size-8 place-items-center rounded-full bg-[#f47c0f] text-white"
                          aria-label="Reducir sesión"
                        >
                          <Minus className="size-4" />
                        </button>
                        <button onClick={() => switchTimerMode("focus")} className={`font-bold ${timerMode === "focus" ? "text-[#b8ee73]" : "text-white"}`}>
                          {focusMinutes} min
                        </button>
                        <button
                          onClick={() => adjustDuration("focus", 1)}
                          className="grid size-8 place-items-center rounded-full bg-[#f47c0f] text-white"
                          aria-label="Aumentar sesión"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-0 overflow-hidden rounded-xl border border-[#a88df3]/45 bg-white/70 text-xs font-bold">
                        <button onClick={() => adjustDuration("focus", -5)} className="py-1 text-[#6a46d9] transition hover:bg-[#f6f2ff]">-5 min</button>
                        <button onClick={() => adjustDuration("focus", 5)} className="border-l border-[#a88df3]/60 py-1 text-[#6a46d9] transition hover:bg-[#f6f2ff]">+5 min</button>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-[#5b30d9] p-3 text-white">
                      <p className="text-xs font-bold uppercase tracking-wide text-white/80">Duración de descanso</p>
                      <div className="mt-2 flex items-center justify-between">
                        <button onClick={() => adjustDuration("shortBreak", -1)} className="grid size-8 place-items-center rounded-full bg-[#f47c0f] text-white" aria-label="Reducir descanso corto">
                          <Minus className="size-4" />
                        </button>
                        <button onClick={() => switchTimerMode("shortBreak")} className={`font-bold ${timerMode === "shortBreak" ? "text-[#b8ee73]" : "text-white"}`}>
                          {shortBreakMinutes} min
                        </button>
                        <button onClick={() => adjustDuration("shortBreak", 1)} className="grid size-8 place-items-center rounded-full bg-[#f47c0f] text-white" aria-label="Aumentar descanso corto">
                          <Plus className="size-4" />
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-0 overflow-hidden rounded-xl border border-[#a88df3]/45 bg-white/70 text-xs font-bold">
                        <button onClick={() => adjustDuration("shortBreak", -5)} className="py-1 text-[#6a46d9] transition hover:bg-[#f6f2ff]">-5 min</button>
                        <button onClick={() => adjustDuration("shortBreak", 5)} className="border-l border-[#a88df3]/60 py-1 text-[#6a46d9] transition hover:bg-[#f6f2ff]">+5 min</button>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-[#5b30d9] p-3 text-white">
                      <p className="text-xs font-bold uppercase tracking-wide text-white/80">Duración de descanso largo</p>
                      <div className="mt-2 flex items-center justify-between">
                        <button onClick={() => adjustDuration("longBreak", -1)} className="grid size-8 place-items-center rounded-full bg-[#f47c0f] text-white" aria-label="Reducir descanso largo">
                          <Minus className="size-4" />
                        </button>
                        <button onClick={() => switchTimerMode("longBreak")} className={`font-bold ${timerMode === "longBreak" ? "text-[#b8ee73]" : "text-white"}`}>
                          {longBreakMinutes} min
                        </button>
                        <button onClick={() => adjustDuration("longBreak", 1)} className="grid size-8 place-items-center rounded-full bg-[#f47c0f] text-white" aria-label="Aumentar descanso largo">
                          <Plus className="size-4" />
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-0 overflow-hidden rounded-xl border border-[#a88df3]/45 bg-white/70 text-xs font-bold">
                        <button onClick={() => adjustDuration("longBreak", -5)} className="py-1 text-[#6a46d9] transition hover:bg-[#f6f2ff]">-5 min</button>
                        <button onClick={() => adjustDuration("longBreak", 5)} className="border-l border-[#a88df3]/60 py-1 text-[#6a46d9] transition hover:bg-[#f6f2ff]">+5 min</button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-between gap-5">
                    <div className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
                      <svg viewBox="0 0 288 288" className="absolute inset-0 size-full -rotate-90">
                        <circle cx="144" cy="144" r="118" stroke="currentColor" strokeWidth="12" fill="none" className="text-[#5b30d9]/20" />
                        <circle
                          cx="144"
                          cy="144"
                          r="118"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 118}
                          strokeDashoffset={2 * Math.PI * 118 * (1 - timerProgress / 100)}
                          className="text-[#f47c0f] transition-all duration-1000"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="text-center">
                        <p className="display-font text-7xl leading-none text-[#5b30d9] sm:text-8xl">{formatTime(timeLeft)}</p>
                        <p className="mt-1 font-bold text-[#5b30d9]/85">{isActive ? (isPaused ? "Pausado" : getModeLabel(timerMode)) : "Listo"}</p>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Ciclo {Math.min(focusStreak % 4, 3) + 1}/4</p>
                      </div>
                    </div>

                    <div className="grid w-full grid-cols-1 gap-3 sm:max-w-[360px] sm:grid-cols-2">
                      <Button
                        size="lg"
                        onClick={toggleTimer}
                        className="h-14 rounded-2xl bg-[#f47c0f] px-6 text-lg font-extrabold text-white shadow-[0_14px_30px_-16px_rgba(244,124,15,0.75)] hover:bg-[#dd6900]"
                      >
                        {!isActive || isPaused ? <><PlayCircle className="mr-2 size-5" /> {!isActive ? "Iniciar" : "Reanudar"}</> : <><PauseCircle className="mr-2 size-5" /> Pausar</>}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={resetTimer}
                        className="h-14 rounded-2xl border-2 border-[#5b30d9] bg-white text-lg font-extrabold text-[#5b30d9] hover:bg-[#f5f2ff]"
                      >
                        <RotateCcw className="mr-2 size-5" />
                        Reiniciar
                      </Button>
                    </div>

                    <div className="mt-1 grid w-full grid-cols-1 gap-2 sm:max-w-[360px] sm:grid-cols-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => switchTimerMode("focus")}
                        className={`h-10 rounded-xl border ${timerMode === "focus" ? "border-[#f47c0f]/70 bg-[#fff7ef] text-[#b05a00]" : "border-[#5b30d9]/25 bg-white/80 text-[#5b30d9]"}`}
                      >
                        <ListTodo className="mr-2 size-4" />
                        Foco
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => switchTimerMode("shortBreak")}
                        className={`h-10 rounded-xl border ${timerMode === "shortBreak" ? "border-[#f47c0f]/70 bg-[#fff7ef] text-[#b05a00]" : "border-[#5b30d9]/25 bg-white/80 text-[#5b30d9]"}`}
                      >
                        <Coffee className="mr-2 size-4" />
                        Descanso
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => switchTimerMode("longBreak")}
                        className={`h-10 rounded-xl border ${timerMode === "longBreak" ? "border-[#f47c0f]/70 bg-[#fff7ef] text-[#b05a00]" : "border-[#5b30d9]/25 bg-white/80 text-[#5b30d9]"}`}
                      >
                        <Moon className="mr-2 size-4" />
                        Largo
                      </Button>
                    </div>

                    <div className="w-full max-w-full overflow-x-auto pb-1 sm:max-w-[520px]">
                      <div className="mx-auto flex w-max items-center justify-center gap-2">
                      {(() => {
                        const completedInCycle = focusStreak % 4;
                        return (
                          <>
                            {[0, 1, 2, 3].map((index) => {
                              const isCompleted = index < completedInCycle;
                              const isCurrent = index === completedInCycle;
                              const connectorActive = index <= completedInCycle;

                              return (
                                <div key={index} className="flex items-center gap-2">
                                  <span
                                    className={`grid size-8 place-items-center rounded-full border-2 sm:size-10 ${
                                      isCompleted || isCurrent
                                        ? "border-[#f47c0f] bg-[#f47c0f] text-white"
                                        : "border-[#5b30d9] bg-[#f2f0f3] text-[#5b30d9]"
                                    }`}
                                  >
                                    <ListTodo className="size-4" />
                                  </span>
                                  {index < 3 && <span className={`h-1.5 w-8 rounded-full sm:w-14 ${connectorActive ? "bg-[#d9793e]" : "bg-[#5b30d9]/45"}`} />}
                                </div>
                              );
                            })}
                            <span
                              className={`grid size-8 place-items-center rounded-full border-2 sm:size-10 ${
                                focusStreak > 0 && focusStreak % 4 === 0
                                  ? "border-[#f47c0f] bg-[#f47c0f] text-white"
                                  : "border-[#5b30d9] bg-[#f2f0f3] text-[#5b30d9]"
                              }`}
                            >
                              <Check className="size-5" />
                            </span>
                          </>
                        );
                      })()}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <section className="grid gap-4">
                <Card className="focus-card rounded-[1.2rem] p-4 sm:p-6">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3 text-[#5b30d9]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Users className="size-5" />
                        <h3 className="display-font text-3xl sm:text-4xl">Salas Pomodoro</h3>
                      </div>
                      <p className="text-sm font-semibold text-[#5b30d9]/75">Crea una sala o únete a una existente para sincronizar pomodoros en grupo.</p>
                    </div>
                    <span className="rounded-full bg-[#5b30d9]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#5b30d9]">
                      {filteredRooms.length} resultado{filteredRooms.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mb-4 grid gap-3 md:grid-cols-2">
                    <div className="space-y-3 rounded-xl border border-[#5b30d9]/20 bg-white/70 p-3 sm:p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Crear sala</p>
                      {ownedRoom && (
                        <p className="rounded-lg bg-[#fff4ea] px-3 py-2 text-xs font-bold text-[#b05a00]">
                          Ya eres dueño de "{ownedRoom.name}". Solo puedes tener 1 sala propia.
                        </p>
                      )}
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          value={newRoomName}
                          maxLength={MAX_ROOM_NAME_LENGTH}
                          onChange={(event) => setNewRoomName(event.target.value.slice(0, MAX_ROOM_NAME_LENGTH))}
                          placeholder="Ej: Diseño nocturno"
                          className="sm:flex-1"
                        />
                        <Button disabled={isCreatingRoom || Boolean(ownedRoom)} onClick={() => void handleCreateRoom()} className="rounded-xl bg-[#5b30d9] text-white hover:bg-[#4a22be]">
                          {isCreatingRoom ? "Creando..." : "Crear sala"}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-[#5b30d9]/20 bg-white/70 p-3 sm:p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Buscar salas</p>
                      <Input
                        value={roomSearchQuery}
                        maxLength={MAX_ROOM_NAME_LENGTH}
                        onChange={(event) => setRoomSearchQuery(event.target.value.slice(0, MAX_ROOM_NAME_LENGTH))}
                        placeholder="Busca por nombre de sala"
                      />
                      <p className="text-xs font-bold text-[#5b30d9]/70">Tip: escribe una palabra clave para filtrar rápido.</p>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl border border-[#5b30d9]/20 bg-white/65 p-3 sm:p-4">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Salas disponibles</p>
                    </div>
                    {filteredRooms.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[#5b30d9]/30 bg-white/70 p-5 text-center">
                        <p className="text-sm font-bold text-[#5b30d9]">Aún no hay salas activas.</p>
                        <p className="mt-1 text-xs font-semibold text-[#5b30d9]/70">Crea la primera sala para empezar a estudiar en grupo.</p>
                      </div>
                    ) : (
                      filteredRooms.map((room) => {
                        const isJoined = joinedRoomIds.has(room.id);
                        const isSelected = selectedRoomId === room.id;
                        const isOwner = room.ownerId === userId;
                        const memberCount = roomMemberCounts[room.id] ?? 0;
                        return (
                          <div key={room.id} className={`rounded-xl border p-3 sm:p-4 ${isSelected ? "border-[#f47c0f] bg-[#fff4ea]" : "border-[#5b30d9]/20 bg-white/70"}`}>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="break-words font-bold text-[#5b30d9]">{room.name}</p>
                                <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/70">
                                  {memberCount} persona{memberCount === 1 ? "" : "s"}
                                </p>
                                {isOwner && <p className="text-xs font-bold uppercase tracking-wide text-[#f47c0f]">Eres dueño</p>}
                              </div>
                              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
                                {isJoined ? (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => setSelectedRoomId(room.id)} className="rounded-xl border-[#5b30d9] text-[#5b30d9]">
                                      Ver
                                    </Button>
                                    <Button size="sm" onClick={() => void handleLeaveRoom(room.id)} className="rounded-xl bg-[#d4183d] text-white hover:bg-[#b81234]">
                                      Salir
                                    </Button>
                                  </>
                                ) : (
                                  <Button size="sm" disabled={joiningRoomId === room.id} onClick={() => void handleJoinRoom(room)} className="rounded-xl bg-[#f47c0f] text-white hover:bg-[#dd6900]">
                                    {joiningRoomId === room.id ? "Uniendo..." : "Unirme"}
                                  </Button>
                                )}
                                {isOwner && (
                                  <Button
                                    size="sm"
                                    disabled={deletingRoomId === room.id}
                                    onClick={() => void handleDeleteRoom(room)}
                                    className="rounded-xl bg-[#5b30d9] text-white hover:bg-[#4a22be] sm:min-w-[92px]"
                                  >
                                    {deletingRoomId === room.id ? "Eliminando..." : "Eliminar"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {selectedRoomId && (
                    <div className="mt-4 rounded-xl border border-[#5b30d9]/20 bg-white/70 p-3 sm:p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Miembros en sala</p>
                        <span className="rounded-full bg-[#5b30d9]/10 px-2 py-1 text-xs font-bold text-[#5b30d9]">Vista en tiempo real</span>
                      </div>
                      {roomMembers.length === 0 ? (
                        <p className="text-sm text-[#5b30d9]/75">Cargando miembros...</p>
                      ) : (
                        <div className="grid max-h-[46vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:max-h-[52vh] sm:grid-cols-2">
                          {roomMembers.map((member) => {
                            const memberDuration = Math.max(1, member.modeDurationSeconds, member.timeLeft);
                            const normalizedDuration = Math.max(memberDuration, member.timeLeft, 1);
                            const memberProgressRaw = !member.isDisconnected
                              ? Math.max(0, Math.min(100, ((normalizedDuration - member.timeLeft) / normalizedDuration) * 100))
                              : 0;
                            const memberProgressLabel = Math.round(memberProgressRaw);
                            const statusMeta = getMemberStatusMeta(member);

                            return (
                            <div key={member.userId} className="rounded-xl border border-[#5b30d9]/20 bg-white p-3">
                              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <span className="break-all font-bold text-[#5b30d9]">{member.displayName}</span>
                                <span className={`w-fit rounded-full px-2 py-1 text-xs font-bold ${statusMeta.badgeClassName}`}>
                                  {statusMeta.label}
                                </span>
                              </div>
                              <div className="mb-1 flex items-center justify-between text-xs text-[#5b30d9]/80">
                                <span>Pomodoro</span>
                                <span>{memberProgressLabel}%</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden bg-[#5b30d9]/15">
                                <div
                                  className="h-full bg-gradient-to-r from-[#7d4cd8] via-[#5b30d9] to-[#00b6d9] transition-[width] duration-1000 ease-linear"
                                  style={{
                                    width: `${memberProgressRaw}%`,
                                  }}
                                />
                              </div>
                              <p className="mt-2 text-sm font-bold text-[#f47c0f]">
                                {!member.isDisconnected ? formatTime(member.timeLeft) : "00:00"}
                              </p>
                            </div>
                          );
                        })}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </section>
            </TabsContent>
            )}

            {activeTab === "resumen" && (
            <TabsContent value="resumen" className="focus-reveal space-y-5">
              <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                <Card className="focus-card rounded-[1.2rem] gap-3 border-2 border-[#f47c0f]/40 bg-[#f47c0f] p-4 text-white sm:p-6">
                  <p className="text-xs font-bold uppercase tracking-wider sm:text-sm">Puntos</p>
                  <p className="display-font mt-1 text-5xl sm:mt-2 sm:text-7xl">{points}</p>
                </Card>
                <Card className="focus-card rounded-[1.2rem] gap-3 p-4 sm:p-6">
                  <p className="text-xs font-bold text-[#5b30d9] sm:text-sm">Disponibles</p>
                  <p className="display-font mt-1 text-5xl text-[#5b30d9] sm:mt-2 sm:text-7xl">{availablePoints}</p>
                </Card>
                <Card className="focus-card rounded-[1.2rem] gap-3 p-4 sm:p-6">
                  <p className="text-xs font-bold text-[#5b30d9] sm:text-sm">Sesiones</p>
                  <p className="display-font mt-1 text-5xl text-[#5b30d9] sm:mt-2 sm:text-7xl">{sessions.length}</p>
                </Card>
                <Card className="focus-card rounded-[1.2rem] gap-3 bg-[#b8ee73]/45 p-4 sm:p-6">
                  <p className="text-xs font-bold text-[#325f0b] sm:text-sm">Retos</p>
                  <p className="display-font mt-1 text-5xl text-[#325f0b] sm:mt-2 sm:text-7xl">{completedCount}</p>
                </Card>
              </section>

              <Card className="focus-card rounded-[1.2rem] p-6">
                <div className="mb-3 flex items-center gap-2 text-[#5b30d9]">
                  <Trophy className="size-5" />
                  <h3 className="display-font text-4xl">Ranking</h3>
                </div>
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-[#5b30d9]/75">Aún no hay participantes.</p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry, index) => (
                      <div key={entry.userId} className="flex items-center justify-between border border-[#5b30d9]/15 bg-white/70 p-3 text-sm">
                        <span className="font-bold text-[#5b30d9]">{index + 1}. {entry.displayName}</span>
                        <span className="text-[#f47c0f]">{entry.totalPoints} pts</span>
                      </div>
                    ))}
                  </div>
                )}
                {leaderboardTotalUsers > 30 && myLeaderboardRank && myLeaderboardRank > 10 ? (
                  <div className="mt-3 border border-[#f47c0f]/35 bg-[#fff4ea] p-3 text-sm">
                    <p className="font-bold text-[#5b30d9]">
                      Tu posición actual: <span className="text-[#f47c0f]">#{myLeaderboardRank}</span> de {leaderboardTotalUsers}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#5b30d9]/75">
                      Se muestran los 10 primeros. Tu puesto global está actualizado.
                    </p>
                  </div>
                ) : null}
              </Card>
            </TabsContent>
            )}

            {activeTab === "chatbot" && (
            <TabsContent value="chatbot" className="focus-reveal flex flex-1 flex-col">
              <Card className="focus-card flex h-full flex-1 flex-col rounded-xl gap-3 px-3 pb-3 pt-3 sm:p-6 md:p-8">
                <div className="flex items-center gap-2">
                  <img
                    src="/assets/chatbot/lumi-speaking-04.png"
                    alt="Lumi hablando"
                    className="size-20 rounded-full border border-[#5b30d9]/30 object-cover object-top sm:size-24"
                    loading="lazy"
                  />
                  <h2 className="display-font text-4xl text-[#5b30d9] sm:text-5xl">Chatbot Lumi</h2>
                </div>

                <div ref={chatScrollContainerRef} className="min-h-[320px] flex-1 space-y-3 overflow-y-auto border border-[#5b30d9]/20 bg-white/70 p-3 sm:min-h-[380px] sm:p-4 lg:min-h-[460px]">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`w-fit max-w-[95%] break-words [overflow-wrap:anywhere] rounded-2xl border px-3 py-2 text-sm shadow-[0_10px_24px_-18px_rgba(17,24,39,0.65)] ${
                        message.role === "user"
                          ? "ml-auto border-[#f47c0f]/35 bg-[#fff4ea] text-[#6a3a00]"
                          : "border-[#5b30d9]/20 bg-[linear-gradient(180deg,#f6f2ff_0%,#f0e9ff_100%)] text-[#4a22be]"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide">
                        {message.role === "assistant" ? (
                          <img
                            src={message.pending ? activeLumiIcon : staticLumiIcon}
                            alt="Lumi hablando"
                            className="size-14 rounded-full border border-[#5b30d9]/25 object-cover object-top sm:size-16"
                            loading="lazy"
                          />
                        ) : null}
                        <p className="opacity-80">{message.role === "user" ? "Tu" : "Lumi"}</p>
                      </div>
                      <div className={`${message.pending ? "animate-pulse" : ""}`}>{renderChatMessageText(message.text)}</div>
                    </div>
                  ))}
                  <div className="w-full max-w-full rounded-2xl border border-[#5b30d9]/20 bg-[linear-gradient(180deg,#f6f2ff_0%,#f0e9ff_100%)] px-3 py-2 text-sm text-[#4a22be] shadow-[0_10px_24px_-18px_rgba(17,24,39,0.65)] sm:w-fit sm:max-w-[95%]">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={menuLumiIcon}
                          alt="Lumi hablando"
                          className="size-14 rounded-full border border-[#5b30d9]/25 object-cover object-top sm:size-16"
                          loading="lazy"
                        />
                        <p className="text-[11px] font-black uppercase tracking-wide opacity-80">Lumi</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsGuidedMenuOpen((previous) => !previous)}
                        className="rounded-full border border-[#5b30d9]/25 bg-white px-2.5 py-1 text-[11px] font-bold text-[#5b30d9] transition hover:bg-[#f3eeff]"
                      >
                        {isGuidedMenuOpen ? "Ocultar menú" : "Abrir menú"}
                      </button>
                    </div>

                    {!isGuidedMenuOpen ? (
                      <p className="text-sm">Menú rápido listo. Usa el botón de arriba para abrir opciones.</p>
                    ) : !selectedGuidedCategory ? (
                      <div className="space-y-2">
                        <p>¿Qué quieres explorar hoy?</p>
                        <div className="w-full overflow-hidden rounded-xl border border-[#5b30d9]/20 bg-white/85">
                          <div className="border-b border-[#5b30d9]/15 bg-[#f7f3ff] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-[#5b30d9]/70">
                            Opción
                          </div>
                          {GUIDED_CATEGORIES.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => {
                                setGuidedCategoryId(category.id);
                                setGuidedOptionIds([]);
                              }}
                              className="flex w-full items-start gap-3 border-b border-[#5b30d9]/10 px-3 py-3 text-left transition last:border-b-0 hover:bg-[#f6f2ff]"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold leading-tight text-[#2f1b73]">{category.label}</p>
                                <p className="line-clamp-2 text-xs text-[#5b30d9]/75">{category.question}</p>
                              </div>
                              <span className="mt-0.5 shrink-0 text-[#5b30d9]/50">
                                <Circle className="size-5" />
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p>{selectedGuidedCategory.question}</p>
                        <div className="w-full overflow-hidden rounded-xl border border-[#5b30d9]/20 bg-white/85">
                          <div className="border-b border-[#5b30d9]/15 bg-[#f7f3ff] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-[#5b30d9]/70">
                            Selecciona una opción
                          </div>
                          <button
                            type="button"
                            onClick={resetGuidedSelection}
                            disabled={isSendingChat}
                            className="flex w-full items-start gap-3 border-b border-[#5b30d9]/10 px-3 py-3 text-left transition hover:bg-[#f6f2ff] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-[#2f1b73]">Cambiar categoría</p>
                              <p className="line-clamp-2 text-xs text-[#5b30d9]/75">Volver al menú principal de opciones.</p>
                            </div>
                            <span className="mt-0.5 shrink-0 text-[#5b30d9]/50">
                              <RotateCcw className="size-5" />
                            </span>
                          </button>
                          {selectedGuidedCategory.options.map((option) => {
                            const selected = guidedOptionIds.includes(option.id);
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => handleGuidedOptionSelect(option.id)}
                                className={`flex w-full items-start gap-3 border-b border-[#5b30d9]/10 px-3 py-3 text-left transition last:border-b-0 ${
                                  selected ? "bg-[#fff4ea]" : "hover:bg-[#f6f2ff]"
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className={`truncate text-sm ${selected ? "font-black text-[#6a3a00]" : "font-bold text-[#2f1b73]"}`}>{option.label}</p>
                                  <p className={`line-clamp-2 text-xs ${selected ? "text-[#8a4f00]/85" : "text-[#5b30d9]/75"}`}>{option.quickReply}</p>
                                </div>
                                <span className={`mt-0.5 shrink-0 ${selected ? "text-[#f47c0f]" : "text-[#5b30d9]/50"}`}>
                                  {selected ? <CheckCircle className="size-5" /> : <Circle className="size-5" />}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={chatScrollAnchorRef} />
                </div>

                <div className="border border-[#5b30d9]/25 bg-white px-3 py-2">
                  <div className="flex items-center gap-2 border-b border-[#5b30d9]/20 pb-1">
                    <Circle className="size-4 text-[#5b30d9]/45" />
                    <input
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleSendChat();
                        }
                      }}
                      placeholder="Escribe tu mensaje o agrega un contexto para la recomendación"
                      className="h-8 flex-1 bg-transparent text-sm text-[#2a2a2a] outline-none placeholder:text-[#5b30d9]/35"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={isSendingChat ? "Enviando mensaje" : "Enviar mensaje"}
                      disabled={isSendingChat || !normalizeInputText(chatInput)}
                      onClick={() => void handleSendChat()}
                      className="size-8 rounded-xl text-[#5b30d9] hover:bg-[#5b30d9]/10 hover:text-[#4a22be]"
                    >
                      <SendHorizontal className={`${isSendingChat ? "animate-pulse" : ""} size-4`} />
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
            )}
            {activeTab === "tareas" && (
            <TabsContent value="tareas" className="focus-reveal">
              <Card className="focus-card rounded-[1.2rem] p-7 md:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="display-font text-5xl text-[#5b30d9]">Retos</h2>
                  <div className="focus-tag">{completedCount}/{allChallenges.length || 1}</div>
                </div>

                <Tabs value={tasksSubTab} onValueChange={setTasksSubTab} className="w-full">
                  <TabsList className="mb-6 grid h-auto w-full grid-cols-2 rounded-xl bg-[#5b30d9] p-1">
                    <TabsTrigger value="retosGenerales" className="rounded-xl font-bold text-white data-[state=active]:bg-[#f47c0f] data-[state=active]:text-white">
                      Retos generales
                    </TabsTrigger>
                    <TabsTrigger value="misRetos" className="rounded-xl font-bold text-white data-[state=active]:bg-[#f47c0f] data-[state=active]:text-white">
                      Mis retos
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="misRetos" className="space-y-6">
                    <div className="space-y-3 border border-[#5b30d9]/20 bg-white/70 p-4">
                      <p className="font-bold text-[#5b30d9]">Crear reto personalizado</p>
                      <p className="text-xs font-bold text-[#5b30d9]/75">
                        Máximo {MAX_CUSTOM_CHALLENGES_PER_DAY} por día. Hoy puedes crear {remainingCustomCreationsToday}.
                      </p>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Nombre del reto</p>
                      <Input
                        value={newChallengeTitle}
                        maxLength={MAX_CHALLENGE_TITLE_LENGTH}
                        onChange={(event) => setNewChallengeTitle(event.target.value.slice(0, MAX_CHALLENGE_TITLE_LENGTH))}
                        placeholder="Ej: Completa 5 sesiones de bocetos"
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Meta de sesiones</p>
                          <Input
                            type="number"
                            min={1}
                            max={MAX_CHALLENGE_TARGET}
                            inputMode="numeric"
                            value={newChallengeTarget}
                            onChange={(event) => setNewChallengeTarget(sanitizeDigitsInput(event.target.value, 2))}
                            placeholder="5"
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Puntos</p>
                          <Input
                            type="number"
                            min={1}
                            max={MAX_CHALLENGE_POINTS}
                            inputMode="numeric"
                            value={newChallengePoints}
                            onChange={(event) => setNewChallengePoints(sanitizeDigitsInput(event.target.value, 3))}
                            placeholder="10"
                          />
                          <p className="text-[11px] font-bold text-[#5b30d9]/70">Maximo {MAX_CHALLENGE_POINTS} puntos.</p>
                        </div>
                      </div>
                      <Button
                        disabled={isSavingChallenge || remainingCustomCreationsToday === 0}
                        onClick={() => void handleCreateChallenge()}
                        className="rounded-xl bg-[#5b30d9] text-white hover:bg-[#4a22be]"
                      >
                        {isSavingChallenge ? "Guardando..." : "Crear reto"}
                      </Button>
                    </div>

                    {customChallengeItems.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-[#5b30d9]/20 pb-2">
                          <h3 className="font-bold uppercase tracking-wide text-[#5b30d9]">Mis retos personalizados</h3>
                        </div>
                        {customChallengeItems.map((challenge) => {
                          const done = completedChallenges.has(challenge.id);
                          return (
                            <button
                              key={challenge.id}
                              onClick={() => void toggleChallenge(challenge.id)}
                              className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                                done ? "border-[#4f7c0f]/40 bg-[#b8ee73]/35" : "border-[#5b30d9]/20 bg-white/70 hover:bg-white"
                              }`}
                            >
                              {done ? <CheckCircle className="size-5 shrink-0 text-[#4f7c0f]" /> : <Circle className="size-5 shrink-0 text-[#7d4cd8]" />}
                              <span className={`flex-1 font-bold ${done ? "text-[#325f0b]" : "text-[#5b30d9]"}`}>{challenge.title}</span>
                              <span className="font-bold text-[#f47c0f]">+{challenge.points}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="retosGenerales" className="space-y-6">
                    <div className="sticky top-0 z-10 space-y-3 bg-[#f2f0f3] pb-2">
                      <Progress value={progressPercentage} className="h-3 rounded-xl bg-[#5b30d9]/20 [&>div]:rounded-xl [&>div]:bg-[#f47c0f]" />
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-[#5b30d9]/25 bg-white/70 p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/70">Racha actual</p>
                          <p className="display-font mt-1 text-4xl text-[#5b30d9]">{currentChallengeStreak} días</p>
                        </div>
                        <div className="rounded-xl border border-[#f47c0f]/30 bg-[#fff4ea] p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#f47c0f]/80">Bono por racha</p>
                          <p className="display-font mt-1 text-4xl text-[#f47c0f]">+{streakBonusPoints}</p>
                        </div>
                        <div className="rounded-xl border border-[#4f7c0f]/25 bg-[#eff9db] p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#4f7c0f]/80">Estado</p>
                          <p className="mt-2 font-bold text-[#325f0b]">{currentChallengeStreak > 0 ? "Vas en racha" : "Inicia tu racha"}</p>
                        </div>
                      </div>
                    </div>

                    {weeklyBaseChallenges.map((weekGroup) => (
                      <div key={weekGroup.week} className="space-y-3">
                        <div className="flex items-center justify-between border-b border-[#5b30d9]/20 pb-2">
                          <h3 className="font-bold uppercase tracking-wide text-[#5b30d9]">Semana {weekGroup.week}</h3>
                          <span className="text-xs font-bold text-[#5b30d9]/70">
                            +{STREAK_WEEK_BONUS[weekGroup.week] ?? 0} por reto en racha
                          </span>
                        </div>
                        {weekGroup.items.map((challenge) => {
                          const done = completedChallenges.has(challenge.id);
                          const streakBonus = getChallengeStreakBonus(challenge);
                          const bonusActive = Boolean(challenge.day && challenge.day <= currentChallengeStreak && streakBonus > 0);

                          return (
                            <button
                              key={challenge.id}
                              onClick={() => void toggleChallenge(challenge.id)}
                              className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                                done
                                  ? "border-[#4f7c0f]/40 bg-[#b8ee73]/35"
                                  : challenge.id === nextBaseChallengeId
                                    ? "border-[#5b30d9]/25 bg-white"
                                    : "border-[#c8c2d8] bg-[#efedf4]"
                              }`}
                            >
                              {done ? <CheckCircle className="size-5 shrink-0 text-[#4f7c0f]" /> : <Circle className="size-5 shrink-0 text-[#7d4cd8]" />}
                              <span className={`flex-1 font-bold ${done ? "text-[#325f0b]" : "text-[#5b30d9]"}`}>
                                Día {challenge.day}: {challenge.title}
                              </span>
                              <div className="text-right">
                                <p className="font-bold text-[#f47c0f]">+{challenge.points}</p>
                                {streakBonus > 0 && (
                                  <p className={`text-xs font-bold ${bonusActive ? "text-[#4f7c0f]" : "text-[#5b30d9]/60"}`}>
                                    {bonusActive ? `+${streakBonus} racha` : `+${streakBonus} posible`}
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                    {allBaseCompleted && (
                      <div className="border border-[#f47c0f]/35 bg-[#fff4ea] p-4">
                        <p className="font-bold text-[#b05a00]">Completaste los 21 retos del ciclo.</p>
                        <p className="mt-1 text-sm text-[#b05a00]/85">Puedes reiniciar para empezar un nuevo ciclo de 21 días.</p>
                        <Button onClick={() => void handleResetChallengeCycle()} className="mt-3 rounded-xl bg-[#f47c0f] text-white hover:bg-[#dd6900]">
                          Reiniciar ciclo de 21 días
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </Card>
            </TabsContent>
            )}

            {activeTab === "cuenta" && (
            <TabsContent value="cuenta" className="focus-reveal">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="focus-card rounded-[1.2rem] p-6">
                  <h2 className="display-font text-5xl text-[#5b30d9]">Cuenta</h2>
                  <div className="mt-5 space-y-4">
                    <div className="flex items-center gap-3 text-[#5b30d9]">
                      <User className="size-5" />
                      <span className="font-bold">{name || "Usuario"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#5b30d9]">
                      <Mail className="size-5" />
                      <span className="font-bold">{email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#5b30d9]">
                      <Target className="size-5" />
                      <span className="font-bold">ID: {userId.slice(0, 8)}...</span>
                    </div>
                    <div className="border border-[#5b30d9]/20 bg-white/70 p-3">
                      <div className="mb-3 flex items-center gap-2 text-[#5b30d9]">
                        <Bell className="size-4" />
                        <span className="font-bold">Sonidos y notificaciones</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={isSoundEnabled ? "default" : "outline"}
                          onClick={toggleSoundEnabled}
                          className={isSoundEnabled ? "rounded-xl bg-[#f47c0f] text-white hover:bg-[#dd6900]" : "rounded-xl border-[#5b30d9] text-[#5b30d9]"}
                        >
                          Sonido: {isSoundEnabled ? "ON" : "OFF"}
                        </Button>
                      </div>
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Volumen notificación</p>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={1}
                            max={100}
                            step={1}
                            value={notificationVolume}
                            onChange={(event) => setNotificationVolume(String(parseNotificationVolume(event.target.value)))}
                            className="focus-volume-slider w-full"
                          />
                          <span className="w-12 text-right text-sm font-bold text-[#5b30d9]">{parseNotificationVolume(notificationVolume)}%</span>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Recordatorio diario</p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={dailyReminderEnabled ? "default" : "outline"}
                              onClick={() => setDailyReminderEnabled((current) => !current)}
                              className={dailyReminderEnabled ? "rounded-xl bg-[#5b30d9] text-white hover:bg-[#4a22be]" : "rounded-xl border-[#5b30d9] text-[#5b30d9]"}
                            >
                              {dailyReminderEnabled ? "Activo" : "Inactivo"}
                            </Button>
                            <Input
                              type="number"
                              min={0}
                              max={23}
                              inputMode="numeric"
                              value={dailyReminderHour}
                              onChange={(event) => setDailyReminderHour(sanitizeDigitsInput(event.target.value, 2))}
                              disabled={!dailyReminderEnabled}
                              className="w-24"
                            />
                          </div>
                          <p className="text-[11px] font-bold text-[#5b30d9]/70">Hora 24h (0-23)</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Pomodoro en segundo plano</p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={pomodoroReminderEnabled ? "default" : "outline"}
                              onClick={() => setPomodoroReminderEnabled((current) => !current)}
                              className={pomodoroReminderEnabled ? "rounded-xl bg-[#5b30d9] text-white hover:bg-[#4a22be]" : "rounded-xl border-[#5b30d9] text-[#5b30d9]"}
                            >
                              {pomodoroReminderEnabled ? "Activo" : "Inactivo"}
                            </Button>
                            <Input
                              type="number"
                              min={1}
                              max={60}
                              inputMode="numeric"
                              value={pomodoroReminderMinutes}
                              onChange={(event) => setPomodoroReminderMinutes(sanitizeDigitsInput(event.target.value, 2))}
                              disabled={!pomodoroReminderEnabled}
                              className="w-24"
                            />
                          </div>
                          <p className="text-[11px] font-bold text-[#5b30d9]/70">Cada N minutos (1-60)</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-xl border border-[#5b30d9]/20 bg-white/70 p-4">
                      <h3 className="font-bold uppercase tracking-wide text-[#5b30d9]">Perfil</h3>

                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Cambiar contraseña</p>
                        <Input
                          type="password"
                          value={passwordInput}
                          onChange={(event) => setPasswordInput(event.target.value)}
                          placeholder="Nueva contraseña"
                        />
                        <Input
                          type="password"
                          value={confirmPasswordInput}
                          onChange={(event) => setConfirmPasswordInput(event.target.value)}
                          placeholder="Repite la nueva contraseña"
                        />
                        <Button
                          onClick={() => void handleUpdatePassword()}
                          disabled={isUpdatingPassword}
                          className="rounded-xl bg-[#f47c0f] text-white hover:bg-[#dd6900]"
                        >
                          {isUpdatingPassword ? "Actualizando..." : "Actualizar contraseña"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="focus-card rounded-[1.2rem] p-6">
                  <h3 className="display-font text-4xl text-[#5b30d9]">Resumen</h3>
                  <div className="mt-4 space-y-3 text-[#5b30d9]">
                    <p className="font-bold">Puntos totales: {points}</p>
                    <p className="font-bold">Balance actual: {availablePoints}</p>
                    <p className="font-bold">Racha actual: {currentChallengeStreak} días</p>
                    <p className="font-bold">Bono acumulado por racha: +{streakBonusPoints}</p>
                    <p className="font-bold">Sesiones: {sessions.length}</p>
                    <p className="font-bold">Retos completados: {completedCount}</p>
                  </div>

                  <div className="mt-6">
                    <h4 className="display-font text-3xl text-[#5b30d9]">Historial</h4>
                    {sessions.length === 0 ? (
                      <p className="mt-2 text-sm text-[#5b30d9]/80">Aún no completas sesiones.</p>
                    ) : (
                      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                        {sessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between border border-[#5b30d9]/15 bg-white/70 p-3 text-sm">
                            <div>
                              <p className="font-bold text-[#5b30d9]">Sesión de {Math.round(session.durationSeconds / 60)} min</p>
                              <p className="text-xs text-[#5b30d9]/75">
                                {new Date(session.completedAt).toLocaleDateString("es-CO", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <span className="font-bold text-[#f47c0f]">+{SESSION_POINTS}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="mt-6 rounded-xl border-2 border-[#5b30d9] bg-transparent font-bold text-[#5b30d9] hover:bg-[#5b30d9] hover:text-white"
                  >
                    <LogOut className="mr-2 size-4" />
                    Cerrar sesión
                  </Button>
                </Card>
              </div>
            </TabsContent>
            )}
          </Tabs>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#5b30d9]/30 bg-[#f2f0f3]/95 px-4 py-2 backdrop-blur md:hidden">
          <div className="mx-auto grid w-full max-w-md grid-cols-5 gap-1 rounded-2xl border border-[#7d4cd8]/30 bg-white p-1">
            <button
              onClick={() => setActiveTab("pomodoro")}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold ${
                activeTab === "pomodoro" ? "bg-[#5b30d9] text-white" : "text-[#5b30d9]"
              }`}
            >
              <Clock className="size-4" />
              <span>Pomodoro</span>
            </button>
            <button
              onClick={() => setActiveTab("resumen")}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold ${
                activeTab === "resumen" ? "bg-[#5b30d9] text-white" : "text-[#5b30d9]"
              }`}
            >
              <Trophy className="size-4" />
              <span>Resumen</span>
            </button>
            <button
              onClick={() => setActiveTab("chatbot")}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold ${
                activeTab === "chatbot" ? "bg-[#5b30d9] text-white" : "text-[#5b30d9]"
              }`}
            >
              <MessageCircle className="size-4" />
              <span>Chat</span>
            </button>
            <button
              onClick={() => setActiveTab("tareas")}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold ${
                activeTab === "tareas" ? "bg-[#5b30d9] text-white" : "text-[#5b30d9]"
              }`}
            >
              <ListTodo className="size-4" />
              <span>Retos</span>
            </button>
            <button
              onClick={() => setActiveTab("cuenta")}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold ${
                activeTab === "cuenta" ? "bg-[#5b30d9] text-white" : "text-[#5b30d9]"
              }`}
            >
              <User className="size-4" />
              <span>Cuenta</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}










