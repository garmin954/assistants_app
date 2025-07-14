import { Navigate, RouteObject } from "react-router-dom";
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
        index: true,
        element: <Navigate to="observer" replace />,
      },
      {
        path: "observer",
        element: React.createElement(lazy(() => import("@/pages/Observer"))),
      },
    ],
  },
];
