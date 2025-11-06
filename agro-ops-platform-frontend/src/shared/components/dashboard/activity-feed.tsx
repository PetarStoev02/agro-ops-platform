import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/shared/components/ui/card";
import { Badge } from "@/src/shared/components/ui/badge";
import { Skeleton } from "@/src/shared/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Trans } from "@lingui/react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useOrganization } from "@clerk/nextjs";
import {
  DropletIcon,
  SearchIcon,
  PackageIcon,
  TractorIcon,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface Activity {
  _id: string;
  type: string;
  category?:
    | "chemical_treatment"
    | "field_inspection"
    | "fertilizer"
    | "farm_activity";
  description?: string;
  date: number;
  userId: string;
  fieldName?: string | null;
  fieldId?: Id<"fields"> | null;
  // Chemical Treatment fields
  chemicalName?: string;
  infestationType?: string;
  treatedArea?: number;
  // Field Inspection fields
  damage?: string;
  surveyedArea?: number;
  // Fertilizer fields
  fertilizerName?: string;
  fertilizedArea?: number;
  // Farm Activity fields
  activityType?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  isLoading?: boolean;
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  const navigate = useNavigate();
  const { organization } = useOrganization();
  let companySlug: string | undefined = undefined;
  try {
    const params = useParams({ from: "/_authed/$companySlug" });
    if (params && "companySlug" in params) {
      companySlug = params.companySlug as string | undefined;
    }
  } catch {
    // If params not available, use organization slug
  }
  if (!companySlug && organization?.slug) {
    companySlug = organization.slug;
  }

  const handleActivityClick = (activity: Activity) => {
    if (!activity.fieldId || !companySlug) return;

    navigate({
      to: "/$companySlug/fields/$fieldId",
      params: {
        companySlug,
        fieldId: activity.fieldId,
      },
    });
  };

  // Get icon for activity category
  const getActivityIcon = (category?: string) => {
    switch (category) {
      case "chemical_treatment":
        return DropletIcon;
      case "field_inspection":
        return SearchIcon;
      case "fertilizer":
        return PackageIcon;
      case "farm_activity":
        return TractorIcon;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-5 w-32" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-48" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const safeActivities = activities ?? [];

  if (safeActivities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Trans id="Recent Activities" message="Recent Activities" />
          </CardTitle>
          <CardDescription>
            <Trans
              id="Latest farming activities"
              message="Latest farming activities"
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <Trans id="No recent activities" message="No recent activities" />
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans id="Recent Activities" message="Recent Activities" />
        </CardTitle>
        <CardDescription>
          <Trans
            id="Latest farming activities"
            message="Latest farming activities"
          />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5">
          {safeActivities.map((activity) => {
            // Generate activity description based on category
            let activityDescription = "";
            if (activity.category === "chemical_treatment") {
              activityDescription = activity.chemicalName
                ? `${activity.chemicalName}${activity.infestationType ? ` - ${activity.infestationType}` : ""}${activity.treatedArea ? ` (${activity.treatedArea} dka)` : ""}`
                : activity.type;
            } else if (activity.category === "field_inspection") {
              activityDescription = activity.damage
                ? `${activity.damage}${activity.surveyedArea ? ` (${activity.surveyedArea} dka)` : ""}`
                : activity.type;
            } else if (activity.category === "fertilizer") {
              activityDescription = activity.fertilizerName
                ? `${activity.fertilizerName}${activity.fertilizedArea ? ` (${activity.fertilizedArea} dka)` : ""}`
                : activity.type;
            } else if (activity.category === "farm_activity") {
              activityDescription = activity.activityType || activity.type;
            } else {
              activityDescription = activity.description || activity.type;
            }

            const IconComponent = getActivityIcon(activity.category);
            const isClickable = !!activity.fieldId;

            return (
              <div
                key={activity._id}
                className={`flex gap-1 ${
                  isClickable
                    ? "cursor-pointer hover:bg-muted/50 transition-colors rounded-md p-2 -m-2"
                    : ""
                }`}
                onClick={() => isClickable && handleActivityClick(activity)}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {IconComponent ? (
                    <IconComponent className="h-5 w-5 text-primary" />
                  ) : (
                    <span className="text-sm font-medium text-primary">
                      {activity.type.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {activity.category === "chemical_treatment" ? (
                        <Trans
                          id="Chemical Treatment"
                          message="Chemical Treatment"
                        />
                      ) : activity.category === "field_inspection" ? (
                        <Trans
                          id="Field Inspection"
                          message="Field Inspection"
                        />
                      ) : activity.category === "fertilizer" ? (
                        <Trans id="Fertilizer" message="Fertilizer" />
                      ) : activity.category === "farm_activity" ? (
                        <Trans id="Farm Activity" message="Farm Activity" />
                      ) : (
                        activity.type
                      )}
                    </Badge>
                    {activity.fieldName && (
                      <span className="text-xs text-muted-foreground">
                        • {activity.fieldName}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{activityDescription}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.date, { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
