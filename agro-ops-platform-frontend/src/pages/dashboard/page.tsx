"use client";

import { useQuery } from "convex/react";
import { useOrganization, useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { StatCard } from "@/src/shared/components/dashboard/stat-card";
import { FieldsChart } from "@/src/shared/components/dashboard/fields-chart";
import { ActivityFeed } from "@/src/shared/components/dashboard/activity-feed";
import { InventoryAlerts } from "@/src/shared/components/dashboard/inventory-alerts";
import { SeasonsWidget } from "@/src/shared/components/dashboard/seasons-widget";
import { Package, MapPin } from "lucide-react";
import { Trans } from "@lingui/react";

export const iframeHeight = "800px";
export const description = "A sidebar with a header and a search form.";

export default function DashboardPage() {
  const { organization } = useOrganization();
  const { user } = useUser();

  // Fetch organization from Convex
  const convexOrg = useQuery(
    api.organizations.getByClerkOrgId,
    organization?.id ? { clerkOrgId: organization.id } : "skip",
  );

  const organizationId = convexOrg?._id;

  // Fetch all dashboard data
  const stats = useQuery(
    api.dashboard.getDashboardStats,
    organizationId && user?.id ? { organizationId, userId: user.id } : "skip",
  );

  const fieldsBreakdown = useQuery(
    api.dashboard.getFieldsBySeasonWithBreakdown,
    organizationId ? { organizationId } : "skip",
  );

  const recentActivities = useQuery(
    api.dashboard.getRecentActivities,
    organizationId ? { organizationId, limit: 10 } : "skip",
  );

  const lowStockInventory = useQuery(
    api.dashboard.getLowStockInventory,
    organizationId ? { organizationId, quantityThreshold: 10 } : "skip",
  );

  const allSeasons = useQuery(
    api.seasons.getByOrganization,
    organizationId ? { organizationId } : "skip",
  );

  // Determine loading states more granularly
  const isOrgLoading = convexOrg === undefined && organization?.id;
  const isStatsLoading = !organizationId || stats === undefined;
  const isFieldsLoading = !organizationId || fieldsBreakdown === undefined;
  const isActivitiesLoading = !organizationId || recentActivities === undefined;
  const isInventoryLoading = !organizationId || lowStockInventory === undefined;
  const isSeasonsLoading = !organizationId || allSeasons === undefined;

  // Show 0 values once data has loaded (even if empty)
  const safeStats = stats ?? {
    totalProducts: 0,
    totalProductQuantity: 0,
    activeFields: 0,
    totalArea: 0,
    unreadNotifications: 0,
    recentActivitiesCount: 0,
  };

  // Show message if organization isn't synced to Convex yet
  if (organization?.id && convexOrg === undefined && !isOrgLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-lg font-medium">
            <Trans
              id="Setting up organization..."
              message="Setting up organization..."
            />
          </p>
          <p className="text-sm text-muted-foreground">
            <Trans
              id="Please wait while we sync your organization data. This may take a few moments."
              message="Please wait while we sync your organization data. This may take a few moments."
            />
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Row - Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title={
            (
              <Trans id="Total Products" message="Total Products" />
            ) as React.ReactNode
          }
          value={safeStats.totalProducts}
          description={
            (
              <Trans
                id="{count} items in stock"
                message="{count} items in stock"
                values={{ count: safeStats.totalProductQuantity }}
              />
            ) as React.ReactNode
          }
          icon={Package}
          isLoading={isStatsLoading}
        />
        <StatCard
          title={
            (
              <Trans id="Active Fields" message="Active Fields" />
            ) as React.ReactNode
          }
          value={safeStats.activeFields}
          description={
            (
              <Trans
                id="{area} hectares total"
                message="{area} hectares total"
                values={{ area: safeStats.totalArea.toFixed(1) }}
              />
            ) as React.ReactNode
          }
          icon={MapPin}
          isLoading={isStatsLoading}
        />
      </div>

      {/* Second Row - Charts and Widgets */}
      <div className="grid gap-4 md:grid-cols-2">
        <FieldsChart
          data={fieldsBreakdown?.byCropType ?? []}
          totalFields={fieldsBreakdown?.totalFields ?? 0}
          totalArea={fieldsBreakdown?.totalArea ?? 0}
          isLoading={isFieldsLoading}
        />
        <SeasonsWidget
          seasons={allSeasons ?? []}
          isLoading={isSeasonsLoading}
        />
      </div>

      {/* Third Row - Activity Feed and Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <ActivityFeed
          activities={recentActivities ?? []}
          isLoading={isActivitiesLoading}
        />
        <InventoryAlerts
          alerts={lowStockInventory ?? []}
          isLoading={isInventoryLoading}
        />
      </div>
    </div>
  );
}
