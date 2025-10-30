import * as React from "react";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/src/shared/components/ui/sonner";

const AuthLayoutComponent = () => {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
};

export const Route = createFileRoute("/auth")({
  component: AuthLayoutComponent,
});
