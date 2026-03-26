import { useEffect, useState } from "react";
import { Link } from "react-router";
import { BookOpen, Clock3, Target, TrendingUp, Trophy } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "../components/ui/carousel";
import { supabase } from "../lib/supabase";

interface RankItem {
  userId: string;
  displayName: string;
  totalPoints: number;
}

export default function Home() {
  const [ranking, setRanking] = useState<RankItem[]>([]);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const designMockups = [
    {
      title: "Afiche Semana de Pausa Digital",
      kind: "Afiche",
      description: "Campaña visual para biblioteca y pasillos.",
      gradient: "from-[#5b30d9] via-[#7d4cd8] to-[#00b6d9]",
    },
    {
      title: "Banner Redes Sociales",
      kind: "Banner",
      description: "Versión para Instagram y Facebook institucional.",
      gradient: "from-[#f47c0f] via-[#f7943a] to-[#ffd47a]",
    },
    {
      title: "Afiche Jornadas de Enfoque",
      kind: "Afiche",
      description: "Material para promoción de sesiones pomodoro.",
      gradient: "from-[#4f7c0f] via-[#79ad2a] to-[#b8ee73]",
    },
    {
      title: "Banner Landing del Proyecto",
      kind: "Banner",
      description: "Pieza principal de comunicación del programa.",
      gradient: "from-[#2a1a70] via-[#5b30d9] to-[#f47c0f]",
    },
  ];

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
    if (!carouselApi) {
      return;
    }

    const onSelect = () => {
      setActiveSlide(carouselApi.selectedScrollSnap());
    };

    onSelect();
    carouselApi.on("select", onSelect);
    carouselApi.on("reInit", onSelect);

    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  const podium = [ranking[1], ranking[0], ranking[2]];

  return (
    <div className="focus-shell focus-rings focus-no-stars min-h-screen overflow-x-hidden">
      <div className="relative z-10">
        <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-b border-[#5b30d9]/20 bg-[#ece8f9]/65 px-5 py-4 md:flex-nowrap md:px-8 md:py-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-none bg-[#f47c0f] text-white md:size-11">
              <Target className="size-5 md:size-6" />
            </div>
            <div>
              <p className="display-font text-[2.1rem] leading-none text-[#5b30d9] md:text-3xl">Focus Zone</p>
            </div>
          </div>
          <Link to="/login" className="w-full sm:w-auto">
            <Button className="w-full rounded-none border-2 border-[#5b30d9] bg-transparent font-bold text-[#5b30d9] hover:bg-[#5b30d9] hover:text-white sm:w-auto">
              Iniciar sesión
            </Button>
          </Link>
        </header>

        <main className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-16 pt-6 md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <section className="min-w-0 space-y-6 md:space-y-8">
            <p className="text-base italic text-[#7d4cd8] md:text-lg">La biblioteca como espacio de pausa digital.</p>
            <h1 className="display-font text-[3.9rem] leading-[0.84] text-[#f47c0f] sm:text-[4.8rem] lg:text-[5.6rem]">
              Focus
              <br />
              <span className="text-[#5b30d9]">Zone</span>
            </h1>
            <div className="focus-divider max-w-xl" />
            <p className="max-w-xl text-[1.05rem] text-[#4a2dba] md:text-lg">
              Un nuevo mundo en la biblioteca: menos ruido digital, más sesiones de concentración, progreso real y retos semanales.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
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

            <Card className="focus-card rounded-none border-2 border-[#5b30d9]/25 bg-white/80 p-4 md:p-5">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="display-font text-4xl text-[#5b30d9] md:text-5xl">Mockups de diseño</h3>
              </div>

              <div className="relative overflow-hidden px-0 sm:px-8">
                <Carousel setApi={setCarouselApi} opts={{ align: "start", loop: true }} className="w-full">
                  <CarouselContent>
                    {designMockups.map((item, index) => (
                      <CarouselItem key={item.title + index}>
                        <div className={`rounded-none border border-white/20 bg-gradient-to-br p-4 text-white md:p-5 ${item.gradient}`}>
                          <p className="mb-2 inline-flex rounded-full bg-black/20 px-2 py-1 text-[11px] font-bold uppercase tracking-wide">{item.kind}</p>
                          <p className="display-font text-[1.85rem] leading-[0.92] md:text-5xl">{item.title}</p>
                          <p className="mt-3 max-w-xs text-sm font-medium text-white/90 md:text-base">{item.description}</p>
                          <div className="mt-4 h-1.5 w-full bg-white/35">
                            <div className="h-full w-2/3 bg-white" />
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden border-[#5b30d9] text-[#5b30d9] hover:bg-[#5b30d9] hover:text-white sm:flex sm:-left-5" />
                  <CarouselNext className="hidden border-[#5b30d9] text-[#5b30d9] hover:bg-[#5b30d9] hover:text-white sm:flex sm:-right-5" />
                </Carousel>
              </div>

              <div className="mt-3 flex justify-center gap-1.5">
                {designMockups.map((item, index) => (
                  <button
                    key={`dot-${item.title}`}
                    onClick={() => carouselApi?.scrollTo(index)}
                    className={`h-2.5 w-6 rounded-full transition ${activeSlide === index ? "bg-[#f47c0f]" : "bg-[#5b30d9]/20"}`}
                    aria-label={`Ir al mockup ${index + 1}`}
                  />
                ))}
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3">
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
          </section>

          <section className="min-w-0 space-y-5">
            <Card className="focus-card focus-noise focus-grid rounded-none border-2 border-[#5b30d9]/40 bg-[#5b30d9] p-5 text-white md:p-7">
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

            <Card className="focus-card rounded-none border-2 border-[#f47c0f]/35 bg-[#fff8f0] p-5 md:p-7">
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
        </main>

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
