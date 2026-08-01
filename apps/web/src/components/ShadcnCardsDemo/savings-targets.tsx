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
  ItemFooter,
  ItemGroup,
} from "@sora-lattice/ui/components/item";
import { Progress } from "@sora-lattice/ui/components/progress";

export function SavingsTargets() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Savings Targets</CardTitle>
        <CardDescription>
          Active milestones for 2024 across your portfolio. Monitor how close
          you are to each savings goal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup className="gap-3">
          <Item
            className="flex-col items-stretch"
            role="listitem"
            variant="muted"
          >
            <ItemContent className="gap-3">
              <ItemDescription className="cn-font-heading font-medium text-muted-foreground text-xs uppercase tracking-wider">
                Retirement
              </ItemDescription>
              <span className="font-semibold text-3xl tabular-nums">
                $420,000
              </span>
              <Progress aria-label="Retirement savings progress" value={65} />
            </ItemContent>
            <ItemFooter>
              <span className="text-muted-foreground text-sm">
                65% achieved
              </span>
              <span className="font-medium text-sm tabular-nums">$273,000</span>
            </ItemFooter>
          </Item>
          <Item
            className="flex-col items-stretch"
            role="listitem"
            variant="muted"
          >
            <ItemContent className="gap-3">
              <ItemDescription className="cn-font-heading font-medium text-muted-foreground text-xs uppercase tracking-wider">
                Real Estate
              </ItemDescription>
              <span className="font-semibold text-3xl tabular-nums">
                $85,000
              </span>
              <Progress aria-label="Real estate savings progress" value={32} />
            </ItemContent>
            <ItemFooter>
              <span className="text-muted-foreground text-sm">
                32% achieved
              </span>
              <span className="font-medium text-sm tabular-nums">$27,200</span>
            </ItemFooter>
          </Item>
        </ItemGroup>
      </CardContent>
      <CardFooter>
        <CardDescription className="text-center">
          You have not met your targets for this year.
        </CardDescription>
      </CardFooter>
    </Card>
  );
}
