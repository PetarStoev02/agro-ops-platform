/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "@/src/app/routes.gen";
import { useState, useLayoutEffect } from "react";

// Create router instance (only on client)
function createTanStackRouter() {
  return createRouter({
    routeTree,
    defaultPreload: "intent",
  });
}

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createTanStackRouter>;
  }
}

export function TanStackRouterProvider() {
  // Start with null to ensure server and client render the same initial content
  const [router, setRouter] = useState<ReturnType<
    typeof createTanStackRouter
  > | null>(null);

  // Use useLayoutEffect to create router immediately after mount (before paint)
  // This ensures the router reads and matches the current URL as quickly as possible
  // while still maintaining hydration consistency
  useLayoutEffect(() => {
    // Create router synchronously
    // TanStack Router will automatically read and match the current URL
    const clientRouter = createTanStackRouter();

    // This is a legitimate use case: initializing client-only state after SSR hydration
    setRouter(clientRouter);
  }, []);

  // Show loading state during SSR and initial client render (consistent on both)
  // This prevents hydration mismatches
  if (!router) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  // Router is created and will automatically match the current URL
  // This makes shared links work - the router reads the URL when created
  return <RouterProvider router={router} />;
}
