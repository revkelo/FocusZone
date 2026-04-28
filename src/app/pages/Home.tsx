import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, BookOpenText, Bot, Building2, ChevronLeft, ChevronRight, Cpu, Database, Glasses, GraduationCap, Lightbulb, Maximize2, MessageSquareQuote, Monitor, Newspaper, Pause, Play, Trophy, Volume2, WandSparkles, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { supabase } from "../lib/supabase";

interface RankItem {
  userId: string;
  displayName: string;
  totalPoints: number;
}

interface ArtItem {
  src: string;
  title: string;
  orientation: "portrait" | "landscape";
}

const artGallery: ArtItem[] = [
  { src: "/assets/focuszone/carousel-01.jpg", title: "Afiche principal", orientation: "portrait" },
  { src: "/assets/focuszone/carousel-02.jpg", title: "Pieza editorial", orientation: "portrait" },
  { src: "/assets/focuszone/campaign-01.jpg", title: "Diseño 01", orientation: "landscape" },
  { src: "/assets/focuszone/campaign-02.jpg", title: "Diseño 02", orientation: "landscape" },
  { src: "/assets/focuszone/campaign-03.jpg", title: "Diseño 03", orientation: "landscape" },
  { src: "/assets/focuszone/campaign-04.jpg", title: "Diseño 04", orientation: "landscape" },
  { src: "/assets/focuszone/campaign-08.jpg", title: "Diseño 08", orientation: "portrait" },
  { src: "/assets/focuszone/campaign-09.jpg", title: "Diseño 09", orientation: "portrait" },
  { src: "/assets/focuszone/campaign-10.jpg", title: "Diseño 10", orientation: "portrait" },
  { src: "/assets/focuszone/campaign-11.jpg", title: "Diseño 11", orientation: "portrait" },
  { src: "/assets/focuszone/campaign-12.jpg", title: "Diseño 12", orientation: "portrait" },
  { src: "/assets/focuszone/campaign-13.jpg", title: "Diseño 13", orientation: "portrait" },
  { src: "/assets/focuszone/campaign-14.jpg", title: "Diseño 14", orientation: "portrait" },
];

const researchStats = [
  { value: "89%", label: "Dedica más de 3 horas al día a redes sociales", icon: "◆" },
  { value: "64%", label: "Nota afiches físicos en la biblioteca", icon: "◆" },
  { value: "74%", label: "Ve pantallas digitales de biblioteca y universidad", icon: "◆" },
  { value: "56%", label: "Se sienten poco informados sobre recursos tecnológicos de la biblioteca.", icon: "◆" },
];

const manifestoLines = [
  "El problema no es lo digital, es cómo lo usamos.",
  "La biblioteca es una alternativa real para recuperar foco.",
  "Puedes recuperar el control de tu atención.",
  "Tu atención es un recurso valioso.",
];

const libraryPillars = [
  { label: "Recursos", Icon: BookOpenText },
  { label: "Espacios", Icon: Building2 },
  { label: "Tecnologías", Icon: Cpu },
  { label: "Cursos", Icon: GraduationCap },
  { label: "Bases de datos", Icon: Database },
  { label: "Experiencias", Icon: WandSparkles },
];

const libraryResourceHighlights = [
  { value: "+50", label: "Softwares especializados", Icon: Monitor },
  { value: "", label: "Cursos formativos", Icon: GraduationCap },
  { value: "", label: "Realidad virtual", Icon: Glasses },
  { value: "", label: "Bases de datos académicas", Icon: Database },
];

const technicalLogos = [
  { name: "React", logo: "/assets/tech/react.svg" },
  { name: "TypeScript", logo: "/assets/tech/typescript.svg" },
  { name: "Vite", logo: "/assets/tech/vite.svg" },
  { name: "React Router", logo: "/assets/tech/reactrouter.svg" },
  { name: "Tailwind CSS", logo: "/assets/tech/tailwindcss.svg" },
  { name: "Supabase", logo: "/assets/tech/supabase.svg" },
  { name: "PostgreSQL", logo: "/assets/tech/postgresql.svg" },
  { name: "Node.js API", logo: "/assets/tech/nodedotjs.svg" },
  { name: "Vercel", logo: "/assets/tech/vercel.svg" },
  { name: "OpenRouter", logo: "/assets/tech/openrouter.ico" },
];

const relatedNews = [
  {
    category: "BBC News Mundo",
    title: "Declaran a Meta y Google responsables en un juicio histórico sobre la adicción a las redes sociales",
    summary: "Cobertura sobre un fallo clave que vincula plataformas digitales con riesgos de adicción y salud mental en jóvenes.",
    sourceUrl: "https://www.bbc.com/mundo/articles/c62j769d2xpo",
    sourceDomain: "bbc.com/mundo",
    topic: "Salud digital",
  },
  {
    category: "Mayo Clinic",
    title: "Adolescentes y uso de redes sociales: ¿cuál es el impacto en su bienestar?",
    summary: "Guía sobre riesgos, señales de alerta y recomendaciones para acompañar un uso más saludable de redes sociales en jóvenes.",
    sourceUrl: "https://www.mayoclinic.org/es/healthy-lifestyle/tween-and-teen-health/in-depth/teens-and-social-media-use/art-20474437",
    sourceDomain: "mayoclinic.org",
    topic: "Salud digital",
  },
  {
    category: "Infobae Salud",
    title: "FOMO y adicción al celular en los adolescentes: cómo lograr un uso saludable",
    summary: "Análisis sobre ansiedad por estar desconectado y recomendaciones prácticas para reducir dependencia del celular en jóvenes.",
    sourceUrl: "https://www.infobae.com/salud/2024/07/09/fomo-y-adiccion-al-celular-en-los-adolescentes-como-lograr-un-uso-saludable/",
    sourceDomain: "infobae.com/salud",
    topic: "Salud digital",
  },
];

