"use client";

import { useEffect } from "react";
import { useOrganization } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Hook to automatically sync Clerk organization to Convex
 * This ensures the organization exists in Convex before other queries run
 */
export function useSyncOrganization() {
  const { organization, isLoaded } = useOrganization();
  const upsertOrg = useMutation(api.organizations.upsertFromClerk);
  const convexOrg = useQuery(
    api.organizations.getByClerkOrgId,
    organization?.id ? { clerkOrgId: organization.id } : "skip",
  );

  useEffect(() => {
    if (
      isLoaded &&
      organization?.id &&
      organization.name &&
      organization.slug &&
      !convexOrg // Only sync if not already in Convex
    ) {
      // Sync organization to Convex
      upsertOrg({
        clerkOrgId: organization.id,
        name: organization.name,
        slug: organization.slug,
      }).catch((error) => {
        console.error("Failed to sync organization to Convex:", error);
      });
    }
  }, [isLoaded, organization, convexOrg, upsertOrg]);

  return { isSyncing: isLoaded && organization?.id && !convexOrg };
}
