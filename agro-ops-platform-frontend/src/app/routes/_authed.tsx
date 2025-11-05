"use client";

import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { AuthenticatedLayout } from "@/src/shared/components/authenticated-layout";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

const Authed = () => {
  const { userId, isLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && !userId) {
      // Redirect to sign-in if not authenticated
      navigate({ to: "/auth/sign-in" });
    }
  }, [isLoaded, userId, navigate]);

  if (!isLoaded) {
    return null;
  }

  // Only show authenticated layout if user is authenticated
  if (!userId) {
    return null; // Will redirect
  }

  return (
    <AuthenticatedLayout>
      <Outlet />
    </AuthenticatedLayout>
  );
};

export const Route = createFileRoute("/_authed")({
  component: Authed,
});
