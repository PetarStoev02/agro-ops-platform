"use client";

import { useQuery } from "convex/react";
import { useOrganization, useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { StatCard } from "@/src/shared/components/dashboard/stat-card";
import { FieldsChart } from "@/src/shared/components/dashboard/fields-chart";
import { ActivityFeed } from "@/src/shared/components/dashboard/activity-feed";
import { InventoryAlerts } from "@/src/shared/components/dashboard/inventory-alerts";
import { FinancialWidget } from "@/src/shared/components/dashboard/financial-widget";
import { AuditStatus } from "@/src/shared/components/dashboard/audit-status";
import { MemberActivity } from "@/src/shared/components/dashboard/member-activity";
import { Package, MapPin, Users, Bell } from "lucide-react";
import { useMemo } from "react";
import { Trans } from "@lingui/react";

export const iframeHeight = "800px";
export const description = "A sidebar with a header and a search form.";

interface MemberSegment {
  level: "high" | "medium" | "low";
  count: number;
  percentage: number;
}

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

  const financialSummary = useQuery(
    api.dashboard.getFinancialSummary,
    organizationId ? { organizationId } : "skip",
  );

  const pendingAudits = useQuery(
    api.dashboard.getPendingAudits,
    organizationId ? { organizationId } : "skip",
  );

  const memberActivityCounts = useQuery(
    api.dashboard.getMemberActivityCounts,
    organizationId ? { organizationId } : "skip",
  );

  // Calculate member activity segmentation
  const memberSegmentation = useMemo<{
    segments: MemberSegment[];
    totalMembers: number;
  }>(() => {
    const safeMembersCount = organization?.membersCount ?? 0;
    if (safeMembersCount === 0 || !memberActivityCounts) {
      return {
        segments: [
          { level: "high", count: 0, percentage: 0 },
          { level: "medium", count: 0, percentage: 0 },
          { level: "low", count: 0, percentage: 0 },
        ],
        totalMembers: 0,
      };
    }

    const activityCounts = Object.values(
      memberActivityCounts.activityCountByUser ?? {},
    );
    const totalMembers = safeMembersCount;

    // Count members in each segment
    const highActivity = activityCounts.filter((count) => count >= 10).length;
    const mediumActivity = activityCounts.filter(
      (count) => count >= 3 && count < 10,
    ).length;
    const lowActivity = totalMembers - highActivity - mediumActivity;

    const segments: MemberSegment[] = [
      {
        level: "high",
        count: highActivity,
        percentage: totalMembers > 0 ? (highActivity / totalMembers) * 100 : 0,
      },
      {
        level: "medium",
        count: mediumActivity,
        percentage:
          totalMembers > 0 ? (mediumActivity / totalMembers) * 100 : 0,
      },
      {
        level: "low",
        count: lowActivity,
        percentage: totalMembers > 0 ? (lowActivity / totalMembers) * 100 : 0,
      },
    ];

    return { segments, totalMembers };
  }, [organization?.membersCount, memberActivityCounts]);

  // Determine loading states more granularly
  const isOrgLoading = convexOrg === undefined && organization?.id;
  const isStatsLoading = !organizationId || stats === undefined;
  const isFieldsLoading = !organizationId || fieldsBreakdown === undefined;
  const isActivitiesLoading = !organizationId || recentActivities === undefined;
  const isInventoryLoading = !organizationId || lowStockInventory === undefined;
  const isFinancialLoading = !organizationId || financialSummary === undefined;
  const isAuditsLoading = !organizationId || pendingAudits === undefined;
  const isMemberActivityLoading =
    !organizationId || memberActivityCounts === undefined;

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <StatCard
          title={
            (
              <Trans id="Team Members" message="Team Members" />
            ) as React.ReactNode
          }
          value={organization?.membersCount ?? 0}
          description={
            (
              <Trans id="Organization members" message="Organization members" />
            ) as React.ReactNode
          }
          icon={Users}
          isLoading={!organization}
        />
        <StatCard
          title={
            (
              <Trans id="Notifications" message="Notifications" />
            ) as React.ReactNode
          }
          value={safeStats.unreadNotifications}
          description={
            (
              <Trans
                id="{count} activities this week"
                message="{count} activities this week"
                values={{ count: safeStats.recentActivitiesCount }}
              />
            ) as React.ReactNode
          }
          icon={Bell}
          isLoading={isStatsLoading}
        />
      </div>

      {/* Second Row - Charts and Widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <FieldsChart
          data={fieldsBreakdown?.byCropType ?? []}
          totalFields={fieldsBreakdown?.totalFields ?? 0}
          totalArea={fieldsBreakdown?.totalArea ?? 0}
          isLoading={isFieldsLoading}
        />
        <MemberActivity
          segments={memberSegmentation.segments}
          totalMembers={memberSegmentation.totalMembers}
          isLoading={!organization || isMemberActivityLoading}
        />
        <FinancialWidget
          data={financialSummary ?? null}
          isLoading={isFinancialLoading}
        />
      </div>

      {/* Third Row - Activity Feed and Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <ActivityFeed
          activities={recentActivities ?? []}
          isLoading={isActivitiesLoading}
        />
        <div className="space-y-4">
          <InventoryAlerts
            alerts={lowStockInventory ?? []}
            isLoading={isInventoryLoading}
          />
          <AuditStatus
            pendingCount={pendingAudits?.count ?? 0}
            audits={pendingAudits?.audits ?? []}
            isLoading={isAuditsLoading}
          />
        </div>
      </div>
    </div>
  );
}
