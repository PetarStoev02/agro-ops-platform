"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { OnboardingWizard } from "@/src/shared/components/onboarding/onboarding-wizard";

const OnboardingRoute = () => {
  const { userId, isLoaded } = useAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const navigate = useNavigate();

  const onboardingStatus = useQuery(
    api.organizations.getOnboardingStatus,
    organization?.id ? { clerkOrgId: organization.id } : "skip",
  );

  // Get Convex organization to get slug
  const convexOrg = useQuery(
    api.organizations.getByClerkOrgId,
    organization?.id ? { clerkOrgId: organization.id } : "skip",
  );

  useEffect(() => {
    if (isLoaded && !userId) {
      // Redirect to sign-in if not authenticated
      navigate({ to: "/auth/sign-in" });
    }
  }, [isLoaded, userId, navigate]);

  useEffect(() => {
    // If organization is already onboarded, redirect to dashboard
    // Only check if we have an organization and the status is loaded
    if (
      isLoaded &&
      orgLoaded &&
      userId &&
      organization?.id &&
      onboardingStatus !== undefined &&
      onboardingStatus.isOnboarded &&
      convexOrg?.slug
    ) {
      navigate({
        to: "/$companySlug",
        params: { companySlug: convexOrg.slug },
      });
    }
  }, [
    isLoaded,
    orgLoaded,
    userId,
    organization,
    onboardingStatus,
    convexOrg,
    navigate,
  ]);

  // Show loading only if auth is not loaded
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!userId) {
    return null; // Will redirect
  }

  const handleComplete = () => {
    // Use Convex slug for navigation
    if (convexOrg?.slug) {
      navigate({
        to: "/$companySlug",
        params: { companySlug: convexOrg.slug },
      });
    } else {
      // Wait a bit for sync, then try again
      setTimeout(() => {
        navigate({ to: "/" });
      }, 1000);
    }
  };

  return <OnboardingWizard onComplete={handleComplete} />;
};

export const Route = createFileRoute("/_authed/onboarding")({
  component: OnboardingRoute,
});
