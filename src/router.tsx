import { createRouter } from "@tanstack/react-router";
import type { AuthContextValue } from "@/contexts/auth-context";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

export interface AppRouterContext {
  auth: AuthContextValue;
}

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
  },
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
