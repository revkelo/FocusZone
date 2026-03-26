import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { BookOpenText, Bot, Building2, Cpu, Database, GraduationCap, Lightbulb, MessageSquareQuote, Monitor, Smartphone, Sparkles, Target, Trophy, WandSparkles, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "../components/ui/carousel";
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

const howFocusZoneWorks = [
  "Inicia un pomodoro",
  "Entra a una sala de enfoque",
  "Completa retos semanales",
  "Suma puntos por constancia",
  "Mira tu posición en el ranking",
  "Descubre recursos de la biblioteca",
];

const researchStats = [
  { value: "89%", label: "Dedica más de 3 horas al día a redes sociales", icon: "●" },
  { value: "64%", label: "Nota afiches físicos en la biblioteca", icon: "◆" },
  { value: "74%", label: "Ve pantallas digitales de biblioteca y universidad", icon: "◼" },
  { value: "52", label: "Personas participaron en la muestra del formulario", icon: "▲" },
];

const manifestoLines = [
  "El problema no es lo digital, es como lo usamos.",
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
  { value: "", label: "Realidad aumentada", Icon: Sparkles },
  { value: "", label: "Bases de datos académicos", Icon: Database },
];

const collectiveReflections = [
  "Instagram me quitó una hora",
  "Los chats me sacan del foco",
  "Entré a estudiar y terminé viendo reels",
];

const appScreenshots = [
  { src: "/assets/Captura de pantalla 2026-03-26 165341.png", title: "Vista de la aplicación 1" },
  { src: "/assets/Captura de pantalla 2026-03-26 165431.png", title: "Vista de la aplicación 2" },
];

export default function Home() {
  const [ranking, setRanking] = useState<RankItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [appScreenshotViewer, setAppScreenshotViewer] = useState<{ src: string; title: string } | null>(null);
  const [horizontalCarouselApi, setHorizontalCarouselApi] = useState<CarouselApi | null>(null);
  const [activeHorizontalSlide, setActiveHorizontalSlide] = useState(0);
  const [isViewerTransitioning, setIsViewerTransitioning] = useState(false);

  const viewerItem = useMemo(() => (viewerIndex !== null ? artGallery[viewerIndex] : null), [viewerIndex]);
  const horizontalDesigns = useMemo(() => artGallery.filter((item) => item.orientation === "landscape"), []);
  const collectionDesigns = useMemo(() => artGallery.filter((item) => item.orientation === "portrait"), []);
  const podium = [ranking[1], ranking[0], ranking[2]];

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
    if (viewerIndex === null) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setViewerIndex(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [viewerIndex]);

  useEffect(() => {
    if (!horizontalCarouselApi) {
      return;
    }

    const onSelect = () => {
      setActiveHorizontalSlide(horizontalCarouselApi.selectedScrollSnap());
    };

    onSelect();
    horizontalCarouselApi.on("select", onSelect);
    horizontalCarouselApi.on("reInit", onSelect);

    return () => {
      horizontalCarouselApi.off("select", onSelect);
    };
  }, [horizontalCarouselApi]);

  useEffect(() => {
    if (!horizontalCarouselApi) {
      return;
    }

    const autoplay = window.setInterval(() => {
      horizontalCarouselApi.scrollNext();
    }, 3200);

    return () => {
      window.clearInterval(autoplay);
    };
  }, [horizontalCarouselApi]);

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

  return (
    <div className="focus-shell focus-grain focus-rings focus-no-stars focus-official-flat min-h-screen overflow-x-hidden">
      <div className="focus-figure-layer" aria-hidden>
        <div className="focus-figure-arc-left" />
        <div className="focus-figure-arc-right" />
        <div className="focus-figure-arc-right-2" />
        <div className="focus-figure-right-pill" />
        <div className="focus-figure-right-square" />
        <div className="focus-figure-dot focus-figure-dot-a" />
        <div className="focus-figure-dot focus-figure-dot-b" />
      </div>
      <div className="relative z-10">
        <header className="mx-auto mt-2 flex w-[calc(100%-1rem)] max-w-[calc(72rem-2.5rem)] items-center justify-between gap-2 rounded-[1rem] border-2 border-[#8f74ef]/55 bg-[#ece8f9]/90 px-3 py-3 shadow-[0_12px_22px_-18px_rgba(69,36,179,0.6),0_2px_0_0_rgba(143,116,239,0.55)] md:mt-0 md:w-full md:max-w-[calc(72rem-4rem)] md:gap-3 md:px-8 md:py-5">
          <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
            <div className="relative grid size-10 place-items-center rounded-none bg-[#f47c0f] text-white shadow-[0_8px_16px_-10px_rgba(244,124,15,0.85)] md:size-11">
              <Target className="size-5" />
            </div>
            <p className="display-font truncate whitespace-nowrap text-[1.55rem] leading-none text-[#5b30d9] sm:text-[1.7rem] md:text-[2.25rem]">Focus Zone</p>
          </div>
          <Link to="/login" className="shrink-0">
            <Button className="focus-cta h-9 rounded-none border-2 border-[#5b30d9] bg-white/60 px-3 text-sm font-bold text-[#5b30d9] hover:bg-[#5b30d9] hover:text-white sm:h-10 sm:px-4 sm:text-base md:h-11 md:px-5">
              Iniciar sesión
            </Button>
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl space-y-6 px-5 pb-16 pt-6 md:px-8 md:space-y-8">
          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="focus-campaign-card focus-reveal rounded-[1.2rem] p-5 md:p-7">
              <p className="mt-3 text-base italic text-[#7d4cd8] md:text-lg">La biblioteca como espacio de pausa digital.</p>
              <h1 className="focus-poster-title mt-3 text-[3.2rem] leading-[0.86] sm:text-[4.2rem] lg:text-[4.9rem]">
                Focus
                <br />
                <span className="text-[#f47c0f] [text-shadow:2px_2px_0_#5b30d9]">Zone</span>
              </h1>
              <div className="focus-divider focus-divider-animated mt-4 max-w-xl" />
              <p className="mt-4 max-w-xl text-[1.05rem] text-[#4a2dba] md:text-lg">
                Un nuevo mundo en la biblioteca: menos ruido digital, más sesiones de concentración, progreso real y retos semanales.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <Link to="/login" className="w-full">
                  <Button className="focus-cta h-12 w-full rounded-none bg-[#f47c0f] px-4 text-base font-bold text-white hover:bg-[#dd6900] md:h-14 md:px-8 md:text-lg">
                    Entrar ahora
                  </Button>
                </Link>
                <Link to="/login" className="w-full">
                  <Button className="focus-cta h-12 w-full rounded-none border-2 border-[#5b30d9] bg-[#f2f0f3] px-4 text-base font-bold text-[#5b30d9] hover:bg-[#5b30d9] hover:text-white md:h-14 md:px-8 md:text-lg">
                    Crear cuenta
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="focus-campaign-purple focus-reveal focus-reveal-delay-1 focus-heavy !bg-[#5b30d9] p-5 md:p-7">
              <h2 className="display-font text-4xl text-[#b8ee73] md:text-5xl">Stop Doomscrolling</h2>
              <p className="mt-4 text-base text-[#f2f0f3] md:text-lg">
                Algunas cosas te distraen. Otras te ayudan a enfocarte. Focus Zone convierte lo digital en aliado de tu estudio.
              </p>
              <div className="focus-divider-animated my-5 h-px w-full bg-gradient-to-r from-[#f47c0f] via-[#f2f0f3] to-[#b8ee73]/80" />
              <div className="mt-6 space-y-3 text-base font-bold text-white md:text-lg">
                <p>Educación</p>
                <p>Concientización</p>
                <p>Estrategias preventivas</p>
              </div>
            </Card>
          </section>

          <section className="grid items-stretch gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="focus-campaign-card focus-reveal focus-reveal-delay-2 flex h-full flex-col rounded-[1.2rem] bg-[linear-gradient(165deg,#fcfbff_0%,#f3ecff_100%)] p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="display-font text-3xl text-[#5b30d9] md:text-4xl">Recursos de la biblioteca</h3>
                <span className="focus-kicker hidden md:inline-flex">Disponibles hoy</span>
              </div>
              <div className="grid flex-1 content-start gap-3 sm:grid-cols-2 sm:gap-4">
                {libraryResourceHighlights.map((item) => (
                  <div key={item.label} className="rounded-[0.9rem] border-2 border-[#d4c8f6] bg-white/90 p-4 shadow-[0_10px_20px_-18px_rgba(69,36,179,0.45)]">
                    <div className="flex items-start justify-between gap-3">
                      {item.value ? (
                        <p className="display-font text-4xl leading-none text-[#f47c0f] md:text-5xl">{item.value}</p>
                      ) : (
                        <span className="inline-flex size-8 items-center justify-center border border-[#f47c0f]/35 bg-[#fff7ef] text-[#f47c0f]">
                          <item.Icon className="size-4" />
                        </span>
                      )}
                      {item.value ? <item.Icon className="size-5 text-[#5b30d9]/65" /> : null}
                    </div>
                    <p className={`font-bold text-[#5b30d9] ${item.value ? "mt-2" : "mt-3"} text-[1.05rem]`}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card className="focus-campaign-cream focus-heavy focus-reveal focus-reveal-delay-2 flex h-full flex-col rounded-[1.2rem] bg-[#fff0df] p-5 md:p-7">
              <div className="mb-4 flex items-center gap-2 text-[#5b30d9]">
                <Trophy className="size-5 text-[#f47c0f]" />
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
                          ? "border-[#f47c0f]/55 bg-[#ffe8cf] shadow-[0_12px_20px_-18px_rgba(244,124,15,0.75)]"
                          : "border-[#5b30d9]/20 bg-white"
                      }`}
                    >
                      {entry ? (
                        <>
                          <p className={`mb-1 text-xs font-bold uppercase tracking-wide ${isCenter ? "text-[#5b30d9]" : "text-[#5b30d9]/70"}`}>
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
              {ranking.length === 0 ? <p className="mt-3 text-sm font-bold text-[#5b30d9]/70">Aún no hay datos de ranking.</p> : null}
              {ranking.length > 3 && (
                <div className="mt-3 space-y-2">
                  {ranking.slice(3).map((entry, index) => (
                    <div key={entry.userId} className="flex items-center justify-between rounded-[0.55rem] border border-[#5b30d9]/15 bg-white p-2 text-sm">
                      <span className="font-bold text-[#5b30d9]">#{index + 4} {entry.displayName}</span>
                      <span className="font-bold text-[#f47c0f]">{entry.totalPoints} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          <section className="grid gap-4">
            <Card className="focus-campaign-card focus-reveal focus-reveal-delay-2 p-5 md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="display-font text-3xl text-[#5b30d9] md:text-4xl">Cómo funciona Focus Zone</h2>
                <span className="focus-kicker border-[#b7d989]/55 bg-[#f4fbe8] text-[#7aa048]">Ruta de enfoque</span>
              </div>
              <div className="focus-divider focus-divider-animated mt-4" />
              <div className="mt-5 grid gap-2 md:grid-cols-2">
                {howFocusZoneWorks.map((item, index) => (
                  <div key={item} className="flex items-center gap-3 border-2 border-[#d4c8f6] bg-[linear-gradient(90deg,#f5faee_0_7px,#ffffff_7px)] p-3">
                    <span className="grid size-8 place-items-center border border-[#f47c0f]/55 bg-[#fff0df] text-sm font-black text-[#f47c0f]">
                      {index + 1}
                    </span>
                    <p className="text-sm font-bold text-[#5b30d9] md:text-base">{item}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section className="focus-reveal focus-reveal-delay-1">
            <Card className="focus-campaign-card rounded-[1.2rem] p-4 md:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="size-5 text-[#f47c0f]" />
                  <h3 className="display-font text-3xl text-[#5b30d9] md:text-4xl">Screenshots de la app</h3>
                </div>
                <span className="focus-kicker border-[#b7d989]/55 bg-[#f4fbe8] text-[#7aa048]">Vista de interfaz</span>
              </div>

              <div className="overflow-x-auto border-2 border-[#5b30d9]/35 bg-[linear-gradient(180deg,#f7f5ff_0%,#f0ebff_100%)] p-3 md:p-5">
                <div className="mx-auto flex w-max min-w-full gap-3 md:gap-4">
                  {appScreenshots.map((shot) => (
                    <article key={shot.src} className="w-[180px] shrink-0 sm:w-[210px] md:w-[230px]">
                      <button
                        type="button"
                        onClick={() => setAppScreenshotViewer({ src: shot.src, title: shot.title })}
                        className="w-full rounded-[1.1rem] border border-[#d9cff7] bg-white p-2 text-left shadow-[0_18px_30px_-24px_rgba(64,30,170,0.75)] transition hover:-translate-y-0.5 hover:border-[#5b30d9]/45 sm:p-3"
                      >
                        <div className="overflow-hidden rounded-[0.8rem] border border-[#cec1f5] bg-[#f7f5ff]">
                          <div className="flex h-[320px] items-center justify-center sm:h-[360px] md:h-[390px]">
                            <img src={shot.src} alt={shot.title} className="h-full w-full object-contain object-center" loading="lazy" />
                          </div>
                        </div>
                      </button>
                      <p className="mt-2 text-center text-sm font-semibold text-[#5b30d9]">{shot.title}</p>
                    </article>
                  ))}
                </div>
              </div>
            </Card>
          </section>

          <section className="focus-reveal focus-reveal-delay-1">
            <Card className="focus-campaign-card rounded-[1.2rem] p-5 md:p-7">
              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:gap-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Bot className="size-5 text-[#f47c0f]" />
                    <h2 className="display-font text-3xl text-[#5b30d9] md:text-4xl">Chatbot Lumi</h2>
                  </div>
                  <p className="mt-3 max-w-2xl text-base text-[#5b30d9] md:text-lg">
                    Lumi te acompaña con orientación rápida para enfoque, pausas conscientes y uso estratégico de recursos de biblioteca.
                  </p>
                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    <div className="rounded-[0.75rem] border border-[#d9cff7] bg-white/95 p-3">
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-[#f47c0f]">Te ayuda con</p>
                      <p className="mt-1 text-sm font-semibold text-[#4d33bf] md:text-base">Plan de estudio corto, manejo de distracciones y ritmo de trabajo.</p>
                    </div>
                    <div className="rounded-[0.75rem] border border-[#d9cff7] bg-white/95 p-3">
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-[#f47c0f]">Conecta contigo</p>
                      <p className="mt-1 text-sm font-semibold text-[#4d33bf] md:text-base">Recomendaciones de recursos, cursos y rutas de exploración.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1rem] border-2 border-[#d4c8f6] bg-[linear-gradient(180deg,#f9f5ff_0%,#ffffff_100%)] p-4 md:p-5">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#5b30d9]/70">Prueba estas preguntas</p>
                  <div className="mt-3 space-y-2.5">
                    <div className="rounded-[0.65rem] border border-[#d9cff7] bg-white p-2.5 text-sm font-semibold text-[#5b30d9]">
                      "Dame un plan de enfoque de 25 minutos para empezar a estudiar."
                    </div>
                    <div className="rounded-[0.65rem] border border-[#d9cff7] bg-white p-2.5 text-sm font-semibold text-[#5b30d9]">
                      "¿Qué recurso de biblioteca me sirve para mi tema?"
                    </div>
                    <div className="rounded-[0.65rem] border border-[#d9cff7] bg-white p-2.5 text-sm font-semibold text-[#5b30d9]">
                      "Ayúdame a salir del scroll y volver al foco."
                    </div>
                  </div>
                  <Link to="/login" className="mt-4 inline-block w-full">
                    <Button className="focus-cta h-11 w-full rounded-none border-2 border-[#5b30d9] bg-white text-base font-bold text-[#5b30d9] hover:bg-[#5b30d9] hover:text-white">
                      Abrir chat con Lumi
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </section>

          <section className="focus-reveal focus-reveal-delay-1 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="display-font text-3xl text-[#5b30d9] md:text-4xl">Lo que descubrimos</h2>
              <span className="focus-kicker hidden border-[#b7d989]/55 bg-[#f4fbe8] text-[#7aa048] md:inline-flex">Datos de investigación</span>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {researchStats.map((stat) => (
                <Card key={stat.label} className="focus-campaign-card rounded-[1rem] border-[#d3c7f5] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="h-1.5 w-14 rounded-full bg-[#d4ebad]" />
                    <span className="text-sm font-black text-[#7aa048]">{stat.icon}</span>
                  </div>
                  <p className="display-font text-4xl text-[#f47c0f] md:text-5xl">{stat.value}</p>
                  <p className="mt-2 text-sm font-bold text-[#5b30d9]">{stat.label}</p>
                </Card>
              ))}
            </div>
          </section>

          <section className="grid items-stretch gap-4 pb-1 lg:grid-cols-2">
            <Card className="focus-campaign-card focus-grid focus-reveal h-full p-5 md:p-7 lg:min-h-[430px]">
              <div className="flex items-center gap-2">
                <MessageSquareQuote className="size-5 text-[#f47c0f]" />
                <h3 className="display-font text-3xl text-[#5b30d9] md:text-4xl">Reflexión colectiva</h3>
              </div>
              <p className="mt-3 text-sm font-semibold text-[#5b30d9]/85 md:text-base">Distractores más repetidos en respuestas anónimas de estudiantes.</p>
              <p className="mt-1 text-xs font-medium text-[#5b30d9]/65 md:text-sm">Frases reales para reconocer patrones y tomar decisiones de enfoque.</p>
              <div className="mt-4 grid gap-2.5">
                {collectiveReflections.map((quote) => (
                  <blockquote key={quote} className="rounded-[0.75rem] border border-[#d9cff7] border-l-4 border-l-[#f47c0f] bg-white/95 p-3 text-[1rem] font-semibold leading-[1.35] text-[#5b30d9]">
                    <span className="mr-2 text-[#f47c0f]">✦</span>"{quote}"
                  </blockquote>
                ))}
              </div>
            </Card>

            <Card className="focus-campaign-card focus-grid focus-reveal focus-reveal-delay-1 h-full rounded-[1.2rem] p-5 md:p-7 lg:min-h-[430px]">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-5 text-[#f47c0f]" />
                <h3 className="display-font text-3xl text-[#5b30d9] md:text-4xl">El problema no es lo digital</h3>
              </div>
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.08em] text-[#5b30d9]/70">Manifiesto de atención consciente</p>
              <p className="mt-1 text-xs text-[#5b30d9]/65 md:text-sm">Ideas clave para transformar hábitos digitales en acciones concretas.</p>
              <div className="focus-divider mt-4 max-w-xl" />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {manifestoLines.map((line, index) => (
                  <div key={line} className="rounded-[0.75rem] border border-[#d9cff7] bg-white/95 p-3">
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.1em] text-[#f47c0f]">Clave {index + 1}</p>
                    <p className="text-[1rem] font-semibold leading-[1.35] text-[#4d33bf]">{line}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="focus-campaign-card focus-reveal focus-reveal-delay-1 rounded-[1.2rem] p-5 md:p-7 lg:col-span-2">
              <div className="flex items-center gap-2">
                <BookOpenText className="size-5 text-[#f47c0f]" />
                <h3 className="display-font text-3xl text-[#5b30d9] md:text-4xl">Biblioteca como alternativa</h3>
              </div>
              <p className="mt-3 text-[1.02rem] leading-relaxed text-[#5b30d9] md:text-lg">
                Focus Zone no es solo una app de pomodoro: conecta hábitos saludables con recursos reales de la biblioteca como espacio de exploración tecnológica y bienestar académico.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {libraryPillars.map(({ label, Icon }) => (
                  <span key={label} className="focus-pill w-full justify-center sm:w-auto sm:justify-start">
                    <Icon className="size-3.5 text-[#f47c0f]" />
                    {label}
                  </span>
                ))}
              </div>
            </Card>
          </section>

          <Card className="focus-campaign-card focus-reveal focus-reveal-delay-1 bg-[linear-gradient(180deg,#ffffff_0%,#f8f5ff_100%)] p-4 md:p-6">
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
              <Carousel setApi={setHorizontalCarouselApi} opts={{ align: "start", loop: true }} className="w-full border-2 border-[#5b30d9]/45">
                <CarouselContent>
                  {horizontalDesigns.map((item) => {
                    const originalIndex = artGallery.findIndex((entry) => entry.src === item.src);
                    return (
                      <CarouselItem key={item.src} className="basis-full">
                        <button
                          type="button"
                          onClick={() => setViewerIndex(originalIndex)}
                          className="focus-gallery-tile group w-full overflow-hidden border border-[#5b30d9]/20 bg-white text-left transition hover:border-[#5b30d9]/45"
                        >
                          <div className="relative bg-[#f7f5ff] p-3">
                            <img src={item.src} alt={item.title} className="h-auto w-full object-contain" loading="lazy" />
                          </div>
                        </button>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex md:size-9 border-[#5b30d9]/55 bg-white/45 text-[#5b30d9]/90 hover:bg-[#5b30d9]/80 hover:text-white md:left-3" />
                <CarouselNext className="hidden md:flex md:size-9 border-[#5b30d9]/55 bg-white/45 text-[#5b30d9]/90 hover:bg-[#5b30d9]/80 hover:text-white md:right-3" />
              </Carousel>
              <div className="mt-3 flex justify-center gap-1.5">
                {horizontalDesigns.map((item, index) => (
                  <button
                    key={`horizontal-dot-${item.src}`}
                    onClick={() => horizontalCarouselApi?.scrollTo(index)}
                    className={`h-2.5 w-6 rounded-full transition ${activeHorizontalSlide === index ? "bg-[#f47c0f]" : "bg-[#5b30d9]/20"}`}
                    aria-label={`Ir al horizontal ${index + 1}`}
                  />
                ))}
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
                      className="focus-gallery-tile group block w-full overflow-hidden border border-[#5b30d9]/20 bg-white text-left shadow-[0_10px_24px_-18px_rgba(37,10,110,0.5)] transition hover:-translate-y-0.5 hover:border-[#5b30d9]/45"
                    >
                      <div className="relative bg-[#f7f5ff] p-2">
                        <img src={item.src} alt={item.title} className="aspect-[3/4] w-full object-contain" loading="lazy" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <section className="focus-reveal focus-reveal-delay-2">
            <Card className="focus-campaign-card p-5 md:p-7">
              <h3 className="display-font text-3xl text-[#5b30d9] md:text-4xl">Sobre el proyecto</h3>
              <p className="mt-3 text-base text-[#5b30d9] md:text-lg">
                Proyecto de grado de la Universidad El Bosque. Focus Zone es una campaña transmedia orientada a hábitos digitales saludables y a la biblioteca como espacio de pausa digital, concentración y aprendizaje activo.
              </p>
            </Card>
          </section>
        </main>

        {appScreenshotViewer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f2f0f3]/95 p-3 md:p-8" onClick={() => setAppScreenshotViewer(null)}>
            <div className="relative w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
              <div className="mb-3 flex items-center justify-end text-[#2a2a2a]">
                <button
                  type="button"
                  onClick={() => setAppScreenshotViewer(null)}
                  className="grid size-10 place-items-center border border-[#5b30d9]/60 bg-white/95 text-[#5b30d9] shadow-sm hover:bg-[#ece8f9]"
                  aria-label="Cerrar visor de captura"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="overflow-hidden border border-[#5b30d9]/25 bg-white p-2 sm:p-3">
                <img src={appScreenshotViewer.src} alt={appScreenshotViewer.title} className="max-h-[86vh] w-full object-contain" />
              </div>
            </div>
          </div>
        )}

        {viewerItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f2f0f3]/95 p-3 md:p-8" onClick={() => setViewerIndex(null)}>
            <div className="relative w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
              <div className="mb-3 flex items-center justify-end text-[#2a2a2a]">
                <button
                  type="button"
                  onClick={() => setViewerIndex(null)}
                  className="grid size-10 place-items-center border border-[#5b30d9]/60 bg-white/95 text-[#5b30d9] shadow-sm hover:bg-[#ece8f9]"
                  aria-label="Cerrar visor"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="relative flex items-center justify-center overflow-hidden border border-[#5b30d9]/25 bg-white">
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
                  className="absolute left-2 top-1/2 -translate-y-1/2 border border-[#5b30d9]/40 bg-white/45 px-2 py-1 text-xs font-bold text-[#5b30d9] hover:bg-white/65 md:px-3 md:py-2 md:text-sm"
                  aria-label="Imagen anterior"
                >
                  {"<"}
                </button>
                <button
                  type="button"
                  onClick={goNextDesign}
                  className="absolute right-2 top-1/2 -translate-y-1/2 border border-[#5b30d9]/40 bg-white/45 px-2 py-1 text-xs font-bold text-[#5b30d9] hover:bg-white/65 md:px-3 md:py-2 md:text-sm"
                  aria-label="Imagen siguiente"
                >
                  {">"}
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="mx-auto w-full max-w-6xl px-5 pb-10 pt-4 md:px-8">
          <div className="border-t border-[#5b30d9]/25 pt-5 text-sm text-[#5b30d9]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>Proyecto de grado 2026 · Universidad El Bosque</p>
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


