import { createElement } from "react";
import { createBrowserRouter, redirect } from "react-router";
import { supabase } from "./lib/supabase";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";

const RouteHydrateFallback = () =>
  createElement("div", { className: "focus-shell min-h-screen grid place-items-center text-xl font-bold" }, "Cargando...");

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
  },
  {
    path: "/login",
    Component: Login,
    HydrateFallback: RouteHydrateFallback,
  },
  {
    path: "/dashboard",
    loader: requireAuth,
    Component: Dashboard,
    HydrateFallback: RouteHydrateFallback,
  },
]);
