"use client";

import { Building2 } from "lucide-react";
import { useOrganization, useClerk } from "@clerk/nextjs";

type Organization = NonNullable<
  ReturnType<typeof useOrganization>["organization"]
>;

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/shared/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/shared/components/ui/sidebar";

export function NavOrganization({
  organization,
}: {
  organization: Organization | null | undefined;
}) {
  const { openOrganizationProfile } = useClerk();

  if (!organization) {
    return null;
  }

  // Get organization logo from Clerk
  const orgImageUrl = organization.imageUrl;
  const orgName = organization.name || "Organization";
  const orgSlug = organization.slug || "";

  // Generate fallback initials from organization name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          onClick={() => openOrganizationProfile()}
          className="cursor-pointer"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={orgImageUrl} alt={orgName} />
            <AvatarFallback className="rounded-lg">
              {orgName ? (
                getInitials(orgName)
              ) : (
                <Building2 className="size-4" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{orgName}</span>
            {orgSlug && <span className="truncate text-xs">{orgSlug}</span>}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
