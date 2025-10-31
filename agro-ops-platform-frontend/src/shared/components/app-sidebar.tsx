"use client";

import * as React from "react";
import {
  Building2,
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
} from "lucide-react";

import { NavMain } from "@/src/shared/components/nav-main";
import { NavUser } from "@/src/shared/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/shared/components/ui/sidebar";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/next.svg",
  },
  navMain: [
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
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    Agro Ops Platform
                  </span>
                  <span className="truncate text-xs">MVP</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
