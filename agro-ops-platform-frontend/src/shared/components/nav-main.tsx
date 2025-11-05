"use client";

import { type LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/shared/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string | ReactNode;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item, index) => {
          const titleText =
            typeof item.title === "string" ? item.title : `item-${index}`;
          return (
            <SidebarMenuItem key={titleText}>
              <SidebarMenuButton
                asChild
                tooltip={titleText}
                isActive={item.isActive}
              >
                <Link to={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