const LUMI_SPEAKING_FRAMES = [
  "/assets/chatbot/lumi-speaking-01.png",
  "/assets/chatbot/lumi-speaking-02.png",
  "/assets/chatbot/lumi-speaking-04.png",
];

const formatAudioTime = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function Home() {
  const [ranking, setRanking] = useState<RankItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [activeNewsIndex, setActiveNewsIndex] = useState(0);
  const [isNewsTransitioning, setIsNewsTransitioning] = useState(false);
  const [newsTransitionDirection, setNewsTransitionDirection] = useState<"next" | "prev">("next");
  const [isViewerTransitioning, setIsViewerTransitioning] = useState(false);
  const [isVideoViewerOpen, setIsVideoViewerOpen] = useState(false);
  const [isHomeVideoMuted, setIsHomeVideoMuted] = useState(true);
  const [homeVideoVolume, setHomeVideoVolume] = useState(1);
  const [homeVideoCurrentTime, setHomeVideoCurrentTime] = useState(0);
  const [isLumiAlt, setIsLumiAlt] = useState(true);
  const [isLumiSpeaking, setIsLumiSpeaking] = useState(false);
  const [lumiSpeakingFrame, setLumiSpeakingFrame] = useState(0);
  const [lumiAudioCurrentTime, setLumiAudioCurrentTime] = useState(0);
  const [lumiAudioDuration, setLumiAudioDuration] = useState(0);
  const [isLumiAudioReady, setIsLumiAudioReady] = useState(false);
  const [lumiAudioError, setLumiAudioError] = useState<string | null>(null);
  const homeVideoRef = useRef<HTMLVideoElement | null>(null);
  const viewerVideoRef = useRef<HTMLVideoElement | null>(null);
  const lumiAudioRef = useRef<HTMLAudioElement | null>(null);
  const lumiTransitionAudioContextRef = useRef<AudioContext | null>(null);
  const wasVideoViewerOpenRef = useRef(false);
  const videoSyncStateRef = useRef({
    muted: true,
    volume: 1,
    currentTime: 0,
    shouldResume: true,
  });

  const viewerItem = useMemo(() => (viewerIndex !== null ? artGallery[viewerIndex] : null), [viewerIndex]);
  const horizontalDesigns = useMemo(() => artGallery.filter((item) => item.orientation === "landscape"), []);
  const collectionDesigns = useMemo(() => artGallery.filter((item) => item.orientation === "portrait"), []);
  const topFiveRanking = ranking.slice(0, 5);
  const podium = [topFiveRanking[1], topFiveRanking[0], topFiveRanking[2]];
  const activeLumiSpeakingIcon = LUMI_SPEAKING_FRAMES[lumiSpeakingFrame] ?? LUMI_SPEAKING_FRAMES[0];
  const activeNews = relatedNews[activeNewsIndex] ?? relatedNews[0];

  useEffect(() => {
    const loadRanking = async () => {
      const { data } = await supabase
        .from("user_leaderboard")
        .select("user_id, display_name, total_points")
        .order("total_points", { ascending: false })
        .order("updated_at", { ascending: true })
        .limit(5);

      if (!data) {
        return;
      }

      setRanking(
        data.map((item) => ({
          userId: item.user_id,
          displayName: item.display_name,
          totalPoints: item.total_points,
        })),
      );
    };

    void loadRanking();
  }, []);

  useEffect(() => {
    if (viewerIndex === null && !isVideoViewerOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setViewerIndex(null);
        closeVideoViewer();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [viewerIndex, isVideoViewerOpen]);

  useEffect(() => {
    if (!isVideoViewerOpen) {
      if (!wasVideoViewerOpenRef.current) {
        return;
      }
      wasVideoViewerOpenRef.current = false;
      const homeVideo = homeVideoRef.current;
      if (!homeVideo) {
        return;
      }

      const nextState = videoSyncStateRef.current;
      homeVideo.muted = nextState.muted;
      homeVideo.volume = nextState.volume;
      try {
        homeVideo.currentTime = Math.max(0, nextState.currentTime);
      } catch {
        // Keep playing with current position if browser blocks assignment.
      }
      if (nextState.shouldResume) {
        void homeVideo.play().catch(() => {});
      }
      return;
    }

    wasVideoViewerOpenRef.current = true;
    const viewerVideo = viewerVideoRef.current;
    if (!viewerVideo) {
      return;
    }

    const syncViewerState = () => {
      const nextState = videoSyncStateRef.current;
      viewerVideo.muted = nextState.muted;
      viewerVideo.volume = nextState.volume;
      try {
        viewerVideo.currentTime = Math.max(0, nextState.currentTime);
      } catch {
        // Fallback to current position if assignment fails.
      }
      void viewerVideo.play().catch(() => {});
    };

    if (viewerVideo.readyState >= 1) {
      syncViewerState();
      return;
    }

    viewerVideo.addEventListener("loadedmetadata", syncViewerState, { once: true });
    return () => {
      viewerVideo.removeEventListener("loadedmetadata", syncViewerState);
    };
  }, [isVideoViewerOpen]);

  useEffect(() => {
    return () => {
      const context = lumiTransitionAudioContextRef.current;
      if (!context) {
        return;
      }
      void context.close();
      lumiTransitionAudioContextRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Preload speaking frames so mobile doesn't freeze on first loop.
    for (const frameSrc of LUMI_SPEAKING_FRAMES) {
      const image = new Image();
      image.src = frameSrc;
    }
  }, []);

  useEffect(() => {
    if (!isLumiSpeaking) {
      setLumiSpeakingFrame(0);
      return;
    }

    setLumiSpeakingFrame((previous) => (previous + 1) % LUMI_SPEAKING_FRAMES.length);
    const interval = window.setInterval(() => {
      setLumiSpeakingFrame((previous) => (previous + 1) % LUMI_SPEAKING_FRAMES.length);
    }, 140);

    return () => {
      window.clearInterval(interval);
    };
  }, [isLumiSpeaking]);

  const switchDesign = (nextIndex: number) => {
    if (isViewerTransitioning) {
      return;
    }

    setIsViewerTransitioning(true);
    window.setTimeout(() => {
      setViewerIndex(nextIndex);
      setIsViewerTransitioning(false);
    }, 140);
  };

  const goPrevDesign = () => {
    if (viewerIndex === null) {
      return;
    }
    const nextIndex = (viewerIndex - 1 + artGallery.length) % artGallery.length;
    switchDesign(nextIndex);
  };

  const goNextDesign = () => {
    if (viewerIndex === null) {
      return;
    }
    const nextIndex = (viewerIndex + 1) % artGallery.length;
    switchDesign(nextIndex);
  };

  const toggleLumiSpeaking = async () => {
    const audio = lumiAudioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      try {
        if (audio.currentTime >= (Number.isFinite(audio.duration) ? audio.duration : 0)) {
          audio.currentTime = 0;
        }
        setLumiAudioError(null);
        await audio.play();
        setIsLumiSpeaking(true);
      } catch {
        setIsLumiSpeaking(false);
        setLumiAudioError("No se pudo reproducir el audio en este momento.");
      }
      return;
    }

    audio.pause();
    setIsLumiSpeaking(false);
    syncLumiAudioTiming();
  };

  const syncLumiAudioTiming = () => {
    const audio = lumiAudioRef.current;
    if (!audio) {
      return;
    }
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    setLumiAudioCurrentTime(audio.currentTime || 0);
    setLumiAudioDuration(duration);
    if (duration > 0) {
      setIsLumiAudioReady(true);
    }
  };

  const handleLumiAudioSeek = (value: string) => {
    const audio = lumiAudioRef.current;
    if (!audio) {
      return;
    }
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    if (duration <= 0) {
      return;
    }
    const nextTime = Math.max(0, Math.min(Number(value) || 0, duration));
    audio.currentTime = nextTime;
    setLumiAudioCurrentTime(nextTime);
  };

  const switchNews = (direction: "next" | "prev") => {
    if (isNewsTransitioning || relatedNews.length < 2) {
      return;
    }

    setNewsTransitionDirection(direction);
    setIsNewsTransitioning(true);
    window.setTimeout(() => {
      setActiveNewsIndex((previous) =>
        direction === "next"
          ? (previous + 1) % relatedNews.length
          : (previous - 1 + relatedNews.length) % relatedNews.length,
      );
      window.requestAnimationFrame(() => {
        setIsNewsTransitioning(false);
      });
    }, 140);
  };

  const goPrevNews = () => {
    switchNews("prev");
  };

  const goNextNews = () => {
    switchNews("next");
  };

  const syncVideoAudioState = (video: HTMLVideoElement | null) => {
    if (!video) {
      return;
    }
    setIsHomeVideoMuted(video.muted);
    setHomeVideoVolume(video.volume);
    videoSyncStateRef.current.muted = video.muted;
    videoSyncStateRef.current.volume = video.volume;
  };

  const syncVideoTimeState = (video: HTMLVideoElement | null) => {
    if (!video) {
      return;
    }
    setHomeVideoCurrentTime(video.currentTime || 0);
    videoSyncStateRef.current.currentTime = video.currentTime || 0;
  };

  const openVideoViewer = () => {
    const homeVideo = homeVideoRef.current;
    if (homeVideo) {
      syncVideoAudioState(homeVideo);
      syncVideoTimeState(homeVideo);
      videoSyncStateRef.current.shouldResume = !homeVideo.paused && !homeVideo.ended;
      homeVideo.pause();
    }
    setIsVideoViewerOpen(true);
  };

  const closeVideoViewer = () => {
    const expandedVideo = viewerVideoRef.current;
    if (expandedVideo) {
      syncVideoAudioState(expandedVideo);
      syncVideoTimeState(expandedVideo);
      videoSyncStateRef.current.shouldResume = !expandedVideo.paused && !expandedVideo.ended;
      expandedVideo.pause();
    }
    setIsVideoViewerOpen(false);
  };

  const playLumiTransitionSound = () => {
    if (typeof window === "undefined") {
      return;
    }

    const AudioContextConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) {
      return;
    }

    const context = lumiTransitionAudioContextRef.current ?? new AudioContextConstructor();
    lumiTransitionAudioContextRef.current = context;

    if (context.state === "suspended") {
      void context.resume();
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(760, now);
    oscillator.frequency.exponentialRampToValueAtTime(540, now + 0.16);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.16);
  };

  const updateLumiAlt = (nextValue: boolean | ((previous: boolean) => boolean)) => {
    setIsLumiAlt((previous) => {
      const next = typeof nextValue === "function" ? nextValue(previous) : nextValue;
      if (previous && !next) {
        playLumiTransitionSound();
      }
      return next;
    });
  };

  return (
    <div className="focus-login-shell min-h-screen overflow-x-hidden">
      <div className="relative z-10">
        <header className="mx-auto mt-3 flex w-[calc(100%-1rem)] max-w-[calc(72rem-2.5rem)] items-center justify-between gap-3 rounded-[1rem] border-2 border-[#9fd45a] bg-[#dff5b8]/90 px-4 py-3 shadow-[0_10px_20px_-18px_rgba(76,107,31,0.35),0_1px_0_0_rgba(159,212,90,0.9)] md:mt-3 md:w-full md:max-w-[calc(72rem-4rem)] md:gap-3 md:px-8 md:py-5">
          <div className="flex min-w-0 items-center">
            <img
              src="/assets/focuszone/logo.png"
              alt="Focus Zone"
              className="h-14 w-auto object-contain sm:h-16 md:h-[5rem]"
            />
          </div>
          <Link to="/login" className="shrink-0">
            <Button className="focus-cta h-10 rounded-xl border-2 border-[#5b30d9] bg-white/60 px-3 text-base font-bold text-[#5b30d9] hover:bg-[#5b30d9] hover:text-white sm:h-10 sm:px-4 sm:text-base md:h-11 md:px-5">
              Iniciar sesión
            </Button>
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl space-y-3 px-3 pb-8 pt-3 md:px-5 md:space-y-5 lg:px-8 lg:space-y-6">
          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="focus-campaign-card focus-reveal !gap-4 rounded-[1.2rem] p-5 md:p-7 lg:h-full">
              <p className="mt-1 text-center text-[1.35rem] italic leading-tight text-[#5b30d9] sm:mt-3 sm:text-left sm:text-base md:text-lg">La biblioteca como espacio de pausa digital.</p>
              <div className="focus-divider focus-divider-animated mt-4 max-w-xl" />
              <div className="mt-3 grid items-center gap-3 sm:mt-4 sm:gap-4 md:grid-cols-[0.42fr_0.58fr]">
                <button
                  type="button"
                  onClick={() => updateLumiAlt((previous) => !previous)}
                  onMouseEnter={() => updateLumiAlt(false)}
                  onMouseLeave={() => updateLumiAlt(true)}
                  className="mx-auto w-full max-w-[52%] sm:max-w-[44%] md:max-w-[88%]"
                  aria-label="Cambiar expresión de Lumi"
                >
                  <img
                    src={isLumiAlt ? "/assets/focuszone/lumi-home-02.png" : "/assets/focuszone/lumi-home-01.png"}
                    alt={isLumiAlt ? "Lumi 2" : "Lumi 1"}
                    className="h-auto w-full object-contain transition-opacity duration-200"
                    loading="lazy"
                  />
                </button>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:grid-cols-1">
                  <div className="rounded-[0.8rem] border border-[#d1d5db] bg-white/95 p-2.5 sm:p-3">
                    <p className="display-font text-[1.85rem] leading-none text-[#f47c0f] sm:text-3xl">Reto</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[#5b30d9]/80">21 días</p>
                  </div>
                  <div className="rounded-[0.8rem] border border-[#d1d5db] bg-white/95 p-2.5 sm:p-3">
                    <p className="display-font text-[1.85rem] leading-none text-[#f47c0f] sm:text-3xl">+pts</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[#5b30d9]/80">Progreso visible</p>
                  </div>
                  <div className="rounded-[0.8rem] border border-[#d1d5db] bg-white/95 p-2.5 sm:p-3">
                    <p className="display-font text-[1.85rem] leading-none text-[#f47c0f] sm:text-3xl">Pomodoro Salas</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[#5b30d9]/80">Estudio guiado</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-4">
                <Link to="/login" className="w-full">
                  <Button className="focus-cta h-11 w-full rounded-xl bg-[#f47c0f] px-4 text-base font-bold text-white hover:bg-[#dd6900] md:h-14 md:px-8 md:text-lg">
                    Entrar ahora
                  </Button>
                </Link>
                <Link to="/login" className="w-full">
                  <Button className="focus-cta h-11 w-full rounded-xl border-2 border-[#5b30d9] bg-[#f2f0f3] px-4 text-base font-bold text-[#5b30d9] hover:bg-[#5b30d9] hover:text-white md:h-14 md:px-8 md:text-lg">
                    Crear cuenta
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="focus-campaign-card focus-reveal focus-reveal-delay-1 focus-heavy !gap-4 rounded-[1.2rem] border-[#7d4cd8]/70 bg-[#5a2dca] p-5 md:p-7">
              <h2 className="display-font text-4xl text-[#f47c0f] md:text-5xl">Stop Doomscrolling</h2>
              <p className="mt-4 text-base text-white md:text-lg">
                Algunas cosas te distraen. Otras te ayudan a enfocarte. Focus Zone convierte lo digital en aliado de tu estudio.
              </p>
              <p className="text-base text-white md:text-lg">
                Un nuevo mundo en la biblioteca: menos ruido digital, más sesiones de concentración, progreso real y retos semanales.
              </p>
              <div className="focus-divider-animated my-5 h-px w-full bg-gradient-to-r from-[#f47c0f] via-white/70 to-[#b8ee73]/80" />
              <div className="mt-6 space-y-3 text-base font-bold text-white md:text-lg">
                <p className="flex items-center gap-2 text-white"><span className="text-white/90">◉</span>Educación</p>
                <p className="flex items-center gap-2 text-white"><span className="text-white/90">◉</span>Concientización</p>
                <p className="flex items-center gap-2 text-white"><span className="text-white/90">◉</span>Estrategias preventivas</p>
              </div>
            </Card>
          </section>

          <section className="focus-reveal focus-reveal-delay-1">
            <Card className="focus-campaign-card rounded-[1.2rem] p-4 md:p-6">
              <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] lg:gap-6">
                <div className="mx-auto flex h-full w-full max-w-[420px] rounded-[1rem] border border-[#d1d5db] bg-[linear-gradient(180deg,#ffffff_0%,#f7f8ff_100%)] px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-2">
                  <div className="relative w-full overflow-hidden rounded-[1rem] border-2 border-[#d1d5db] bg-[#111111] shadow-[0_14px_24px_-16px_rgba(17,17,17,0.55)]">
                    <video
                      ref={homeVideoRef}
                      className="aspect-[9/16] h-auto w-full object-cover"
                      autoPlay
                      loop
                      muted={isHomeVideoMuted}
                      playsInline
                      controls
                      controlsList="nofullscreen"
                      preload="metadata"
                      onTimeUpdate={() => syncVideoTimeState(homeVideoRef.current)}
                      onVolumeChange={() => syncVideoAudioState(homeVideoRef.current)}
                    >
                      <source src="/assets/focus%20zone%20video3.mp4" type="video/mp4" />
                      Tu navegador no soporta video HTML5.
                    </video>
                    <button
                      type="button"
                      onClick={openVideoViewer}
                      className="absolute right-2 top-2 grid size-8 place-items-center rounded-full border border-white/65 bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
                      aria-label="Abrir video en visor"
                    >
                      <Maximize2 className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="flex h-full flex-col rounded-[1rem] border-2 border-[#d1d5db] bg-[linear-gradient(180deg,#ffffff_0%,#f9fafb_100%)] p-4 md:p-5">
                  <div className="flex items-center gap-2">
                    <Bot className="size-5 text-[#f47c0f]" />
                    <h3 className="display-font text-3xl text-[#5b30d9] md:text-4xl">Chatbot Lumi con IA</h3>
                  </div>
                  <p className="mt-3 text-base text-[#5b30d9] md:text-lg">
                    Lumi es un chatbot con IA que te acompaña con orientación rápida para enfoque, pausas conscientes y uso estratégico de recursos de biblioteca.
                  </p>
                  <div className="mt-3 rounded-[0.9rem] border border-[#d1d5db] bg-[linear-gradient(135deg,#ffffff_0%,#f5f3ff_62%,#eef7ff_100%)] p-3 sm:p-4">
                    <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
                      <div className={`mx-auto rounded-full border-2 p-1.5 sm:mx-0 ${isLumiSpeaking ? "border-[#f47c0f] shadow-[0_0_0_4px_rgba(244,124,15,0.15)]" : "border-[#5b30d9]/30"}`}>
                        <img
                          src={activeLumiSpeakingIcon}
                          alt="Lumi speaking"
                          className="size-16 rounded-full object-cover object-top"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="text-xs font-black uppercase tracking-[0.1em] text-[#5b30d9]/75">Lumi speaking</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${isLumiSpeaking ? "border-[#f47c0f]/45 bg-[#fff3e8] text-[#f47c0f]" : "border-[#d1d5db] bg-white text-[#5b30d9]/70"}`}>
                            {isLumiSpeaking ? "Reproduciendo" : "En pausa"}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#5b30d9]/75">Escucha una muestra de voz de Lumi antes de abrir el chat.</p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      <div className="rounded-xl border border-[#d1d5db] bg-white px-3 py-2 shadow-[0_8px_18px_-14px_rgba(31,41,55,0.45)]">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => void toggleLumiSpeaking()}
                            className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#f47c0f]/45 bg-[#fff4ea] text-[#f47c0f] transition hover:bg-[#f47c0f] hover:text-white"
                            aria-label={isLumiSpeaking ? "Pausar voz de Lumi" : "Reproducir voz de Lumi"}
                          >
                            {isLumiSpeaking ? <Pause className="size-4" /> : <Play className="size-4" />}
                          </button>
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="w-9 shrink-0 text-[11px] font-bold text-[#5b30d9]/75">{formatAudioTime(lumiAudioCurrentTime)}</span>
                            <input
                              type="range"
                              min={0}
                              max={Math.max(1, lumiAudioDuration || 1)}
                              step={0.1}
                              value={Math.min(lumiAudioCurrentTime, Math.max(1, lumiAudioDuration || 1))}
                              onChange={(event) => handleLumiAudioSeek(event.target.value)}
                              disabled={!isLumiAudioReady}
                              className="focus-volume-slider w-full"
                            />
                            <span className="w-9 shrink-0 text-right text-[11px] font-bold text-[#5b30d9]/75">{formatAudioTime(lumiAudioDuration)}</span>
                          </div>
                        </div>
                      </div>
                      {lumiAudioError ? <p className="text-[11px] font-semibold text-[#c74b00]">{lumiAudioError}</p> : null}
                      <audio
                        ref={lumiAudioRef}
                        preload="metadata"
                        onPlay={() => {
                          setIsLumiSpeaking(true);
                          syncLumiAudioTiming();
                        }}
                        onPause={() => {
                          setIsLumiSpeaking(false);
                          syncLumiAudioTiming();
                        }}
                        onEnded={() => {
                          setIsLumiSpeaking(false);
                          setLumiAudioCurrentTime(0);
                          syncLumiAudioTiming();
                        }}
                        onCanPlay={() => {
                          setIsLumiAudioReady(true);
                          setLumiAudioError(null);
                        }}
                        onError={() => {
                          setIsLumiSpeaking(false);
                          setIsLumiAudioReady(false);
                          setLumiAudioError("No se pudo cargar el audio de Lumi.");
                        }}
                        onTimeUpdate={syncLumiAudioTiming}
                        onLoadedMetadata={syncLumiAudioTiming}
                        className="hidden"
                      >
                        <source src="/assets/audio_home_lumi.mp3" type="audio/mpeg" />
                        Tu navegador no soporta audio HTML5.
                      </audio>
                    </div>
                  </div>
                  <div className="mt-4 grid items-stretch gap-3 sm:grid-cols-2">
                    <div className="h-full rounded-[0.75rem] border border-[#d1d5db] bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-[#f47c0f]">Te ayuda con</p>
                      <p className="mt-1 text-sm font-semibold text-[#5b30d9]">Plan de estudio corto, manejo de distracciones y ritmo de trabajo.</p>
                    </div>
                    <div className="h-full rounded-[0.75rem] border border-[#d1d5db] bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-[#f47c0f]">Conecta contigo</p>
                      <p className="mt-1 text-sm font-semibold text-[#5b30d9]">Recomendaciones de recursos, cursos y rutas de exploración.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section className="grid items-stretch gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="focus-campaign-card focus-reveal focus-reveal-delay-2 flex h-full flex-col rounded-[1.2rem] border-[#7d4cd8]/70 bg-[#5a2dca] p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="display-font text-3xl text-white md:text-4xl">Recursos de la biblioteca</h3>
              </div>
              <div className="grid flex-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {libraryResourceHighlights.map((item, index) => {
                  const isFeatured = index === 0;
                  const isLast = index === libraryResourceHighlights.length - 1;
                  return (
                  <div
                    key={item.label}
                    className={`rounded-[0.9rem] border-2 border-white/35 p-4 shadow-[0_10px_20px_-18px_rgba(69,36,179,0.45)] ${
                      isFeatured
                        ? "sm:col-span-2 bg-[linear-gradient(120deg,#fff8ef_0%,#ffffff_56%,#f7f2ff_100%)]"
                        : `${isLast ? "sm:col-span-2" : ""} bg-white/90 sm:min-h-[138px]`
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {item.value ? (
                        <p className={`display-font leading-none text-[#f47c0f] ${isFeatured ? "text-5xl md:text-6xl" : "text-4xl md:text-5xl"}`}>{item.value}</p>
                      ) : (
                        <span className="inline-flex size-8 items-center justify-center border border-[#f47c0f]/35 bg-[#fff7ef] text-[#f47c0f]">
                          <item.Icon className="size-4" />
                        </span>
                      )}
                      {item.value ? <item.Icon className="size-5 text-[#5b30d9]/65" /> : null}
                    </div>
                    <p className={`font-bold text-[#5b30d9] ${item.value ? "mt-2" : "mt-3"} ${isFeatured ? "text-[1.2rem]" : "text-[1.05rem]"}`}>{item.label}</p>
                    {isFeatured ? <p className="mt-1 text-sm font-semibold text-[#5b30d9]/70">Herramientas clave para potenciar estudio e investigación.</p> : null}
                  </div>
                  );
                })}
              </div>
            </div>

            <Card className="focus-campaign-card focus-heavy focus-reveal focus-reveal-delay-2 flex h-full flex-col rounded-[1.2rem] border-[#7d4cd8]/70 bg-[#5a2dca] p-5 md:p-7">
              <div className="mb-4 flex items-center gap-2 text-white">
                <Trophy className="size-5 text-white" />
                <h3 className="display-font text-3xl md:text-4xl">Ranking en vivo</h3>
              </div>

              <div className="grid min-h-[220px] flex-1 grid-cols-3 items-end gap-2 md:min-h-[250px] md:gap-3">
                {podium.map((entry, index) => {
                  const isCenter = index === 1;
                  const podiumHeight = isCenter ? "h-full" : "h-[74%]";
                  return (
                    <div
                      key={entry?.userId ?? `empty-${index}`}
                      className={`${podiumHeight} rounded-[0.7rem] border px-2 py-3 text-center md:px-3 ${
                        isCenter
                          ? "border-[#7aa048]/60 bg-[#dff5b8] shadow-[0_12px_20px_-18px_rgba(122,160,72,0.75)]"
                          : "border-white/35 bg-white/95"
                      }`}
                    >
                      {entry ? (
                        <>
                          <p className={`mb-1 text-xs font-bold uppercase tracking-wide ${isCenter ? "text-[#5b30d9]" : "text-[#5b30d9]/75"}`}>
                            {isCenter ? "#1" : index === 0 ? "#2" : "#3"}
                          </p>
                          <p className="line-clamp-2 font-bold text-[#5b30d9]">{entry.displayName}</p>
                          <p className="mt-1 text-sm font-bold text-[#f47c0f]">{entry.totalPoints} pts</p>
                        </>
                      ) : (
                        <div className="flex h-full min-h-[64px] items-center justify-center md:min-h-[76px]">
                          <p className="text-lg font-bold text-[#5b30d9]/45">-</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {topFiveRanking.length === 0 ? <p className="mt-3 text-sm font-bold text-white/80">Aún no hay datos de ranking.</p> : null}
              {topFiveRanking.length > 3 && (
                <div className="mt-3 space-y-2">
                  {topFiveRanking.slice(3, 5).map((entry, index) => (
                    <div key={entry.userId} className="flex items-center justify-between rounded-[0.55rem] border border-white/30 bg-white/95 p-2 text-sm">
                      <span className="font-bold text-[#5b30d9]">#{index + 4} {entry.displayName}</span>
                      <span className="font-bold text-[#f47c0f]">{entry.totalPoints} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          <section className="focus-reveal focus-reveal-delay-1 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="display-font text-3xl text-[#5b30d9] md:text-4xl">Lo que descubrimos</h2>
              <span className="focus-kicker hidden border-[#b7d989]/55 bg-[#f4fbe8] text-[#7aa048] md:inline-flex">Datos de investigación</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
              {researchStats.map((stat) => (
                <Card key={stat.label} className="focus-campaign-card min-h-[138px] rounded-[0.85rem] border-[#d3c7f5] p-3 md:min-h-[unset] md:rounded-[1rem] md:p-4">
                  <div className="mb-1.5 flex items-center justify-between md:mb-2">
                    <div className="h-1 w-10 rounded-full bg-[#d4ebad] md:h-1.5 md:w-14" />
                    <span className="text-xs font-black text-[#7aa048] md:text-sm">{stat.icon}</span>
                  </div>
                  <p className="display-font text-3xl text-[#f47c0f] md:text-5xl">{stat.value}</p>
                  <p className="mt-1.5 text-xs leading-snug font-bold text-[#5b30d9] md:mt-2 md:text-sm">{stat.label}</p>
                </Card>
              ))}
            </div>
          </section>

          <section className="grid items-stretch gap-4 pb-1 lg:grid-cols-2">
            <Card className="focus-campaign-card focus-grid focus-reveal h-full p-5 md:p-7 lg:min-h-[430px]">
              <div className="flex items-center gap-2">
                <MessageSquareQuote className="size-5 text-[#f47c0f]" />
                <h3 className="display-font text-3xl text-[#5b30d9] md:text-4xl">Noticias relacionadas</h3>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-[0.75rem] border border-[#d1d5db] bg-white/75 px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[#f47c0f]">
                    <Newspaper className="size-3.5 text-[#f47c0f]" />
                    Preview de noticias
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-[#5b30d9]/25 bg-[#f7f5ff] px-2 py-0.5 text-[11px] font-bold text-[#5b30d9]/80">
                      {activeNewsIndex + 1}/{relatedNews.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={goPrevNews}
                        disabled={isNewsTransitioning}
                        aria-label="Noticia anterior"
                        className="inline-flex size-7 items-center justify-center rounded-full border border-[#f47c0f]/45 bg-white text-[#f47c0f] hover:bg-[#fff1e5] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={goNextNews}
                        disabled={isNewsTransitioning}
                        aria-label="Siguiente noticia"
                        className="inline-flex size-7 items-center justify-center rounded-full border border-[#f47c0f]/45 bg-white text-[#f47c0f] hover:bg-[#fff1e5] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <article className="overflow-hidden rounded-[1rem] border-2 border-[#d1d5db] bg-[linear-gradient(145deg,#ffffff_0%,#f8faff_100%)] shadow-[0_14px_24px_-20px_rgba(17,24,39,0.45)]">
                  <div
                    className={`grid gap-0 transition-all duration-200 will-change-transform sm:grid-cols-[170px_1fr] ${
                      isNewsTransitioning
                        ? newsTransitionDirection === "next"
                          ? "translate-x-2 opacity-0"
                          : "-translate-x-2 opacity-0"
                        : "translate-x-0 opacity-100"
                    }`}
                  >
                    <div className="relative border-b border-[#d1d5db] bg-[linear-gradient(160deg,#f2f0ff_0%,#eef7ff_100%)] p-4 sm:border-b-0 sm:border-r">
                      <span className="absolute right-2 top-2 rounded-full bg-[#f47c0f] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-white">
                        Noticia
                      </span>
                      <div className="mt-3 inline-flex size-11 items-center justify-center rounded-[0.8rem] border border-[#5b30d9]/25 bg-white text-[#5b30d9]">
                        <Newspaper className="size-5" />
                      </div>
                      <p className="mt-3 text-xs font-black uppercase tracking-[0.1em] text-[#f47c0f]">{activeNews.category}</p>
                      <p className="mt-1 text-xs font-semibold text-[#5b30d9]/75">{activeNews.sourceDomain}</p>
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="rounded-full border border-[#9fd45a]/45 bg-[#eff8de] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#4f8a2d]">
                          {activeNews.topic}
                        </p>
                        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#4f8a2d]/80">Fuente externa</p>
                      </div>
                      <p className="mt-2 text-[1.12rem] font-extrabold leading-[1.2] text-[#5b30d9]">{activeNews.title}</p>
                      <p className="mt-2 text-sm font-medium leading-[1.45] text-[#5b30d9]/80">{activeNews.summary}</p>
                      {activeNews.sourceUrl ? (
                        <a
                          href={activeNews.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#f47c0f]/45 bg-[#fff4e8] px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] text-[#f47c0f] hover:bg-[#ffe6d1]"
                        >
                          Leer noticia completa
                          <ArrowUpRight className="size-3.5" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>

              </div>
            </Card>

            <Card className="focus-campaign-card focus-grid focus-reveal focus-reveal-delay-1 h-full rounded-[1.2rem] p-4 md:p-7 lg:min-h-[430px]">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-5 text-[#f47c0f]" />
                <h3 className="display-font text-2xl leading-tight text-[#5b30d9] md:text-4xl">El problema no es lo digital</h3>
              </div>
              <p className="mt-1.5 text-sm font-bold uppercase tracking-[0.08em] text-[#5b30d9]/70 md:mt-2 md:text-sm">Manifiesto de atención consciente</p>
              <p className="mt-1 text-xs text-[#5b30d9]/65 md:text-sm">Ideas clave para transformar hábitos digitales en acciones concretas.</p>
              <div className="focus-divider mt-3 max-w-xl md:mt-4" />
              <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
                {manifestoLines.map((line, index) => (
                  <div key={line} className="rounded-[0.75rem] border border-[#d1d5db] bg-white/95 p-2.5 sm:p-3">
                    <p className="mb-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[#f47c0f] sm:mb-2 sm:text-xs">Clave {index + 1}</p>
                    <p className="text-sm font-semibold leading-[1.3] text-[#5b30d9] sm:text-[1rem] sm:leading-[1.35]">{line}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="focus-campaign-card focus-reveal focus-reveal-delay-1 rounded-[1.2rem] border-[#7d4cd8]/70 bg-[#5a2dca] p-5 md:p-7 lg:col-span-2">
              <div className="flex items-center gap-2">
                <BookOpenText className="size-5 text-white" />
                <h3 className="display-font text-3xl text-white md:text-4xl">Biblioteca como alternativa</h3>
              </div>
              <p className="mt-3 text-[1.02rem] leading-relaxed text-white md:text-lg">
                Focus Zone no es solo una app de pomodoro: Conecta hábitos saludables con recursos reales de la biblioteca como espacio de exploración tecnológica y bienestar académico.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
                {libraryPillars.map(({ label, Icon }) => (
                  <span key={label} className="focus-pill w-full justify-start border-white/35 bg-white/95 text-[#5a2dca] sm:w-auto">
                    <Icon className="size-3.5 text-[#f47c0f]" />
                    {label}
                  </span>
                ))}
              </div>
            </Card>
          </section>

          <Card className="focus-campaign-card focus-reveal focus-reveal-delay-1 bg-[linear-gradient(180deg,#ffffff_0%,#f9fafb_100%)] p-4 md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="display-font text-3xl text-[#5b30d9] md:text-4xl">Galería de arte</h3>
                <p className="mt-1 text-sm font-semibold text-[#5b30d9]/75">Colección visual Focus Zone. Haz clic para ampliar.</p>
              </div>
              <span className="focus-sticker">Piezas de campaña</span>
            </div>

            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#5b30d9]/70">Carrusel horizontal</p>
                <p className="text-xs text-[#5b30d9]/70">Piezas panorámicas</p>
              </div>
              <div className="w-full overflow-x-auto rounded-[1.15rem] border-2 border-[#5b30d9]/45">
                <div className="flex snap-x snap-mandatory gap-3 p-3">
                  {horizontalDesigns.map((item) => {
                    const originalIndex = artGallery.findIndex((entry) => entry.src === item.src);
                    return (
                      <button
                        key={item.src}
                        type="button"
                        onClick={() => setViewerIndex(originalIndex)}
                        className="focus-gallery-tile group w-full min-w-full snap-start overflow-hidden rounded-[1rem] border border-[#5b30d9]/20 bg-white text-left transition hover:border-[#5b30d9]/45"
                      >
                        <div className="relative rounded-[0.85rem] bg-[#f9fafb] p-3">
                          <img src={item.src} alt={item.title} className="h-auto w-full object-contain" loading="lazy" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {collectionDesigns.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {collectionDesigns.map((item) => {
                  const originalIndex = artGallery.findIndex((entry) => entry.src === item.src);
                  return (
                    <button
                      key={item.src}
                      type="button"
                      onClick={() => setViewerIndex(originalIndex)}
                      className="focus-gallery-tile group block w-full overflow-hidden rounded-[1rem] border border-[#5b30d9]/20 bg-white text-left shadow-[0_10px_24px_-18px_rgba(37,10,110,0.5)] transition hover:-translate-y-0.5 hover:border-[#5b30d9]/45"
                    >
                      <div className="relative rounded-[0.85rem] bg-[#f9fafb] p-2">
                        <img src={item.src} alt={item.title} className="aspect-[3/4] w-full object-contain" loading="lazy" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <section className="focus-reveal focus-reveal-delay-2">
            <Card className="focus-campaign-card border-[#7d4cd8]/70 bg-[#5a2dca] p-5 md:p-7">
              <h3 className="display-font text-3xl text-white md:text-4xl">Sobre el proyecto</h3>
              <p className="mt-3 text-base text-white md:text-lg">
                Es una campaña transmedia de concientización que invita a los estudiantes a reflexionar sobre sus hábitos digitales, posicionando la biblioteca como un espacio de pausa, concentración y aprendizaje, y promoviendo un uso más consciente de la tecnología.
              </p>
            </Card>
          </section>

          <section className="focus-reveal focus-reveal-delay-2">
            <Card className="focus-campaign-card p-5 md:p-7">
              <h3 className="display-font text-3xl text-[#5b30d9] md:text-4xl">Desarrollo técnico</h3>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {technicalLogos.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 rounded-[0.8rem] border border-[#d1d5db] bg-white p-2.5">
                    <span className="grid size-9 place-items-center rounded-[0.65rem] border border-[#d1d5db] bg-[#f9fafb]">
                      <img src={item.logo} alt={item.name} className="size-5 object-contain" loading="lazy" />
                    </span>
                    <span className="text-sm font-bold text-[#5b30d9]">{item.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </main>

        {viewerItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f2f0f3]/95 p-3 md:p-8" onClick={() => setViewerIndex(null)}>
            <div className="relative w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
              <div className="mb-3 flex items-center justify-end text-[#2a2a2a]">
                <button
                  type="button"
                  onClick={() => setViewerIndex(null)}
                  className="grid size-10 place-items-center rounded-full border border-[#5b30d9]/60 bg-white/95 text-[#5b30d9] shadow-sm hover:bg-[#ece8f9]"
                  aria-label="Cerrar visor"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="relative flex items-center justify-center overflow-hidden rounded-[1.2rem] border border-[#5b30d9]/25 bg-white">
                <img
                  src={viewerItem.src}
                  alt={viewerItem.title}
                  className={`object-contain ${
                    viewerItem.orientation === "portrait"
                      ? "max-h-[88vh] w-auto max-w-[min(92vw,560px)]"
                      : "max-h-[84vh] w-full"
                  } transition-opacity duration-200 ${isViewerTransitioning ? "opacity-0" : "opacity-100"}`}
                />
                <button
                  type="button"
                  onClick={goPrevDesign}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-[#5b30d9]/40 bg-white/55 px-2 py-1 text-xs font-bold text-[#5b30d9] hover:bg-white/75 md:px-3 md:py-2 md:text-sm"
                  aria-label="Imagen anterior"
                >
                  {"<"}
                </button>
                <button
                  type="button"
                  onClick={goNextDesign}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-[#5b30d9]/40 bg-white/55 px-2 py-1 text-xs font-bold text-[#5b30d9] hover:bg-white/75 md:px-3 md:py-2 md:text-sm"
                  aria-label="Imagen siguiente"
                >
                  {">"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isVideoViewerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f2f0f3]/95 p-3 md:p-8" onClick={closeVideoViewer}>
            <div className="relative w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
              <div className="mb-3 flex items-center justify-end text-[#2a2a2a]">
                <button
                  type="button"
                  onClick={closeVideoViewer}
                  className="grid size-10 place-items-center rounded-full border border-[#5b30d9]/60 bg-white/95 text-[#5b30d9] shadow-sm hover:bg-[#ece8f9]"
                  aria-label="Cerrar visor de video"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="relative flex items-center justify-center overflow-hidden rounded-[1.2rem] border border-[#5b30d9]/25 bg-white p-2 md:p-3">
                <video
                  ref={viewerVideoRef}
                  className="max-h-[84vh] w-full rounded-[1rem] bg-black object-contain"
                  loop
                  muted={isHomeVideoMuted}
                  playsInline
                  controls
                  controlsList="nofullscreen"
                  preload="metadata"
                  onTimeUpdate={() => syncVideoTimeState(viewerVideoRef.current)}
                  onVolumeChange={() => syncVideoAudioState(viewerVideoRef.current)}
                >
                  <source src="/assets/focus%20zone%20video3.mp4" type="video/mp4" />
                  Tu navegador no soporta video HTML5.
                </video>
              </div>
            </div>
          </div>
        )}

        <footer className="mx-auto w-full max-w-6xl px-5 pb-10 pt-4 md:px-8">
          <div className="border-t border-[#5b30d9]/25 pt-5 text-sm text-[#5b30d9]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>Proyecto de grado · Diseño de Comunicación 2026 · Universidad El Bosque - Catalina Barrera</p>
              <p className="font-bold">Focus Zone</p>
            </div>
            <p className="mt-2 text-xs text-[#5b30d9]/75 md:text-sm">
              Campaña para hábitos digitales saludables y visibilización de la biblioteca como espacio de pausa y enfoque.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}







