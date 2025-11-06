import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/shared/components/ui/card";
import { Alert, AlertDescription } from "@/src/shared/components/ui/alert";
import { Badge } from "@/src/shared/components/ui/badge";
import { Skeleton } from "@/src/shared/components/ui/skeleton";
import { AlertTriangle, Package } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Trans } from "@lingui/react";

interface InventoryAlert {
  _id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate?: number;
  alertType: "low_stock" | "near_expiry" | "both";
}

interface InventoryAlertsProps {
  alerts: InventoryAlert[];
  isLoading?: boolean;
}

export function InventoryAlerts({ alerts, isLoading }: InventoryAlertsProps) {
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
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const safeAlerts = alerts ?? [];

  if (safeAlerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Trans id="Inventory Alerts" message="Inventory Alerts" />
          </CardTitle>
          <CardDescription>
            <Trans
              id="Low stock and expiry warnings"
              message="Low stock and expiry warnings"
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>
              <Trans
                id="All inventory items are well stocked and not near expiry"
                message="All inventory items are well stocked and not near expiry"
              />
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <Trans id="Inventory Alerts" message="Inventory Alerts" />
        </CardTitle>
        <CardDescription>
          {safeAlerts.length === 0 ? (
            <Trans
              id="0 items requiring attention"
              message="0 items requiring attention"
            />
          ) : safeAlerts.length === 1 ? (
            <Trans
              id="1 item requiring attention"
              message="1 item requiring attention"
            />
          ) : (
            <Trans
              id="{count} items requiring attention"
              message="{count} items requiring attention"
              values={{ count: safeAlerts.length }}
            />
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {safeAlerts.map((item) => (
            <Alert
              key={item._id}
              variant="destructive"
              className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{item.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      <Trans
                        id="Current stock: {quantity} {unit}"
                        message="Current stock: {quantity} {unit}"
                        values={{ quantity: item.quantity, unit: item.unit }}
                      />
                    </p>
                    {item.alertType === "low_stock" && (
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        ⚠️{" "}
                        <Trans id="Low stock alert" message="Low stock alert" />
                      </p>
                    )}
                    {item.alertType === "near_expiry" && item.expiryDate && (
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        ⚠️{" "}
                        <Trans
                          id="Expires {time}"
                          message="Expires {time}"
                          values={{
                            time: formatDistanceToNow(item.expiryDate, {
                              addSuffix: true,
                            }),
                          }}
                        />
                      </p>
                    )}
                    {item.alertType === "both" && item.expiryDate && (
                      <div className="text-xs text-amber-700 dark:text-amber-400">
                        <p>
                          ⚠️{" "}
                          <Trans
                            id="Low stock alert"
                            message="Low stock alert"
                          />
                        </p>
                        <p>
                          ⚠️{" "}
                          <Trans
                            id="Expires {time}"
                            message="Expires {time}"
                            values={{
                              time: formatDistanceToNow(item.expiryDate, {
                                addSuffix: true,
                              }),
                            }}
                          />
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
