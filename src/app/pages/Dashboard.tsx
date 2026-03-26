import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  CheckCircle,
  Circle,
  Clock,
  Coffee,
  Gift,
  ListTodo,
  LogOut,
  Mail,
  Minus,
  PauseCircle,
  PlayCircle,
  Plus,
  RotateCcw,
  Target,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { CHALLENGES } from "../lib/challenges";
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
  isActive: boolean;
  isPaused: boolean;
}

type ToastType = "success" | "error" | "info";

interface AppToast {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
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

const playEventSound = (event: "pomodoro" | "reward" | "notification" | "error") => {
  try {
    const audioContext = new window.AudioContext();
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
      gainNode.gain.exponentialRampToValueAtTime(0.16, startAt + 0.02);
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
  const [customChallenges, setCustomChallenges] = useState<CustomChallenge[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rooms, setRooms] = useState<PomodoroRoom[]>([]);
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingChallenge, setIsSavingChallenge] = useState(false);
  const [redeemingRewardId, setRedeemingRewardId] = useState<number | null>(null);
  const [isSavingReward, setIsSavingReward] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState("");
  const [newChallengeTarget, setNewChallengeTarget] = useState("5");
  const [newChallengePoints, setNewChallengePoints] = useState("50");
  const [newRewardTitle, setNewRewardTitle] = useState("");
  const [newRewardDescription, setNewRewardDescription] = useState("");
  const [newRewardCost, setNewRewardCost] = useState("60");
  const [newRoomName, setNewRoomName] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<number | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [toasts, setToasts] = useState<AppToast[]>([]);
  const [hydratedPomodoroKey, setHydratedPomodoroKey] = useState<string | null>(null);

  const pomodoroStorageKey = useMemo(() => {
    if (!userId) {
      return null;
    }
    return `focuszone:pomodoro:${userId}`;
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

  const maxTimerSeconds = Math.max(getModeSeconds("focus"), getModeSeconds("shortBreak"), getModeSeconds("longBreak"));

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
      setEmail(user.email ?? "");
      setName((user.user_metadata?.full_name as string) || (user.email ?? "Usuario"));

      const [sessionsResult, challengesResult, customChallengesResult, rewardsResult, redemptionsResult, roomsResult, membershipsResult] = await Promise.all([
        supabase
          .from("pomodoro_sessions")
          .select("id, duration_seconds, completed_at")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false }),
        supabase.from("user_challenge_progress").select("challenge_id").eq("user_id", user.id),
        supabase
          .from("custom_challenges")
          .select("id, title, target_sessions, points, is_group")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("user_rewards")
          .select("id, title, description, cost_points")
          .eq("user_id", user.id)
          .order("cost_points", { ascending: true }),
        supabase
          .from("reward_redemptions")
          .select("id, reward_id, points_spent, created_at")
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
      ]);

      if (
        sessionsResult.error ||
        challengesResult.error ||
        customChallengesResult.error ||
        rewardsResult.error ||
        redemptionsResult.error ||
        roomsResult.error ||
        membershipsResult.error
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
      }

      if (customChallengesResult.data) {
        setCustomChallenges(
          customChallengesResult.data.map((item) => ({
            id: item.id,
            title: item.title,
            targetSessions: item.target_sessions,
            points: item.points,
            isGroup: item.is_group,
          })),
        );
      }

      if (rewardsResult.data) {
        setRewards(
          rewardsResult.data.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            costPoints: item.cost_points,
          })),
        );
      }

      if (redemptionsResult.data) {
        setRedemptions(
          redemptionsResult.data.map((item) => ({
            id: item.id,
            rewardId: item.reward_id,
            pointsSpent: item.points_spent,
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

      if (membershipsResult.data) {
        const roomIds = new Set(membershipsResult.data.map((item) => item.room_id));
        setJoinedRoomIds(roomIds);
        setSelectedRoomId((previous) => {
          if (previous && roomIds.has(previous)) {
            return previous;
          }
          return roomIds.values().next().value ?? null;
        });
      }

      const leaderboardResult = await supabase
        .from("user_leaderboard")
        .select("user_id, display_name, total_points")
        .order("total_points", { ascending: false })
        .order("updated_at", { ascending: true })
        .limit(10);

      if (leaderboardResult.data) {
        setLeaderboard(
          leaderboardResult.data.map((item) => ({
            userId: item.user_id,
            displayName: item.display_name,
            totalPoints: item.total_points,
          })),
        );
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

    setNotificationPermission(window.Notification.permission);
  }, []);

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
        setSuccessMessage("El pomodoro termino mientras estabas fuera. Estado recuperado.");
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

  const pushToast = (type: ToastType, title: string, description?: string) => {
    const toastId = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((previous) => [...previous.slice(-3), { id: toastId, type, title, description }]);
    window.setTimeout(() => {
      removeToast(toastId);
    }, 4200);
  };

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    pushToast("success", "Listo", successMessage);
    playEventSound("notification");
    setSuccessMessage("");
  }, [successMessage]);

  useEffect(() => {
    if (!error) {
      return;
    }

    pushToast("error", "Ups", error);
    playEventSound("error");
    setError("");
  }, [error]);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    }

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
    () => CHALLENGES.map((challenge) => ({ id: challenge.id, title: challenge.title, points: challenge.points, kind: "base" })),
    [],
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

  const completedCount = allChallenges.filter((challenge) => completedChallenges.has(challenge.id)).length;
  const progressPercentage = allChallenges.length === 0 ? 0 : (completedCount / allChallenges.length) * 100;
  const challengePoints = allChallenges
    .filter((challenge) => completedChallenges.has(challenge.id))
    .reduce((sum, challenge) => sum + challenge.points, 0);
  const points = sessions.length * SESSION_POINTS + challengePoints;
  const spentPoints = redemptions.reduce((sum, redemption) => sum + redemption.pointsSpent, 0);
  const availablePoints = Math.max(points - spentPoints, 0);

  useEffect(() => {
    const syncLeaderboard = async () => {
      if (!userId || !name) {
        return;
      }

      await supabase.from("user_leaderboard").upsert({
        user_id: userId,
        display_name: name,
        total_points: points,
        updated_at: new Date().toISOString(),
      });

      const leaderboardResult = await supabase
        .from("user_leaderboard")
        .select("user_id, display_name, total_points")
        .order("total_points", { ascending: false })
        .order("updated_at", { ascending: true })
        .limit(10);

      if (leaderboardResult.data) {
        setLeaderboard(
          leaderboardResult.data.map((item) => ({
            userId: item.user_id,
            displayName: item.display_name,
            totalPoints: item.total_points,
          })),
        );
      }
    };

    void syncLeaderboard();
  }, [userId, name, points]);

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
          .select("user_id, time_left, is_active, is_paused")
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
            isActive: entry.is_active,
            isPaused: entry.is_paused,
          },
        ]),
      );

      setRoomMembers(
        membersResult.data.map((member) => {
          const current = presenceMap.get(member.user_id);
          return {
            userId: member.user_id,
            displayName: member.display_name,
            timeLeft: current?.timeLeft ?? getModeSeconds("focus"),
            isActive: current?.isActive ?? false,
            isPaused: current?.isPaused ?? false,
          };
        }),
      );
    };

    void loadRoomMembers();

    if (!selectedRoomId) {
      return;
    }

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
      void supabase.removeChannel(channel);
    };
  }, [selectedRoomId, focusMinutes]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const refreshRooms = async () => {
      const [roomsResult, membershipsResult] = await Promise.all([
        supabase.from("pomodoro_rooms").select("id, name, owner_id").order("created_at", { ascending: false }),
        supabase.from("pomodoro_room_members").select("room_id").eq("user_id", userId),
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

      if (membershipsResult.data) {
        const roomIds = new Set(membershipsResult.data.map((item) => item.room_id));
        setJoinedRoomIds(roomIds);
        setSelectedRoomId((previous) => {
          if (previous && roomIds.has(previous)) {
            return previous;
          }
          return roomIds.values().next().value ?? null;
        });
      }
    };

    void refreshRooms();

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
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void refreshRooms();
        },
      )
      .subscribe();

    return () => {
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
        is_active: isActive,
        is_paused: isPaused,
        updated_at: new Date().toISOString(),
      });
    };

    void syncRoomPresence();
  }, [selectedRoomId, userId, timeLeft, isActive, isPaused]);

  useEffect(() => {
    if (!userId || !selectedRoomId || !joinedRoomIds.has(selectedRoomId)) {
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
            isActive,
            isPaused,
          },
        ];
      }

      return previous.map((member) =>
        member.userId === userId
          ? {
              ...member,
              timeLeft,
              isActive,
              isPaused,
              displayName: member.displayName || name || email || "Usuario",
            }
          : member,
      );
    });
  }, [userId, selectedRoomId, joinedRoomIds, timeLeft, isActive, isPaused, name, email]);

  useEffect(() => {
    if (!selectedRoomId) {
      return;
    }

    const interval = window.setInterval(() => {
      setRoomMembers((previous) =>
        previous.map((member) => {
          if (!member.isActive || member.isPaused || member.timeLeft <= 0) {
            return member;
          }

          return {
            ...member,
            timeLeft: Math.max(0, member.timeLeft - 1),
          };
        }),
      );
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [selectedRoomId]);

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
        setError("No se pudo guardar la sesion.");
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
      setSuccessMessage(`Sesion completada. +${SESSION_POINTS} puntos.`);

      if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
        new window.Notification("FocusZone | Pomodoro completado", {
          body: `Sumaste +${SESSION_POINTS} puntos. Sigue asi.`,
          icon: "/favicon.svg",
          badge: "/favicon.svg",
          tag: "focuszone-pomodoro-complete",
        });
      }
      return;
    }

    setTimerMode("focus");
    setTimeLeft(focusDurationSeconds);
    setSuccessMessage(completedMode === "shortBreak" ? "Descanso corto terminado. Volvemos al foco." : "Descanso largo terminado. Volvemos al foco.");
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
      setSuccessMessage("Reto desmarcado.");
      return;
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

    setCompletedChallenges((previous) => new Set(previous).add(challengeId));
    setSuccessMessage("Reto marcado como completado.");
  };

  const handleCreateChallenge = async () => {
    if (!userId) {
      return;
    }

    const title = newChallengeTitle.trim();
    const targetSessions = Number(newChallengeTarget);
    const rewardPoints = Number(newChallengePoints);
    const duplicatedChallenge = customChallenges.some(
      (challenge) => challenge.title.trim().toLowerCase() === title.toLowerCase(),
    );

    if (title.length < 3 || Number.isNaN(targetSessions) || targetSessions <= 0 || Number.isNaN(rewardPoints) || rewardPoints <= 0) {
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
      .select("id, title, target_sessions, points, is_group")
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
      },
      ...previous,
    ]);

    setNewChallengeTitle("");
    setNewChallengeTarget("5");
    setNewChallengePoints("50");
    setSuccessMessage("Reto personalizado creado correctamente.");
  };

  const handleCreateReward = async () => {
    if (!userId) {
      return;
    }

    const title = newRewardTitle.trim();
    const description = newRewardDescription.trim();
    const costPoints = Number(newRewardCost);
    const duplicatedReward = rewards.some((reward) => reward.title.trim().toLowerCase() === title.toLowerCase());

    if (title.length < 3 || Number.isNaN(costPoints) || costPoints <= 0) {
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

    const roomName = newRoomName.trim();
    if (roomName.length < 3) {
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

    const { error: memberError } = await supabase.from("pomodoro_room_members").upsert({
      room_id: data.id,
      user_id: userId,
      display_name: name || email || "Usuario",
    });

    setIsCreatingRoom(false);

    if (memberError) {
      setError("La sala se creo, pero no pudiste entrar automaticamente.");
      return;
    }

    await supabase.from("pomodoro_room_presence").upsert({
      room_id: data.id,
      user_id: userId,
      time_left: timeLeft,
      is_active: isActive,
      is_paused: isPaused,
      updated_at: new Date().toISOString(),
    });

    setRooms((previous) => [{ id: data.id, name: data.name, ownerId: data.owner_id }, ...previous]);
    setJoinedRoomIds((previous) => new Set(previous).add(data.id));
    setSelectedRoomId(data.id);
    setNewRoomName("");
    setSuccessMessage("Sala creada y te uniste correctamente.");
  };

  const handleJoinRoom = async (room: PomodoroRoom) => {
    if (!userId) {
      return;
    }

    setJoiningRoomId(room.id);
    setError("");
    setSuccessMessage("");

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
      time_left: timeLeft,
      is_active: isActive,
      is_paused: isPaused,
      updated_at: new Date().toISOString(),
    });

    setJoinedRoomIds((previous) => new Set(previous).add(room.id));
    setSelectedRoomId(room.id);
    setSuccessMessage(`Te uniste a ${room.name}.`);
  };

  const handleLeaveRoom = async (roomId: number) => {
    if (!userId) {
      return;
    }

    await supabase.from("pomodoro_room_presence").delete().eq("room_id", roomId).eq("user_id", userId);
    const { error: leaveError } = await supabase.from("pomodoro_room_members").delete().eq("room_id", roomId).eq("user_id", userId);

    if (leaveError) {
      setError("No se pudo salir de la sala.");
      return;
    }

    setJoinedRoomIds((previous) => {
      const next = new Set(previous);
      next.delete(roomId);
      return next;
    });

    setSelectedRoomId((current) => (current === roomId ? null : current));
    setSuccessMessage("Saliste de la sala.");
  };

  const sendTestNotification = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setError("Este navegador no soporta notificaciones.");
      setSuccessMessage("");
      return;
    }

    if (!window.isSecureContext) {
      setError("Las notificaciones requieren HTTPS (o localhost).");
      setSuccessMessage("");
      return;
    }

    let permission = window.Notification.permission;
    if (permission === "default") {
      permission = await window.Notification.requestPermission();
      setNotificationPermission(permission);
    }

    if (permission !== "granted") {
      setError("Permiso bloqueado. Habilitalo en la configuracion del navegador para este sitio.");
      setSuccessMessage("");
      return;
    }

    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.showNotification("FocusZone | Prueba", {
            body: "Notificaciones activas. También escucharás sonido en los avisos.",
            icon: "/favicon.svg",
            badge: "/favicon.svg",
            tag: "focuszone-test-notification",
          });
        } else {
          new window.Notification("FocusZone | Prueba", {
            body: "Notificaciones activas. También escucharás sonido en los avisos.",
            icon: "/favicon.svg",
            badge: "/favicon.svg",
            tag: "focuszone-test-notification",
          });
        }
      } else {
        new window.Notification("FocusZone | Prueba", {
          body: "Notificaciones activas. También escucharás sonido en los avisos.",
          icon: "/favicon.svg",
          badge: "/favicon.svg",
          tag: "focuszone-test-notification",
        });
      }

      setError("");
      setSuccessMessage("Notificacion de prueba enviada.");
    } catch {
      setError("No se pudo mostrar la notificacion en este dispositivo/navegador.");
      setSuccessMessage("");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const findRewardName = (rewardId: number) => {
    return rewards.find((reward) => reward.id === rewardId)?.title ?? "Recompensa";
  };

  const currentModeSeconds = getModeSeconds(timerMode);
  const timerProgress = Math.max(0, Math.min(100, Math.round(((currentModeSeconds - timeLeft) / currentModeSeconds) * 100)));
  const estimateMemberDuration = (memberTimeLeft: number) => {
    const presets = [getModeSeconds("focus"), getModeSeconds("shortBreak"), getModeSeconds("longBreak")].sort((a, b) => a - b);
    const matched = presets.find((value) => value >= memberTimeLeft);
    return matched ?? maxTimerSeconds;
  };

  if (isLoading) {
    return <div className="focus-shell min-h-screen grid place-items-center text-xl font-bold">Cargando...</div>;
  }

  return (
    <div className="focus-shell focus-rings min-h-screen">
      <div className="relative z-10">
        <header className="border-b border-[#b8ee73]/30 bg-[#5b30d9]">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 md:px-8">
            <div className="leading-none">
              <p className="display-font text-5xl text-[#b8ee73]">Focus</p>
              <p className="display-font -mt-1 text-4xl text-[#f47c0f]">Zone</p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="rounded-none border-2 border-white bg-transparent font-bold text-white hover:bg-white hover:text-[#5b30d9]"
            >
              <LogOut className="mr-2 size-4" />
              Cerrar sesion
            </Button>
          </div>
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
                    className="rounded p-1 text-[#2a2a2a]/60 transition hover:bg-black/5 hover:text-[#2a2a2a]"
                    aria-label="Cerrar notificacion"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <main className="mx-auto w-full max-w-6xl px-5 py-7 pb-24 md:px-8 md:py-10 md:pb-10">

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 hidden h-auto w-full flex-wrap rounded-none bg-[#5b30d9] p-1 md:flex">
              <TabsTrigger value="pomodoro" className="rounded-none font-bold text-white data-[state=active]:bg-[#f47c0f] data-[state=active]:text-white">Pomodoro</TabsTrigger>
              <TabsTrigger value="resumen" className="rounded-none font-bold text-white data-[state=active]:bg-[#f47c0f] data-[state=active]:text-white">Resumen</TabsTrigger>
              <TabsTrigger value="tareas" className="rounded-none font-bold text-white data-[state=active]:bg-[#f47c0f] data-[state=active]:text-white">Tareas</TabsTrigger>
              <TabsTrigger value="recompensas" className="rounded-none font-bold text-white data-[state=active]:bg-[#f47c0f] data-[state=active]:text-white">Recompensas</TabsTrigger>
              <TabsTrigger value="cuenta" className="rounded-none font-bold text-white data-[state=active]:bg-[#f47c0f] data-[state=active]:text-white">Cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="pomodoro" className="space-y-5">
              <Card className="focus-card rounded-none p-5 md:p-7">
                <div className="flex items-center gap-2">
                  <Clock className="size-5 text-[#f47c0f]" />
                  <h2 className="display-font text-5xl text-[#5b30d9]">Pomodoro</h2>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-[300px_1fr]">
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-[#5b30d9] p-3 text-white">
                      <p className="text-xs font-bold uppercase tracking-wide text-white/80">Duracion de sesion</p>
                      <div className="mt-2 flex items-center justify-between">
                        <button
                          onClick={() => adjustDuration("focus", -1)}
                          className="grid size-8 place-items-center rounded-full bg-[#f47c0f] text-white"
                          aria-label="Reducir sesion"
                        >
                          <Minus className="size-4" />
                        </button>
                        <button onClick={() => switchTimerMode("focus")} className={`font-bold ${timerMode === "focus" ? "text-[#b8ee73]" : "text-white"}`}>
                          {focusMinutes} min
                        </button>
                        <button
                          onClick={() => adjustDuration("focus", 1)}
                          className="grid size-8 place-items-center rounded-full bg-[#f47c0f] text-white"
                          aria-label="Aumentar sesion"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-[#5b30d9] p-3 text-white">
                      <p className="text-xs font-bold uppercase tracking-wide text-white/80">Duracion de descanso</p>
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
                    </div>
                    <div className="rounded-2xl bg-[#5b30d9] p-3 text-white">
                      <p className="text-xs font-bold uppercase tracking-wide text-white/80">Duracion de descanso largo</p>
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
                        <p className="display-font text-8xl text-[#5b30d9]">{formatTime(timeLeft)}</p>
                        <p className="mt-1 font-bold text-[#5b30d9]/85">{isActive ? (isPaused ? "Pausado" : getModeLabel(timerMode)) : "Listo"}</p>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Ciclo {Math.min(focusStreak % 4, 3) + 1}/4</p>
                      </div>
                    </div>

                    <div className="grid w-full grid-cols-2 gap-3 sm:max-w-[360px]">
                      <Button size="lg" onClick={toggleTimer} className="rounded-xl bg-[#f47c0f] px-6 text-white hover:bg-[#dd6900]">
                        {!isActive || isPaused ? <><PlayCircle className="mr-2 size-5" /> {!isActive ? "Iniciar" : "Reanudar"}</> : <><PauseCircle className="mr-2 size-5" /> Pausar</>}
                      </Button>
                      <Button size="lg" variant="outline" onClick={resetTimer} className="rounded-xl border-2 border-[#5b30d9] text-[#5b30d9]">
                        <RotateCcw className="mr-2 size-5" />
                        Reiniciar
                      </Button>
                    </div>

                    <div className="flex w-full items-center justify-center gap-2 sm:max-w-[360px]">
                      {[0, 1, 2, 3].map((index) => (
                        <span
                          key={index}
                          className={`h-2 flex-1 rounded-full ${index < focusStreak % 4 ? "bg-[#f47c0f]" : "bg-[#5b30d9]/25"}`}
                        />
                      ))}
                      <span className="ml-2 grid size-7 place-items-center rounded-full border border-[#5b30d9]/45 text-[#5b30d9]">
                        <Coffee className="size-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <section className="grid gap-4">
                <Card className="focus-card rounded-none p-4 sm:p-6">
                  <div className="mb-3 flex items-center gap-2 text-[#5b30d9]">
                    <Users className="size-5" />
                    <h3 className="display-font text-3xl sm:text-4xl">Salas Pomodoro</h3>
                  </div>
                  <div className="mb-4 space-y-3 border border-[#5b30d9]/20 bg-white/70 p-3 sm:p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Crear sala</p>
                    <Input value={newRoomName} onChange={(event) => setNewRoomName(event.target.value)} placeholder="Ej: Diseno nocturno" />
                    <Button disabled={isCreatingRoom} onClick={() => void handleCreateRoom()} className="w-full rounded-none bg-[#5b30d9] text-white hover:bg-[#4a22be] sm:w-auto">
                      {isCreatingRoom ? "Creando..." : "Crear sala"}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {rooms.length === 0 ? (
                      <p className="text-sm text-[#5b30d9]/75">Aun no hay salas activas.</p>
                    ) : (
                      rooms.map((room) => {
                        const isJoined = joinedRoomIds.has(room.id);
                        const isSelected = selectedRoomId === room.id;
                        return (
                          <div key={room.id} className={`border p-3 sm:p-4 ${isSelected ? "border-[#f47c0f] bg-[#fff4ea]" : "border-[#5b30d9]/20 bg-white/70"}`}>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <p className="break-words font-bold text-[#5b30d9]">{room.name}</p>
                              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
                                {isJoined ? (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => setSelectedRoomId(room.id)} className="rounded-none border-[#5b30d9] text-[#5b30d9]">
                                      Ver
                                    </Button>
                                    <Button size="sm" onClick={() => void handleLeaveRoom(room.id)} className="rounded-none bg-[#d4183d] text-white hover:bg-[#b81234]">
                                      Salir
                                    </Button>
                                  </>
                                ) : (
                                  <Button size="sm" disabled={joiningRoomId === room.id} onClick={() => void handleJoinRoom(room)} className="rounded-none bg-[#f47c0f] text-white hover:bg-[#dd6900]">
                                    {joiningRoomId === room.id ? "Uniendo..." : "Unirme"}
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
                    <div className="mt-4 border border-[#5b30d9]/20 bg-white/70 p-3 sm:p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Miembros en sala</p>
                        <span className="rounded-full bg-[#5b30d9]/10 px-2 py-1 text-xs font-bold text-[#5b30d9]">Vista en tiempo real</span>
                      </div>
                      {roomMembers.length === 0 ? (
                        <p className="text-sm text-[#5b30d9]/75">Cargando miembros...</p>
                      ) : (
                        <div className="grid max-h-[46vh] gap-2 overflow-y-auto pr-1 sm:max-h-[52vh] sm:grid-cols-2">
                          {roomMembers.map((member) => {
                            const memberDuration = estimateMemberDuration(member.timeLeft);
                            const normalizedDuration = Math.max(memberDuration, member.timeLeft, 1);
                            const memberProgressRaw = member.isActive
                              ? Math.max(0, Math.min(100, ((normalizedDuration - member.timeLeft) / normalizedDuration) * 100))
                              : 0;
                            const memberProgressLabel = Math.round(memberProgressRaw);

                            return (
                            <div key={member.userId} className="border border-[#5b30d9]/20 bg-white p-3">
                              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <span className="break-all font-bold text-[#5b30d9]">{member.displayName}</span>
                                <span
                                  className={`w-fit rounded-full px-2 py-1 text-xs font-bold ${
                                    member.isActive
                                      ? member.isPaused
                                        ? "bg-[#ffe8b3] text-[#7d5a00]"
                                        : "bg-[#d5fff2] text-[#00684f]"
                                      : "bg-[#f1ebff] text-[#5b30d9]"
                                  }`}
                                >
                                  {member.isActive ? (member.isPaused ? "Descanso" : "En foco") : "Listo"}
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
                                {member.isActive ? formatTime(member.timeLeft) : "00:00"}
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

            <TabsContent value="resumen" className="space-y-5">
              <section className="grid gap-4 md:grid-cols-4">
                <Card className="focus-card rounded-none border-2 border-[#f47c0f]/40 bg-[#f47c0f] p-6 text-white">
                  <p className="font-bold uppercase tracking-wider">Puntos</p>
                  <p className="display-font mt-2 text-7xl">{points}</p>
                </Card>
                <Card className="focus-card rounded-none p-6">
                  <p className="font-bold text-[#5b30d9]">Disponibles</p>
                  <p className="display-font mt-2 text-7xl text-[#5b30d9]">{availablePoints}</p>
                </Card>
                <Card className="focus-card rounded-none p-6">
                  <p className="font-bold text-[#5b30d9]">Sesiones</p>
                  <p className="display-font mt-2 text-7xl text-[#5b30d9]">{sessions.length}</p>
                </Card>
                <Card className="focus-card rounded-none bg-[#b8ee73]/45 p-6">
                  <p className="font-bold text-[#325f0b]">Retos</p>
                  <p className="display-font mt-2 text-7xl text-[#325f0b]">{completedCount}</p>
                </Card>
              </section>

              <Card className="focus-card rounded-none p-6">
                <div className="mb-3 flex items-center gap-2 text-[#5b30d9]">
                  <Trophy className="size-5" />
                  <h3 className="display-font text-4xl">Ranking</h3>
                </div>
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-[#5b30d9]/75">Aun no hay participantes.</p>
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
              </Card>
            </TabsContent>

            <TabsContent value="tareas">
              <Card className="focus-card rounded-none p-7 md:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="display-font text-5xl text-[#5b30d9]">Retos</h2>
                  <div className="focus-tag">{completedCount}/{allChallenges.length || 1}</div>
                </div>

                <Progress value={progressPercentage} className="mb-6 h-3 rounded-none bg-[#5b30d9]/20 [&>div]:rounded-none [&>div]:bg-[#f47c0f]" />

                <p className="mb-2 text-sm font-bold uppercase tracking-wide text-[#5b30d9]/80">
                  Crea un reto propio para tu semana
                </p>
                <div className="mb-6 space-y-3 border border-[#5b30d9]/20 bg-white/70 p-4">
                  <p className="font-bold text-[#5b30d9]">Crear reto personalizado</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Nombre del reto</p>
                  <Input
                    value={newChallengeTitle}
                    onChange={(event) => setNewChallengeTitle(event.target.value)}
                    placeholder="Ej: Completa 5 sesiones de bocetos"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Meta de sesiones</p>
                      <Input
                        type="number"
                        min={1}
                        value={newChallengeTarget}
                        onChange={(event) => setNewChallengeTarget(event.target.value)}
                        placeholder="5"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Puntos</p>
                      <Input
                        type="number"
                        min={1}
                        value={newChallengePoints}
                        onChange={(event) => setNewChallengePoints(event.target.value)}
                        placeholder="50"
                      />
                    </div>
                  </div>
                  <Button disabled={isSavingChallenge} onClick={() => void handleCreateChallenge()} className="rounded-none bg-[#5b30d9] text-white hover:bg-[#4a22be]">
                    {isSavingChallenge ? "Guardando..." : "Crear reto"}
                  </Button>
                </div>

                <div className="space-y-3">
                  {allChallenges.map((challenge) => {
                    const done = completedChallenges.has(challenge.id);
                    return (
                      <button
                        key={challenge.id}
                        onClick={() => void toggleChallenge(challenge.id)}
                        className={`flex w-full items-center gap-3 rounded-none border p-4 text-left transition ${
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

              </Card>
            </TabsContent>

            <TabsContent value="recompensas">
              <Card className="focus-card rounded-none p-7 md:p-8">
                <div className="mb-4 flex items-center gap-2">
                  <Gift className="size-5 text-[#f47c0f]" />
                  <h2 className="display-font text-5xl text-[#5b30d9]">Recompensas</h2>
                </div>

                <p className="mb-4 font-bold text-[#5b30d9]">Puntos disponibles: {availablePoints}</p>
                <p className="mb-2 text-sm font-bold uppercase tracking-wide text-[#5b30d9]/80">Crear recompensa propia</p>
                <div className="mb-6 space-y-3 border border-[#5b30d9]/20 bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Nombre</p>
                  <Input
                    value={newRewardTitle}
                    onChange={(event) => setNewRewardTitle(event.target.value)}
                    placeholder="Ej: Salida a comer algo rico"
                  />
                  <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Descripcion (opcional)</p>
                  <Input
                    value={newRewardDescription}
                    onChange={(event) => setNewRewardDescription(event.target.value)}
                    placeholder="Detalle de la recompensa"
                  />
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#5b30d9]/75">Costo en puntos</p>
                    <Input
                      type="number"
                      min={1}
                      value={newRewardCost}
                      onChange={(event) => setNewRewardCost(event.target.value)}
                      placeholder="60"
                    />
                  </div>
                  <Button disabled={isSavingReward} onClick={() => void handleCreateReward()} className="rounded-none bg-[#5b30d9] text-white hover:bg-[#4a22be]">
                    {isSavingReward ? "Guardando..." : "Crear recompensa"}
                  </Button>
                </div>

                <div className="space-y-3">
                  {rewards.length === 0 ? (
                    <p className="text-sm text-[#5b30d9]/80">Aun no tienes recompensas. Crea la primera arriba.</p>
                  ) : rewards.map((reward) => {
                    const disabled = availablePoints < reward.costPoints || redeemingRewardId === reward.id;
                    return (
                      <div key={reward.id} className="rounded-none border border-[#5b30d9]/20 bg-white/70 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-[#5b30d9]">{reward.title}</p>
                            <p className="text-sm text-[#5b30d9]/80">{reward.description}</p>
                          </div>
                          <span className="font-bold text-[#f47c0f]">{reward.costPoints} pts</span>
                        </div>
                        <Button
                          onClick={() => void handleRedeemReward(reward)}
                          disabled={disabled}
                          className="mt-3 rounded-none bg-[#f47c0f] text-white hover:bg-[#dd6900]"
                        >
                          {redeemingRewardId === reward.id ? "Canjeando..." : "Canjear"}
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <h3 className="mb-3 font-bold text-[#5b30d9]">Ultimos canjes</h3>
                  {redemptions.length === 0 ? (
                    <p className="text-sm text-[#5b30d9]/80">Aun no has hecho canjes.</p>
                  ) : (
                    <div className="space-y-2">
                      {redemptions.slice(0, 5).map((redemption) => (
                        <div key={redemption.id} className="flex items-center justify-between border border-[#5b30d9]/15 bg-white/60 p-3 text-sm">
                          <span className="font-bold text-[#5b30d9]">{findRewardName(redemption.rewardId)}</span>
                          <span className="text-[#f47c0f]">-{redemption.pointsSpent} pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="cuenta">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="focus-card rounded-none p-6">
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
                        <Button variant="outline" disabled className="rounded-none border-[#5b30d9] text-[#5b30d9]">
                          Sonido: ON
                        </Button>
                        <Button variant="outline" disabled className="rounded-none border-[#5b30d9] text-[#5b30d9]">
                          {notificationPermission === "granted"
                            ? "Notificaciones activas"
                            : notificationPermission === "unsupported"
                              ? "Notificaciones no soportadas"
                              : "Notificaciones limitadas"}
                        </Button>
                        <Button
                          onClick={() => void sendTestNotification()}
                          disabled={notificationPermission === "unsupported"}
                          className="rounded-none bg-[#f47c0f] text-white hover:bg-[#dd6900]"
                        >
                          Probar notificacion
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="focus-card rounded-none p-6">
                  <h3 className="display-font text-4xl text-[#5b30d9]">Resumen</h3>
                  <div className="mt-4 space-y-3 text-[#5b30d9]">
                    <p className="font-bold">Puntos totales: {points}</p>
                    <p className="font-bold">Puntos canjeados: {spentPoints}</p>
                    <p className="font-bold">Puntos disponibles: {availablePoints}</p>
                    <p className="font-bold">Sesiones: {sessions.length}</p>
                    <p className="font-bold">Retos completados: {completedCount}</p>
                  </div>

                  <div className="mt-6">
                    <h4 className="display-font text-3xl text-[#5b30d9]">Historial</h4>
                    {sessions.length === 0 ? (
                      <p className="mt-2 text-sm text-[#5b30d9]/80">Aun no completas sesiones.</p>
                    ) : (
                      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                        {sessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between border border-[#5b30d9]/15 bg-white/70 p-3 text-sm">
                            <div>
                              <p className="font-bold text-[#5b30d9]">Sesion de {Math.round(session.durationSeconds / 60)} min</p>
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
                    className="mt-6 rounded-none border-2 border-[#5b30d9] bg-transparent font-bold text-[#5b30d9] hover:bg-[#5b30d9] hover:text-white"
                  >
                    <LogOut className="mr-2 size-4" />
                    Cerrar sesion
                  </Button>
                </Card>
              </div>
            </TabsContent>
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
              onClick={() => setActiveTab("tareas")}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold ${
                activeTab === "tareas" ? "bg-[#5b30d9] text-white" : "text-[#5b30d9]"
              }`}
            >
              <ListTodo className="size-4" />
              <span>Tareas</span>
            </button>
            <button
              onClick={() => setActiveTab("recompensas")}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold ${
                activeTab === "recompensas" ? "bg-[#5b30d9] text-white" : "text-[#5b30d9]"
              }`}
            >
              <Gift className="size-4" />
              <span>Canjear</span>
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
