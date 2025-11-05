"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SignIn, useAuth, useOrganization } from "@clerk/nextjs";
import { useEffect } from "react";

const SignInRoute = () => {
  const { userId, isLoaded } = useAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const navigate = useNavigate();

  useEffect(() => {
    // If already authenticated, redirect to company slug
    if (isLoaded && orgLoaded && userId) {
      if (organization?.slug) {
        navigate({
          to: "/$companySlug",
          params: { companySlug: organization.slug },
        });
      } else {
        // Redirect to authed index which will handle organization selection
        navigate({ to: "/" });
      }
    }
  }, [isLoaded, orgLoaded, userId, organization, navigate]);

  // If already logged in, show nothing (will redirect)
  if (isLoaded && orgLoaded && userId) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn routing="hash" afterSignInUrl="/" redirectUrl="/" />
    </div>
  );
};

export const Route = createFileRoute("/auth/sign-in")({
  component: SignInRoute,
});
