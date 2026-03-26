import { createBrowserRouter, redirect } from "react-router";
import { supabase } from "./lib/supabase";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";

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
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/dashboard",
    loader: requireAuth,
    Component: Dashboard,
  },
]);
