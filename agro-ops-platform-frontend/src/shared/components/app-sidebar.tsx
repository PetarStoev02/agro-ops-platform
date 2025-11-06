"use client";

import * as React from "react";
import { Calendar, MapPin, Warehouse, LayoutDashboard } from "lucide-react";
import { useOrganization } from "@clerk/nextjs";
import { useLocation } from "@tanstack/react-router";
import { Trans } from "@lingui/react";

import { NavMain } from "@/src/shared/components/nav-main";
import { NavOrganization } from "@/src/shared/components/nav-org";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/src/shared/components/ui/sidebar";

const baseNavItems = [
  {
    titleKey: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    titleKey: "Fields & Plots",
    url: "/fields",
    icon: MapPin,
  },
  {
    titleKey: "Warehouse & Inventory",
    url: "/warehouse",
    icon: Warehouse,
  },
  {
    titleKey: "Seasons & Campaigns",
    url: "/seasons",
    icon: Calendar,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { organization } = useOrganization();
  const location = useLocation();
  const companySlug = organization?.slug;

  // Get current route pathname (reactive to route changes)
  const currentPath = location.pathname;

  // Build nav items with company slug prefix and determine if active
  const navMain = baseNavItems.map((item) => {
    const fullUrl = companySlug
      ? item.url === "/"
        ? `/${companySlug}`
        : `/${companySlug}${item.url}`
      : item.url;

    // Normalize paths for comparison (remove trailing slashes)
    const normalizedCurrentPath = currentPath.replace(/\/$/, "") || "/";
    const normalizedFullUrl = fullUrl.replace(/\/$/, "") || "/";

    // Check if current path matches this item's URL
    // For dashboard (/) route, only match exactly
    // For other routes, match if path starts with the item URL
    let isActive = false;
    if (item.url === "/") {
      // Dashboard: match exactly or with company slug
      isActive =
        normalizedCurrentPath === normalizedFullUrl ||
        normalizedCurrentPath === `/${companySlug}` ||
        normalizedCurrentPath === "/";
    } else {
      // Other routes: match if path starts with the full URL (with trailing slash check)
      isActive =
        normalizedCurrentPath === normalizedFullUrl ||
        (normalizedCurrentPath.startsWith(normalizedFullUrl) &&
          normalizedCurrentPath.length > normalizedFullUrl.length &&
          normalizedCurrentPath[normalizedFullUrl.length] === "/");
    }

    return {
      ...item,
      url: fullUrl,
      isActive,
      title: <Trans id={item.titleKey} message={item.titleKey} />,
    };
  });

  const data = {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/next.svg",
    },
    navMain,
  };

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavOrganization organization={organization} />
      </SidebarFooter>
    </Sidebar>
  );
}
