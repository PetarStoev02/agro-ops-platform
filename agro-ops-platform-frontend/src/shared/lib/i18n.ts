import { i18n } from "@lingui/core";
import { en, bg } from "make-plural/plurals";

// Load locale data
i18n.loadLocaleData("en", { plurals: en });
i18n.loadLocaleData("bg", { plurals: bg });

// Load messages dynamically
async function loadMessages(locale: string) {
  try {
    if (locale === "en") {
      const messagesModule = await import("@/src/locales/en/messages");
      // Handle CommonJS export: module.exports = { messages: ... }
      return (
        messagesModule.messages ||
        (messagesModule.default as { messages?: Record<string, string[]> })
          ?.messages ||
        {}
      );
    } else if (locale === "bg") {
      const messagesModule = await import("@/src/locales/bg/messages");
      // Handle CommonJS export: module.exports = { messages: ... }
      return (
        messagesModule.messages ||
        (messagesModule.default as { messages?: Record<string, string[]> })
          ?.messages ||
        {}
      );
    }
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
  }
  return {};
}

export async function activateLocale(locale: string) {
  const messages = await loadMessages(locale);
  i18n.load(locale, messages);
  i18n.activate(locale);

  // Save to localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem("locale", locale);
  }
}

// Initialize with default locale
export async function initializeI18n() {
  if (typeof window !== "undefined") {
    const savedLocale = localStorage.getItem("locale") || "en";
    await activateLocale(savedLocale);
  } else {
    // Default for SSR - load English messages
    const messages = await loadMessages("en");
    i18n.load("en", messages);
    i18n.activate("en");
  }
}

export { i18n };
