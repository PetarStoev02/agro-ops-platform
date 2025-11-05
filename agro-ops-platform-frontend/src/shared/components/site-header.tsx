"use client";

import { Link } from "@tanstack/react-router";
import { SignedIn, UserButton } from "@clerk/nextjs";

import { SearchForm } from "@/src/shared/components/search-form";

export function SiteHeader() {
  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <div className="flex flex-row items-center gap-2">
          <Link to="/" className="flex flex-row items-center gap-2">
            <span className="truncate font-medium">{"Agro Ops Platform"}</span>
          </Link>
        </div>
        <SearchForm className="w-full sm:ml-auto sm:w-auto" />
        <div className="ml-auto flex items-center gap-2">
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
