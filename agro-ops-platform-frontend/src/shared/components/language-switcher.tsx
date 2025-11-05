"use client";

import { useLingui } from "@lingui/react";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/shared/components/ui/dropdown-menu";
import { Button } from "@/src/shared/components/ui/button";
import { activateLocale } from "@/src/shared/lib/i18n";
import { Trans } from "@lingui/react";

const languages = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "bg", label: "Bulgarian", nativeLabel: "Български" },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useLingui();
  // Use i18n.locale directly instead of maintaining separate state
  const currentLocale = i18n.locale || "en";

  const handleLocaleChange = async (locale: string) => {
    if (locale === currentLocale) return;
    await activateLocale(locale);
    // Trigger a re-render by updating the i18n instance
    // The I18nProvider will pick up the change automatically
  };

  const currentLanguage =
    languages.find((lang) => lang.code === currentLocale) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            <Trans id="Language" message="Language" />
          </span>
          <span className="sm:hidden">
            {currentLanguage.code.toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLocaleChange(lang.code)}
            className={currentLocale === lang.code ? "bg-accent" : ""}
          >
            <span className="flex items-center gap-2">
              <span>{lang.nativeLabel}</span>
              {currentLocale === lang.code && (
                <span className="ml-auto text-xs opacity-70">✓</span>
              )}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
