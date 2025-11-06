"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth, useOrganizationList, useOrganization } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const AuthedIndexRoute = () => {
  const { userId, isLoaded } = useAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { userMemberships, isLoaded: orgListLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  const navigate = useNavigate();
  const hasRedirectedRef = useRef(false);

  // Check onboarding status
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
    if (
      isLoaded &&
      orgListLoaded &&
      orgLoaded &&
      userId &&
      !hasRedirectedRef.current
    ) {
      // First try to use the active organization from useOrganization
      let activeOrg = organization;

      // If no active org, get the first one from userMemberships
      if (
        !activeOrg &&
        userMemberships?.data &&
        userMemberships.data.length > 0
      ) {
        activeOrg = userMemberships.data[0].organization;
      }

      if (!activeOrg) {
        // No organization - redirect to onboarding
        hasRedirectedRef.current = true;
        navigate({ to: "/onboarding", replace: true });
        return;
      }

      // Check if organization is onboarded
      if (!onboardingStatus?.isOnboarded) {
        // Not onboarded - redirect to onboarding
        hasRedirectedRef.current = true;
        navigate({ to: "/onboarding", replace: true });
        return;
      }

      // Redirect to company slug route (dashboard) using Convex slug
      if (convexOrg?.slug) {
        hasRedirectedRef.current = true;
        navigate({
          to: "/$companySlug",
          params: { companySlug: convexOrg.slug },
          replace: true,
        });
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
    convexOrg,
    navigate,
  ]);

  if (!isLoaded || !orgListLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Also check orgLoaded for useOrganization
  if (!orgLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading organization...</div>
      </div>
    );
  }

  // This route should only be accessible when authenticated
  // If not authenticated, the parent _authed route will redirect
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div>Redirecting...</div>
    </div>
  );
};

export const Route = createFileRoute("/_authed/")({
  component: AuthedIndexRoute,
});
