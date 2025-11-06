"use client";

import type { AppProps } from "next/app";
import { ClerkProvider } from "@clerk/nextjs";
import { bgBG, enUS } from "@clerk/localizations";
import { I18nProvider } from "@lingui/react";
import { useEffect, useState } from "react";
import { TanStackRouterProvider } from "@/src/shared/components/tanstack-router-provider";
import { ConvexProviderWrapper } from "@/src/shared/components/convex-provider";
import { initializeI18n, i18n } from "@/src/shared/lib/i18n";
import "@/src/shared/assets/globals.css";

export default function App(props: AppProps) {
  // Props are required by Next.js but not used since we're using TanStack Router
  void props;
  const [i18nReady, setI18nReady] = useState(false);
  // Initialize locale from localStorage or default to 'bg'
  const [locale, setLocale] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("locale") || "bg";
    }
    return "bg";
  });

  useEffect(() => {
    initializeI18n().then(() => {
      setI18nReady(true);
    });
  }, []);

  // Update locale when i18n locale changes (for Clerk localization)
  useEffect(() => {
    if (i18nReady && typeof window !== "undefined") {
      const currentLocale = i18n.locale || "bg";
      if (currentLocale !== locale) {
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => {
          setLocale(currentLocale);
        }, 0);
      }
    }
  }, [i18nReady, locale]);

  const clerkLocale = locale === "bg" ? bgBG : enUS;

  return (
    <I18nProvider i18n={i18n}>
      <ClerkProvider key={locale} localization={clerkLocale}>
        <ConvexProviderWrapper>
          {i18nReady && <TanStackRouterProvider />}
        </ConvexProviderWrapper>
      </ClerkProvider>
    </I18nProvider>
  );
}
