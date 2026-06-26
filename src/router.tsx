import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Prefetch a route's code/data when the user shows intent (hover/touch),
    // so taps feel instant.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  return router;
};
