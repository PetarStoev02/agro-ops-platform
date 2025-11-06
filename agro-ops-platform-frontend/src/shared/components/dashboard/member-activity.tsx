import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/shared/components/ui/card";
import { Badge } from "@/src/shared/components/ui/badge";
import { Skeleton } from "@/src/shared/components/ui/skeleton";
import { Users } from "lucide-react";
import { Trans } from "@lingui/react";

interface MemberSegment {
  level: "high" | "medium" | "low";
  count: number;
  percentage: number;
}

interface MemberActivityProps {
  segments: MemberSegment[];
  totalMembers: number;
  isLoading?: boolean;
}

export function MemberActivity({
  segments,
  totalMembers,
  isLoading,
}: MemberActivityProps) {
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
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const safeTotalMembers = totalMembers ?? 0;
  const safeSegments = segments ?? [];

  const getSegmentColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-green-500";
      case "medium":
        return "bg-amber-500";
      case "low":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getSegmentLabel = (level: string) => {
    switch (level) {
      case "high":
        return <Trans id="High Activity" message="High Activity" />;
      case "medium":
        return <Trans id="Medium Activity" message="Medium Activity" />;
      case "low":
        return <Trans id="Low/Inactive" message="Low/Inactive" />;
      default:
        return level;
    }
  };

  const getSegmentDescription = (level: string) => {
    switch (level) {
      case "high":
        return (
          <Trans
            id="10+ activities this season"
            message="10+ activities this season"
          />
        );
      case "medium":
        return (
          <Trans
            id="3-9 activities this season"
            message="3-9 activities this season"
          />
        );
      case "low":
        return (
          <Trans
            id="0-2 activities this season"
            message="0-2 activities this season"
          />
        );
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <Trans id="Member Activity" message="Member Activity" />
        </CardTitle>
        <CardDescription>
          {safeTotalMembers === 0 ? (
            <Trans
              id="0 team members segmented by activity level"
              message="0 team members segmented by activity level"
            />
          ) : safeTotalMembers === 1 ? (
            <Trans
              id="1 team member segmented by activity level"
              message="1 team member segmented by activity level"
            />
          ) : (
            <Trans
              id="{count} team members segmented by activity level"
              message="{count} team members segmented by activity level"
              values={{ count: safeTotalMembers }}
            />
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {safeSegments.map((segment) => (
            <div key={segment.level} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`${getSegmentColor(segment.level)} text-white border-0`}
                  >
                    {getSegmentLabel(segment.level)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {getSegmentDescription(segment.level)}
                  </span>
                </div>
                <span className="font-semibold">{segment.count ?? 0}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getSegmentColor(segment.level)} transition-all`}
                    style={{ width: `${segment.percentage ?? 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">
                  {(segment.percentage ?? 0).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
