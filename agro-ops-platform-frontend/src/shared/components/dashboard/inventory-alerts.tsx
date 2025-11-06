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
import { useNavigate, useParams } from "@tanstack/react-router";
import { useOrganization } from "@clerk/nextjs";

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
  const navigate = useNavigate();
  const { organization } = useOrganization();

  const handleAlertClick = (category: string) => {
    if (organization?.slug) {
      navigate({
        to: "/$companySlug/warehouse",
        params: { companySlug: organization.slug },
      });
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
            <Trans id="Inventory Alerts" message="Сигнали за Инвентар" />
          </CardTitle>
          <CardDescription>
            <Trans
              id="Low stock and expiry warnings"
              message="Предупреждения за ниски наличности и срок на годност"
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>
              <Trans
                id="All inventory items are well stocked and not near expiry"
                message="Всички артикули в инвентара са добре на склад и не са близо до изтичане на срока"
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
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <Trans id="Inventory Alerts" message="Сигнали за Инвентар" />
        </CardTitle>
        <CardDescription>
          {safeAlerts.length === 0 ? (
            <Trans
              id="0 items requiring attention"
              message="0 артикула изискват внимание"
            />
          ) : safeAlerts.length === 1 ? (
            <Trans
              id="1 item requiring attention"
              message="1 артикул изисква внимание"
            />
          ) : (
            <Trans
              id="{count} items requiring attention"
              message="{count} артикула изискват внимание"
              values={{ count: safeAlerts.length }}
            />
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 w-full">
          {safeAlerts.map((item) => (
            <Alert
              key={item._id}
              variant="destructive"
              className="w-full border-destructive/50 bg-destructive/5 dark:bg-destructive/10 cursor-pointer hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-colors !grid-cols-1"
              onClick={() => handleAlertClick(item.category)}
            >
              <div className="w-full min-w-0 flex flex-col">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-medium text-sm text-destructive flex-shrink-0">
                    {item.name}
                  </span>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {item.category === "chemical" ? (
                      <Trans id="Chemical" message="Chemical" />
                    ) : item.category === "fertilizer" ? (
                      <Trans id="Fertilizer" message="Fertilizer" />
                    ) : (
                      item.category
                    )}
                  </Badge>
                </div>
                <div className="space-y-1.5 w-full min-w-0">
                  <p className="text-xs text-muted-foreground break-words">
                    <Trans
                      id="Current stock: {quantity} {unit}"
                      message="Текущ запас: {quantity} {unit}"
                      values={{ quantity: item.quantity, unit: item.unit }}
                    />
                  </p>
                  {item.alertType === "low_stock" && (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                      <span className="text-xs text-destructive whitespace-nowrap">
                        <Trans
                          id="Low stock alert"
                          message="Предупреждение за ниски наличности"
                        />
                      </span>
                    </div>
                  )}
                  {item.alertType === "near_expiry" && item.expiryDate && (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                      <span className="text-xs text-destructive">
                        <Trans
                          id="Expires {time}"
                          message="Изтича на {time}"
                          values={{
                            time: formatDistanceToNow(item.expiryDate, {
                              addSuffix: true,
                            }),
                          }}
                        />
                      </span>
                    </div>
                  )}
                  {item.alertType === "both" && item.expiryDate && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                        <span className="text-xs text-destructive whitespace-nowrap">
                          <Trans
                            id="Low stock alert"
                            message="Предупреждение за ниски наличности"
                          />
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                        <span className="text-xs text-destructive">
                          <Trans
                            id="Expires {time}"
                            message="Изтича на {time}"
                            values={{
                              time: formatDistanceToNow(item.expiryDate, {
                                addSuffix: true,
                              }),
                            }}
                          />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
