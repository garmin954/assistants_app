import { RouteObject } from "react-router-dom";
import React, { lazy } from "react";

export const routes: RouteObject[] = [
  {
    path: "*",
    element: React.createElement("div", {}, "404"),
  },
  {
    path: "/app",
    element: React.createElement(
      lazy(() => import("@/pages/Layouts/Container"))
    ),
    children: [
      {
        path: "home",
        element: React.createElement(lazy(() => import("@/pages/Home"))),
      },
    ],
  },
];
