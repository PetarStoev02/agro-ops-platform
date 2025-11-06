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
      !convexOrg // Only sync if not already in Convex
    ) {
      // Generate slug from organization name if not provided
      const slug =
        organization.slug ||
        organization.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") ||
        organization.id.slice(0, 8); // Fallback to first 8 chars of ID

      // Sync organization to Convex
      upsertOrg({
        clerkOrgId: organization.id,
        name: organization.name,
        slug: slug,
      }).catch((error) => {
        console.error("Failed to sync organization to Convex:", error);
      });
    }
  }, [isLoaded, organization, convexOrg, upsertOrg]);

  return { isSyncing: isLoaded && organization?.id && !convexOrg };
}
