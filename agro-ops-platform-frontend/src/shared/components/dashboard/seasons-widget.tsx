"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/ui/card";
import { Calendar, CalendarDays } from "lucide-react";
import { Trans } from "@lingui/react";
import { format } from "date-fns";

interface Season {
  _id: string;
  name: string;
  year: string;
  startDate: number;
  endDate: number;
  isActive: boolean;
}

interface SeasonsWidgetProps {
  seasons: Season[];
  isLoading?: boolean;
}

export function SeasonsWidget({ seasons, isLoading }: SeasonsWidgetProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <Trans
              id="Current Seasons & Campaigns"
              message="Current Seasons & Campaigns"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeSeasons = seasons.filter((s) => s.isActive);
  const allSeasons = seasons.length > 0 ? seasons : [];

  if (allSeasons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <Trans
              id="Current Seasons & Campaigns"
              message="Current Seasons & Campaigns"
            />
          </CardTitle>
          <CardDescription>
            <Trans id="No seasons configured" message="No seasons configured" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <Trans
              id="Create a season to start tracking your campaigns"
              message="Create a season to start tracking your campaigns"
            />
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <Trans
            id="Current Seasons & Campaigns"
            message="Current Seasons & Campaigns"
          />
        </CardTitle>
        <CardDescription>
          <Trans
            id="{activeCount} active, {totalCount} total"
            message="{activeCount} active, {totalCount} total"
            values={{
              activeCount: activeSeasons.length,
              totalCount: allSeasons.length,
            }}
          />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeSeasons.length > 0 ? (
            <>
              <div>
                <p className="text-sm font-medium mb-2">
                  <Trans id="Active Seasons" message="Active Seasons" />
                </p>
                <div className="space-y-3">
                  {activeSeasons.map((season) => (
                    <div
                      key={season._id}
                      className="p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{season.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(season.startDate), "MMM d, yyyy")}{" "}
                            - {format(new Date(season.endDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <CalendarDays className="h-3 w-3" />
                          <Trans id="Active" message="Active" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {allSeasons.length > activeSeasons.length && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-2 text-muted-foreground">
                    <Trans id="All Seasons" message="All Seasons" />
                  </p>
                  <div className="space-y-2">
                    {allSeasons
                      .filter((s) => !s.isActive)
                      .slice(0, 3)
                      .map((season) => (
                        <div
                          key={season._id}
                          className="p-2 bg-muted/50 rounded text-sm"
                        >
                          <p className="font-medium">{season.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(season.startDate), "MMM yyyy")} -{" "}
                            {format(new Date(season.endDate), "MMM yyyy")}
                          </p>
                        </div>
                      ))}
                    {allSeasons.filter((s) => !s.isActive).length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        <Trans
                          id="+{count} more seasons"
                          message="+{count} more seasons"
                          values={{
                            count:
                              allSeasons.filter((s) => !s.isActive).length - 3,
                          }}
                        />
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              {allSeasons.slice(0, 5).map((season) => (
                <div
                  key={season._id}
                  className="p-2 bg-muted/50 rounded text-sm"
                >
                  <p className="font-medium">{season.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(season.startDate), "MMM yyyy")} -{" "}
                    {format(new Date(season.endDate), "MMM yyyy")}
                  </p>
                </div>
              ))}
              {allSeasons.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  <Trans
                    id="+{count} more seasons"
                    message="+{count} more seasons"
                    values={{
                      count: allSeasons.length - 5,
                    }}
                  />
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
