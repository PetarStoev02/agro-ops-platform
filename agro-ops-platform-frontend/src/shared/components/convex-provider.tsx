"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

export function ConvexProviderWrapper({ children }: { children: ReactNode }) {
  // Get Convex URL at runtime (works for both build-time and runtime env vars)
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  // Create client using useMemo to avoid recreating on every render
  const convex = useMemo(() => {
    if (!convexUrl) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "Convex is not configured. Set NEXT_PUBLIC_CONVEX_URL in .env.local. " +
            "Run 'npx convex dev' to get your deployment URL.",
        );
      } else {
        console.error(
          "NEXT_PUBLIC_CONVEX_URL is not set. Convex functionality will not work. " +
            "Please set this environment variable in your deployment configuration.",
        );
      }
      // Create a dummy client to prevent hook errors, but it won't work
      // This allows the app to render without crashing
      return new ConvexReactClient("https://placeholder.convex.cloud");
    }
    return new ConvexReactClient(convexUrl);
  }, [convexUrl]);

  // Always wrap with provider to prevent hook errors
  // If URL is invalid, Convex will show connection errors but won't crash the app
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
