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

interface Activity {
  _id: string;
  type: string;
  description?: string;
  date: number;
  userId: string;
  fieldName?: string | null;
}

interface ActivityFeedProps {
  activities: Activity[];
  isLoading?: boolean;
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
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
        <div className="space-y-4">
          {safeActivities.map((activity) => (
            <div
              key={activity._id}
              className="flex gap-3 pb-4 border-b last:border-0 last:pb-0"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-primary">
                  {activity.type.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {activity.type}
                  </Badge>
                  {activity.fieldName && (
                    <span className="text-xs text-muted-foreground">
                      • {activity.fieldName}
                    </span>
                  )}
                </div>
                {activity.description && (
                  <p className="text-sm">{activity.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(activity.date, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
