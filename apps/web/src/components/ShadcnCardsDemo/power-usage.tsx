import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sora-lattice/ui/components/card";
import { Separator } from "@sora-lattice/ui/components/separator";

const chartData = [
  { hour: "6a", usage: 1.2 },
  { hour: "8a", usage: 2.8 },
  { hour: "10a", usage: 3.1 },
  { hour: "12p", usage: 2.4 },
  { hour: "2p", usage: 3.4 },
  { hour: "4p", usage: 2.9 },
  { hour: "6p", usage: 3.8 },
  { hour: "8p", usage: 3.2 },
];

export function PowerUsage() {
  const maxUsage = Math.max(...chartData.map((item) => item.usage));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Power Usage</CardTitle>
        <CardDescription>Whole Home</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div
          aria-label="Power usage by hour"
          className="flex h-[140px] w-full items-end gap-2"
          role="img"
        >
          {chartData.map((item) => (
            <div
              className="flex h-full flex-1 flex-col justify-end gap-1.5"
              key={item.hour}
            >
              <div
                className="min-h-2 rounded-t bg-chart-2"
                style={{ height: `${(item.usage / maxUsage) * 100}%` }}
              />
              <span className="text-center text-muted-foreground text-xs">
                {item.hour}
              </span>
            </div>
          ))}
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-sm">
              Currently Using
            </span>
            <span className="font-semibold text-lg tabular-nums">3.4 kW</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-sm">Solar Gen</span>
            <span className="font-semibold text-lg tabular-nums">+1.2 kW</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
