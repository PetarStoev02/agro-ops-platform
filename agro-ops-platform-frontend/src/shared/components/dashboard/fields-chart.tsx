import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/shared/components/ui/card";
import { Skeleton } from "@/src/shared/components/ui/skeleton";
import { Trans } from "@lingui/react";
import { useLingui } from "@lingui/react";

interface CropTypeData {
  cropType: string;
  count: number;
  area: number;
}

interface FieldsChartProps {
  data: CropTypeData[];
  totalFields: number;
  totalArea: number;
  isLoading?: boolean;
}

export function FieldsChart({
  data,
  totalFields,
  totalArea,
  isLoading,
}: FieldsChartProps) {
  const { i18n } = useLingui();

  // Map crop type values to translated labels
  const cropTypeMap = new Map([
    ["wheat", i18n._("Wheat")],
    ["corn", i18n._("Corn")],
    ["sunflower", i18n._("Sunflower")],
    ["barley", i18n._("Barley")],
    ["rapeseed", i18n._("Rapeseed")],
  ]);

  const getCropTypeLabel = (cropType: string) => {
    return cropTypeMap.get(cropType) || cropType;
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
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const safeTotalFields = totalFields ?? 0;
  const safeTotalArea = totalArea ?? 0;
  const safeData = data ?? [];

  if (safeData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Trans id="Fields by Crop Type" message="Fields by Crop Type" />
          </CardTitle>
          <CardDescription>
            <Trans
              id="Distribution of fields and area"
              message="Distribution of fields and area"
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <Trans
              id="No fields data available"
              message="No fields data available"
            />
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentages
  const dataWithPercentages = safeData.map((item) => ({
    ...item,
    percentageOfFields:
      safeTotalFields > 0 ? (item.count / safeTotalFields) * 100 : 0,
    percentageOfArea: safeTotalArea > 0 ? (item.area / safeTotalArea) * 100 : 0,
  }));

  // Sort by count descending
  const sortedData = [...dataWithPercentages].sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans id="Fields by Crop Type" message="Fields by Crop Type" />
        </CardTitle>
        <CardDescription>
          <Trans
            id="{count} fields • {area} hectares total"
            message="{count} fields • {area} hectares total"
            values={{ count: safeTotalFields, area: safeTotalArea.toFixed(2) }}
          />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedData.map((item) => (
            <div key={item.cropType} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {getCropTypeLabel(item.cropType)}
                </span>
                <span className="text-muted-foreground">
                  <Trans
                    id="{count} fields • {area} ha"
                    message="{count} fields • {area} ha"
                    values={{ count: item.count, area: item.area.toFixed(1) }}
                  />
                </span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${item.percentageOfFields}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Trans
                      id="{percentage}% of fields"
                      message="{percentage}% of fields"
                      values={{
                        percentage: item.percentageOfFields.toFixed(1),
                      }}
                    />
                  </p>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 transition-all"
                      style={{ width: `${item.percentageOfArea}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Trans
                      id="{percentage}% of area"
                      message="{percentage}% of area"
                      values={{ percentage: item.percentageOfArea.toFixed(1) }}
                    />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
