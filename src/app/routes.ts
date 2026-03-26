import { createBrowserRouter } from "react-router";

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
    lazy: async () => {
      const module = await import("./pages/Dashboard");
      return { Component: module.default };
    },
  },
]);
