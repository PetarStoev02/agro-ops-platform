"use client";

import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { useOrganizationList, useOrganization } from "@clerk/nextjs";
import { useEffect } from "react";

const CompanySlugLayout = () => {
  const { companySlug } = useParams({ from: "/_authed/$companySlug" });
  const { organization } = useOrganization();
  const { userMemberships, isLoaded, setActive } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });

  useEffect(() => {
    // Only set active organization if:
    // 1. Data is loaded
    // 2. We have a companySlug from URL
    // 3. Current active org doesn't match the slug
    if (isLoaded && companySlug && userMemberships?.data) {
      // Find the organization with matching slug
      const targetMembership = userMemberships.data.find(
        (membership) => membership.organization.slug === companySlug,
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
  }, [isLoaded, companySlug, userMemberships, organization, setActive]);

  return <Outlet />;
};

export const Route = createFileRoute("/_authed/$companySlug")({
  component: CompanySlugLayout,
});
