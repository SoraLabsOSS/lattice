import { Badge } from "@sora-lattice/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sora-lattice/ui/components/card";
import { Item, ItemContent } from "@sora-lattice/ui/components/item";
import { Separator } from "@sora-lattice/ui/components/separator";

const netRoyalties = 1248.75;
const processingFee = 37.46;
const totalClaimable = netRoyalties - processingFee;

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

export function ClaimableBalance() {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Claimable Balance</CardDescription>
        <CardTitle className="text-4xl tabular-nums">
          ${formatCurrency(totalClaimable)}
        </CardTitle>
        <Badge variant="outline">
          <span className="size-2 rounded-full bg-yellow-500" />
          Pending Setup
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end">
        <Item className="flex-col items-stretch" variant="muted">
          <ItemContent className="gap-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Net Royalties
              </span>
              <span className="font-medium text-sm tabular-nums">
                ${formatCurrency(netRoyalties)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Processing Fee
              </span>
              <span className="font-medium text-sm tabular-nums">
                -${formatCurrency(processingFee)}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Total Ready to Claim
              </span>
              <span className="font-semibold text-sm tabular-nums">
                ${formatCurrency(totalClaimable)} USD
              </span>
            </div>
          </ItemContent>
        </Item>
      </CardContent>
      <CardFooter>
        <CardDescription>
          Once your bank is connected, balances over $10.00 are automatically
          eligible for monthly distribution on the 15th of each month.
        </CardDescription>
      </CardFooter>
    </Card>
  );
}
