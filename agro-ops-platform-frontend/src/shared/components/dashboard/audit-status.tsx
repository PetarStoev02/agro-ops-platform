import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/shared/components/ui/card";
import { Badge } from "@/src/shared/components/ui/badge";
import { Skeleton } from "@/src/shared/components/ui/skeleton";
import { ClipboardCheck, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Trans } from "@lingui/react";

interface Audit {
  _id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  date: number;
  userId: string;
}

interface AuditStatusProps {
  pendingCount: number;
  audits: Audit[];
  isLoading?: boolean;
}

export function AuditStatus({
  pendingCount,
  audits,
  isLoading,
}: AuditStatusProps) {
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
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const safePendingCount = pendingCount ?? 0;
  const safeAudits = audits ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          <Trans id="Pending Audits" message="Pending Audits" />
        </CardTitle>
        <CardDescription>
          {safePendingCount === 0 ? (
            <Trans
              id="0 audits awaiting completion"
              message="0 audits awaiting completion"
            />
          ) : safePendingCount === 1 ? (
            <Trans
              id="1 audit awaiting completion"
              message="1 audit awaiting completion"
            />
          ) : (
            <Trans
              id="{count} audits awaiting completion"
              message="{count} audits awaiting completion"
              values={{ count: safePendingCount }}
            />
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {safePendingCount === 0 ? (
          <div className="text-center py-6">
            <ClipboardCheck className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              <Trans
                id="All audits are up to date"
                message="All audits are up to date"
              />
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {safeAudits.map((audit) => (
              <div
                key={audit._id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">
                      {audit.title}
                    </p>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {audit.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {audit.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Trans
                      id="Scheduled {time}"
                      message="Scheduled {time}"
                      values={{
                        time: formatDistanceToNow(audit.date, {
                          addSuffix: true,
                        }),
                      }}
                    />
                  </p>
                </div>
              </div>
            ))}
            {safePendingCount > safeAudits.length && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                <Trans
                  id="+{count} more pending audit"
                  message="+{count} more pending audit"
                  values={{ count: safePendingCount - safeAudits.length }}
                />
                {safePendingCount - safeAudits.length !== 1 && "s"}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
