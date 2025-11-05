"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth, useOrganizationList, useOrganization } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

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

  useEffect(() => {
    if (isLoaded && orgListLoaded && userId && !hasRedirectedRef.current) {
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
        // No organization - redirect to organizations page (but we need an org first)
        // Since we can't access organizations without an org, just show a message
        // In practice, users should create/join an org first
        return;
      }

      // Redirect to company slug route (dashboard)
      if (activeOrg.slug) {
        hasRedirectedRef.current = true;
        navigate({
          to: "/$companySlug",
          params: { companySlug: activeOrg.slug },
          replace: true,
        });
      }
    }
  }, [
    isLoaded,
    orgListLoaded,
    userId,
    organization,
    userMemberships,
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
