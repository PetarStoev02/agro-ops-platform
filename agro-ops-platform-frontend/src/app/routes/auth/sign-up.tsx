"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SignUp, useAuth, useOrganization } from "@clerk/nextjs";
import { useEffect } from "react";

const SignUpRoute = () => {
  const { userId, isLoaded } = useAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const navigate = useNavigate();

  useEffect(() => {
    // If already authenticated, redirect to onboarding (will check status there)
    if (isLoaded && orgLoaded && userId) {
      // Always redirect to onboarding first - it will check if already onboarded
      navigate({ to: "/onboarding" });
    }
  }, [isLoaded, orgLoaded, userId, navigate]);

  // If already logged in, show nothing (will redirect)
  if (isLoaded && orgLoaded && userId) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp routing="hash" afterSignUpUrl="/onboarding" />
    </div>
  );
};

export const Route = createFileRoute("/auth/sign-up")({
  component: SignUpRoute,
});
