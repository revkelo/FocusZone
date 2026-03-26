import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { BookOpen, Clock3, Target, TrendingUp, Trophy, X } from "lucide-react";
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

export default function Home() {
  const [ranking, setRanking] = useState<RankItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
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
    <div className="focus-shell focus-rings focus-no-stars min-h-screen overflow-x-hidden">
      <div className="relative z-10">
        <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-b border-[#5b30d9]/20 bg-[#ece8f9]/65 px-5 py-4 md:flex-nowrap md:px-8 md:py-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-none bg-[#f47c0f] text-white md:size-11">
              <Target className="size-5 md:size-6" />
            </div>
            <p className="display-font text-[2.1rem] leading-none text-[#5b30d9] md:text-3xl">Focus Zone</p>
          </div>
          <Link to="/login" className="w-full sm:w-auto">
            <Button className="w-full rounded-none border-2 border-[#5b30d9] bg-transparent font-bold text-[#5b30d9] hover:bg-[#5b30d9] hover:text-white sm:w-auto">
              Iniciar sesión
            </Button>
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl space-y-6 px-5 pb-16 pt-6 md:px-8 md:space-y-8">
          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="focus-card focus-reveal rounded-none border-2 border-[#5b30d9]/25 p-5 md:p-7">
              <p className="text-base italic text-[#7d4cd8] md:text-lg">La biblioteca como espacio de pausa digital.</p>
              <h1 className="display-font mt-3 text-[3.9rem] leading-[0.84] text-[#f47c0f] sm:text-[4.8rem] lg:text-[5.6rem]">
                Focus
                <br />
                <span className="text-[#5b30d9]">Zone</span>
              </h1>
              <div className="focus-divider mt-4 max-w-xl" />
              <p className="mt-4 max-w-xl text-[1.05rem] text-[#4a2dba] md:text-lg">
                Un nuevo mundo en la biblioteca: menos ruido digital, más sesiones de concentración, progreso real y retos semanales.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <Link to="/login" className="w-full">
                  <Button className="h-12 w-full rounded-none bg-[#f47c0f] px-4 text-base font-bold text-white hover:bg-[#dd6900] md:h-14 md:px-8 md:text-lg">
                    Entrar ahora
                  </Button>
                </Link>
                <Link to="/login" className="w-full">
                  <Button className="h-12 w-full rounded-none border-2 border-[#5b30d9] bg-[#f2f0f3] px-4 text-base font-bold text-[#5b30d9] hover:bg-[#5b30d9] hover:text-white md:h-14 md:px-8 md:text-lg">
                    Crear cuenta
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="focus-card focus-reveal focus-reveal-delay-1 focus-heavy focus-noise focus-grid rounded-none border-2 border-[#5b30d9]/40 bg-[#5b30d9] p-5 text-white md:p-7">
              <h2 className="display-font text-5xl text-[#b8ee73] md:text-6xl">Stop Doomscrolling</h2>
              <p className="mt-4 text-base text-[#f2f0f3] md:text-lg">
                Algunas cosas te distraen. Otras te ayudan a enfocarte. Focus Zone convierte lo digital en aliado de tu estudio.
              </p>
              <div className="my-5 h-px w-full bg-gradient-to-r from-[#f47c0f] via-[#f2f0f3] to-[#b8ee73]/80" />
              <div className="mt-6 space-y-3 text-base font-bold md:text-lg">
                <p>Educación</p>
                <p>Concientización</p>
                <p>Estrategias preventivas</p>
              </div>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="focus-reveal focus-reveal-delay-2 grid gap-4 sm:grid-cols-3">
              <Card className="focus-card focus-glow-orange rounded-none p-4">
                <Clock3 className="mb-2 size-5 text-[#f47c0f]" />
                <p className="display-font text-4xl text-[#f47c0f]">50h</p>
                <p className="font-bold text-[#5b30d9]">semanales sin control</p>
              </Card>
              <Card className="focus-card focus-glow-purple rounded-none p-4">
                <TrendingUp className="mb-2 size-5 text-[#5b30d9]" />
                <p className="display-font text-4xl text-[#5b30d9]">2do</p>
                <p className="font-bold text-[#5b30d9]">lugar global en uso</p>
              </Card>
              <Card className="focus-card focus-glow-green rounded-none p-4">
                <BookOpen className="mb-2 size-5 text-[#4f7c0f]" />
                <p className="display-font text-4xl text-[#4f7c0f]">+50</p>
                <p className="font-bold text-[#5b30d9]">recursos de estudio</p>
              </Card>
            </div>

            <Card className="focus-card focus-heavy focus-reveal focus-reveal-delay-2 rounded-none border-2 border-[#f47c0f]/35 bg-[#fff8f0] p-5 md:p-7">
              <div className="mb-4 flex items-center gap-2 text-[#5b30d9]">
                <Trophy className="size-5 text-[#f47c0f]" />
                <h3 className="display-font text-4xl">Ranking en vivo</h3>
              </div>

              {ranking.length === 0 ? (
                <p className="font-bold text-[#5b30d9]/75">Aún no hay datos de ranking.</p>
              ) : (
                <>
                  <div className="grid grid-cols-3 items-end gap-2">
                    {podium.map((entry, index) => {
                      const isCenter = index === 1;
                      return (
                        <div
                          key={entry?.userId ?? `empty-${index}`}
                          className={`rounded-none border p-3 text-center ${
                            isCenter ? "border-[#f47c0f]/45 bg-[#ffe8cf]" : "border-[#5b30d9]/20 bg-white"
                          }`}
                        >
                          {entry ? (
                            <>
                              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#5b30d9]/70">
                                {isCenter ? "#1" : index === 0 ? "#2" : "#3"}
                              </p>
                              <p className="line-clamp-2 font-bold text-[#5b30d9]">{entry.displayName}</p>
                              <p className="mt-1 text-sm font-bold text-[#f47c0f]">{entry.totalPoints} pts</p>
                            </>
                          ) : (
                            <p className="text-sm font-bold text-[#5b30d9]/50">-</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {ranking.length > 3 && (
                    <div className="mt-3 space-y-2">
                      {ranking.slice(3).map((entry, index) => (
                        <div key={entry.userId} className="flex items-center justify-between border border-[#5b30d9]/15 bg-white p-2 text-sm">
                          <span className="font-bold text-[#5b30d9]">#{index + 4} {entry.displayName}</span>
                          <span className="font-bold text-[#f47c0f]">{entry.totalPoints} pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </Card>
          </section>

          <Card className="focus-card focus-reveal focus-reveal-delay-1 rounded-none border-2 border-[#5b30d9]/25 bg-[linear-gradient(180deg,#ffffff_0%,#f8f5ff_100%)] p-4 md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="display-font text-4xl text-[#5b30d9] md:text-5xl">Galería de arte</h3>
                <p className="mt-1 text-sm font-semibold text-[#5b30d9]/75">Colección visual Focus Zone. Haz clic para ampliar.</p>
              </div>
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
                          className="group w-full overflow-hidden border border-[#5b30d9]/20 bg-white text-left transition hover:border-[#5b30d9]/45"
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
                      className="group block w-full overflow-hidden border border-[#5b30d9]/20 bg-white text-left shadow-[0_10px_24px_-18px_rgba(37,10,110,0.5)] transition hover:-translate-y-0.5 hover:border-[#5b30d9]/45"
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
        </main>

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

        <footer className="mx-auto w-full max-w-6xl px-5 pb-10 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#5b30d9]/25 pt-5 text-sm text-[#5b30d9]">
            <p>Proyecto de grado 2026</p>
            <p className="font-bold">Focus Zone</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
