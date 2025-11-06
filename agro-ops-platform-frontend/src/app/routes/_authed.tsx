"use client";

import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { AuthenticatedLayout } from "@/src/shared/components/authenticated-layout";
import { useAuth, useOrganization, useOrganizationList } from "@clerk/nextjs";
import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const Authed = () => {
  const { userId, isLoaded } = useAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { userMemberships, isLoaded: orgListLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  const navigate = useNavigate();

  // Check onboarding status for active organization
  const onboardingStatus = useQuery(
    api.organizations.getOnboardingStatus,
    organization?.id ? { clerkOrgId: organization.id } : "skip",
  );

  useEffect(() => {
    if (isLoaded && !userId) {
      // Redirect to sign-in if not authenticated
      navigate({ to: "/auth/sign-in" });
      return;
    }

    // Don't redirect if already on onboarding page
    const currentPath = window.location.pathname;
    if (currentPath.includes("/onboarding")) {
      return;
    }

    // Check if user has organization and if it's onboarded
    if (
      isLoaded &&
      orgListLoaded &&
      orgLoaded &&
      userId &&
      onboardingStatus !== undefined
    ) {
      // Check if user has any organizations
      const hasAnyOrg =
        organization ||
        (userMemberships?.data && userMemberships.data.length > 0);

      if (!hasAnyOrg || !onboardingStatus.isOnboarded) {
        // Redirect to onboarding if no org or not onboarded
        navigate({ to: "/onboarding" });
      }
    }
  }, [
    isLoaded,
    orgListLoaded,
    orgLoaded,
    userId,
    organization,
    userMemberships,
    onboardingStatus,
    navigate,
  ]);

  if (!isLoaded || !orgListLoaded || !orgLoaded) {
    return null;
  }

  // Only show authenticated layout if user is authenticated
  if (!userId) {
    return null; // Will redirect
  }

  // Don't show layout on onboarding page - let it render without layout
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "";
  if (currentPath.includes("/onboarding")) {
    return <Outlet />;
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
