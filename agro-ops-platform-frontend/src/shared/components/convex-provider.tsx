"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// Only create client if URL is available (allows app to work without Convex during initial setup)
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexProviderWrapper({ children }: { children: ReactNode }) {
  // If Convex is not configured, just render children without provider
  if (!convex) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Convex is not configured. Set NEXT_PUBLIC_CONVEX_URL in .env.local. " +
          "Run 'npx convex dev' to get your deployment URL.",
      );
    }
    return <>{children}</>;
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
