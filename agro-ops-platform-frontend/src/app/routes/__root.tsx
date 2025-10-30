import * as React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "@/src/shared/components/ui/sonner";

const RootComponent = () => {
  return (
    <>
      <React.StrictMode>
          <Outlet />
          <Toaster />
      </React.StrictMode>
    </>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
  staleTime: Infinity,
});
