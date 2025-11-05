"use client";

import type { AppProps } from "next/app";
import { ClerkProvider } from "@clerk/nextjs";
import { TanStackRouterProvider } from "@/src/shared/components/tanstack-router-provider";
import "@/src/shared/assets/globals.css";

export default function App(props: AppProps) {
  // Props are required by Next.js but not used since we're using TanStack Router
  void props;
  return (
    <ClerkProvider localization={{ locale: "bg" }}>
      <TanStackRouterProvider />
    </ClerkProvider>
  );
}
