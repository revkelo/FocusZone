import { createElement } from "react";
import { createBrowserRouter, isRouteErrorResponse, redirect, useRouteError } from "react-router";
import { supabase } from "./lib/supabase";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";

const RouteHydrateFallback = () =>
  createElement("div", { className: "focus-shell min-h-screen grid place-items-center text-xl font-bold" }, "Cargando...");

const RouteErrorFallback = () => {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Error inesperado.";

  return createElement(
    "div",
    { className: "focus-shell min-h-screen grid place-items-center p-6 text-center" },
    createElement("div", { className: "max-w-xl space-y-3" }, [
      createElement("h1", { key: "title", className: "text-2xl font-extrabold" }, "Algo salió mal"),
      createElement(
        "p",
        { key: "desc", className: "text-sm opacity-80" },
        "La aplicación encontró un error y no pudo completar esta vista. Recarga la página para continuar.",
      ),
      createElement("p", { key: "msg", className: "text-xs opacity-60 break-all" }, message),
    ]),
  );
};

const requireAuth = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    await supabase.auth.signOut();
    throw redirect("/login");
  }

  return null;
};

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
    HydrateFallback: RouteHydrateFallback,
    ErrorBoundary: RouteErrorFallback,
  },
  {
    path: "/login",
    Component: Login,
    HydrateFallback: RouteHydrateFallback,
    ErrorBoundary: RouteErrorFallback,
  },
  {
    path: "/dashboard",
    loader: requireAuth,
    Component: Dashboard,
    HydrateFallback: RouteHydrateFallback,
    ErrorBoundary: RouteErrorFallback,
  },
]);
