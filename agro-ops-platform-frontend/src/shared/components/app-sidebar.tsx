"use client";

import * as React from "react";
import {
  Users,
  Calendar,
  MapPin,
  Activity,
  Warehouse,
  FileText,
  CreditCard,
  ShieldCheck,
  BarChart3,
  Bell,
  Upload,
  LayoutDashboard,
  Building2,
} from "lucide-react";
import { useOrganization } from "@clerk/nextjs";

import { NavMain } from "@/src/shared/components/nav-main";
import { NavOrganization } from "@/src/shared/components/nav-org";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/src/shared/components/ui/sidebar";

const baseNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    isActive: false,
  },
  {
    title: "Organizations & Roles",
    url: "/organizations",
    icon: Building2,
    isActive: false,
  },
  {
    title: "Farm Profile",
    url: "/farm-profile",
    icon: Users,
    isActive: false,
  },
  {
    title: "Seasons & Campaigns",
    url: "/seasons",
    icon: Calendar,
    isActive: false,
  },
  {
    title: "Fields & Plots",
    url: "/fields",
    icon: MapPin,
    isActive: false,
  },
  {
    title: "Activities",
    url: "/activities",
    icon: Activity,
    isActive: false,
  },
  {
    title: "Warehouse & Inventory",
    url: "/warehouse",
    icon: Warehouse,
    isActive: false,
  },
  {
    title: "Diaries for БАБХ",
    url: "/diaries",
    icon: FileText,
    isActive: false,
  },
  {
    title: "Credits & Payments",
    url: "/credits",
    icon: CreditCard,
    isActive: false,
  },
  {
    title: "Audits & Compliance",
    url: "/audits",
    icon: ShieldCheck,
    isActive: false,
  },
  {
    title: "Reports & Analytics",
    url: "/reports",
    icon: BarChart3,
    isActive: false,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    isActive: false,
  },
  {
    title: "Imports & Exports",
    url: "/imports-exports",
    icon: Upload,
    isActive: false,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { organization } = useOrganization();
  const companySlug = organization?.slug;

  // Build nav items with company slug prefix
  const navMain = baseNavItems.map((item) => ({
    ...item,
    url: companySlug
      ? item.url === "/"
        ? `/${companySlug}`
        : `/${companySlug}${item.url}`
      : item.url,
  }));

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
