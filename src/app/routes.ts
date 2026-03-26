import { createBrowserRouter, redirect } from "react-router";
import { supabase } from "./lib/supabase";

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
    lazy: async () => {
      const module = await import("./pages/Home");
      return { Component: module.default };
    },
  },
  {
    path: "/login",
    lazy: async () => {
      const module = await import("./pages/Login");
      return { Component: module.default };
    },
  },
  {
    path: "/dashboard",
    loader: requireAuth,
    lazy: async () => {
      const module = await import("./pages/Dashboard");
      return { Component: module.default };
    },
  },
]);
