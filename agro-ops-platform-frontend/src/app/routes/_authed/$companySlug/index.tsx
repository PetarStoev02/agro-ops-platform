"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useOrganization } from "@clerk/nextjs";
import { useEffect } from "react";
import DashboardPage from "@/src/pages/dashboard/page";
import { useSyncOrganization } from "@/src/shared/hooks/use-sync-organization";

const CompanyDashboardRoute = () => {
  const { companySlug } = useParams({ from: "/_authed/$companySlug/" });
  const { organization, isLoaded } = useOrganization();
  const navigate = useNavigate();

  // Automatically sync organization to Convex
  useSyncOrganization();

  useEffect(() => {
    if (isLoaded && organization) {
      if (!organization.slug) {
        // This shouldn't happen if org is properly set up
        // But if it does, we can't navigate to organizations without a slug
        return;
      }
      if (organization.slug !== companySlug) {
        // Redirect to correct organization slug
        navigate({
          to: "/$companySlug",
          params: { companySlug: organization.slug },
          replace: true,
        });
      }
    }
  }, [isLoaded, organization, companySlug, navigate]);

  if (!isLoaded) {
    return null;
  }

  if (!organization) {
    // This shouldn't happen at this route level
    // But if it does, we can't navigate without a slug
    return null;
  }

  return <DashboardPage />;
};

export const Route = createFileRoute("/_authed/$companySlug/")({
  component: CompanyDashboardRoute,
});
