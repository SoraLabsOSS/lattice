import { Button } from "@sora-lattice/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sora-lattice/ui/components/card";
import {
  Item,
  ItemContent,
  ItemDescription,
} from "@sora-lattice/ui/components/item";

const chartData = [
  { amount: 800, month: "Dec" },
  { amount: 1100, month: "Jan" },
  { amount: 900, month: "Feb" },
  { amount: 1300, month: "Mar" },
  { amount: 750, month: "Apr" },
  { amount: 1400, month: "May" },
];

export function ContributionHistory() {
  const maxAmount = Math.max(...chartData.map((item) => item.amount));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribution History</CardTitle>
        <CardDescription>Last 6 months of activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          aria-label="Last 6 months of contribution activity"
          className="flex h-[200px] w-full items-end gap-3"
          role="img"
        >
          {chartData.map((item) => (
            <div
              className="flex h-full flex-1 flex-col justify-end gap-2"
              key={item.month}
            >
              <div
                className="min-h-2 rounded-t-md bg-chart-2"
                style={{ height: `${(item.amount / maxAmount) * 100}%` }}
              />
              <span className="text-center text-muted-foreground text-xs">
                {item.month}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardContent>
        <div className="grid w-full grid-cols-1 gap-3 xl:grid-cols-2">
          <Item className="flex-col items-stretch" variant="muted">
            <ItemContent className="gap-1">
              <ItemDescription className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                Upcoming
              </ItemDescription>
              <span className="cn-font-heading font-semibold text-base">
                May 2024
              </span>
              <span className="text-muted-foreground text-sm">Scheduled</span>
            </ItemContent>
          </Item>
          <Item
            className="hidden flex-col items-stretch xl:flex"
            variant="muted"
          >
            <ItemContent className="gap-1">
              <ItemDescription className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                Savings Plan
              </ItemDescription>
              <span className="cn-font-heading font-semibold text-base">
                Accelerated
              </span>
              <span className="text-muted-foreground text-sm">Recurring</span>
            </ItemContent>
          </Item>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Full Report</Button>
      </CardFooter>
    </Card>
  );
}
