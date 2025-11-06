import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/shared/components/ui/card";
import { Skeleton } from "@/src/shared/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Trans } from "@lingui/react";

interface FinancialData {
  income: number;
  expenses: number;
  balance: number;
  currency: string;
  period: {
    startDate: number;
    endDate: number;
    seasonName: string;
  };
  transactionCount: number;
}

interface FinancialWidgetProps {
  data: FinancialData | null | undefined;
  isLoading?: boolean;
}

export function FinancialWidget({ data, isLoading }: FinancialWidgetProps) {
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
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Trans id="Financial Summary" message="Financial Summary" />
          </CardTitle>
          <CardDescription>
            <Trans id="Income and expenses" message="Income and expenses" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <Trans
              id="No financial data available"
              message="No financial data available"
            />
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: data.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const safeIncome = data.income ?? 0;
  const safeExpenses = data.expenses ?? 0;
  const safeBalance = safeIncome - safeExpenses;
  const isProfit = safeBalance >= 0;
  const profitPercentage =
    safeIncome > 0 ? ((safeBalance / safeIncome) * 100).toFixed(1) : "0";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          <Trans id="Financial Summary" message="Financial Summary" />
        </CardTitle>
        <CardDescription>
          <Trans
            id="{seasonName} • {count} transactions"
            message="{seasonName} • {count} transactions"
            values={{
              seasonName: data.period.seasonName,
              count: data.transactionCount ?? 0,
            }}
          />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Income */}
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                <Trans id="Income" message="Income" />
              </p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {formatCurrency(safeIncome)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-700 dark:text-green-400" />
          </div>

          {/* Expenses */}
          <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                <Trans id="Expenses" message="Expenses" />
              </p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {formatCurrency(safeExpenses)}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-700 dark:text-red-400" />
          </div>

          {/* Balance */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  <Trans id="Net Balance" message="Net Balance" />
                </p>
                <p
                  className={`text-3xl font-bold ${isProfit ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(safeBalance)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  <Trans id="Profit Margin" message="Profit Margin" />
                </p>
                <p
                  className={`text-lg font-semibold ${isProfit ? "text-green-600" : "text-red-600"}`}
                >
                  {isProfit ? "+" : ""}
                  {profitPercentage}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
