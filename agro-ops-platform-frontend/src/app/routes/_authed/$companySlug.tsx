"use client";

import {
  createFileRoute,
  Outlet,
  useParams,
  useNavigate,
} from "@tanstack/react-router";
import { useOrganizationList, useOrganization } from "@clerk/nextjs";
import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const CompanySlugLayout = () => {
  const { companySlug } = useParams({ from: "/_authed/$companySlug" });
  const { organization } = useOrganization();
  const { userMemberships, isLoaded, setActive } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  const navigate = useNavigate();

  // Check onboarding status
  const onboardingStatus = useQuery(
    api.organizations.getOnboardingStatus,
    organization?.id ? { clerkOrgId: organization.id } : "skip",
  );

  // Get all organizations from Convex to match by slug
  const allConvexOrgs = useQuery(
    api.organizations.listByUserMemberships,
    userMemberships?.data && userMemberships.data.length > 0
      ? { clerkOrgIds: userMemberships.data.map((m) => m.organization.id) }
      : "skip",
  );

  useEffect(() => {
    // Only set active organization if:
    // 1. Data is loaded
    // 2. We have a companySlug from URL
    // 3. Current active org doesn't match the slug
    if (isLoaded && companySlug && userMemberships?.data && allConvexOrgs) {
      // Find the organization with matching slug in Convex
      const targetConvexOrg = allConvexOrgs.find(
        (org) => org.slug === companySlug,
      );

      if (targetConvexOrg) {
        // Find the corresponding Clerk membership
        const targetMembership = userMemberships.data.find(
          (membership) =>
            membership.organization.id === targetConvexOrg.clerkOrgId,
        );

        if (
          targetMembership &&
          organization?.id !== targetMembership.organization.id
        ) {
          // Set the active organization based on the slug from URL
          setActive({ organization: targetMembership.organization.id }).catch(
            (error) => {
              console.error("Failed to set active organization:", error);
            },
          );
        }
      }
    }
  }, [
    isLoaded,
    companySlug,
    userMemberships,
    organization,
    allConvexOrgs,
    setActive,
  ]);

  // Check if organization is onboarded
  useEffect(() => {
    if (
      isLoaded &&
      organization?.id &&
      onboardingStatus !== undefined &&
      !onboardingStatus.isOnboarded
    ) {
      // Redirect to onboarding if not onboarded
      navigate({ to: "/onboarding" });
    }
  }, [isLoaded, organization, onboardingStatus, navigate]);

  return <Outlet />;
};

export const Route = createFileRoute("/_authed/$companySlug")({
  component: CompanySlugLayout,
});
