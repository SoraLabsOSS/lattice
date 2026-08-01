import { Badge } from "@sora-lattice/ui/components/badge";
import { Button } from "@sora-lattice/ui/components/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sora-lattice/ui/components/card";

const areaPath = "M0 52L18 40L36 46L54 70L72 50L100 49V86H0Z";
const strokePath = "M0 52L18 40L36 46L54 70L72 50L100 49";

export function AnalyticsCard() {
  return (
    <Card className="mx-auto w-full max-w-sm data-[size=sm]:pb-0" size="sm">
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>
          418.2K Visitors <Badge>+10%</Badge>
        </CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">
            View Analytics
          </Button>
        </CardAction>
      </CardHeader>
      <svg
        aria-label="Visitor trend"
        className="aspect-[1/0.35] w-full text-chart-1"
        preserveAspectRatio="none"
        role="img"
        viewBox="0 0 100 86"
      >
        <path d={areaPath} fill="currentColor" opacity="0.28" />
        <path
          d={strokePath}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </Card>
  );
}
