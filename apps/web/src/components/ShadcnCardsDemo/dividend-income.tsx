import { Button } from "@sora-lattice/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sora-lattice/ui/components/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@sora-lattice/ui/components/item";
import { X } from "lucide-react";

const HOLDINGS = [
  {
    amount: "$1,842.10",
    data: [
      { q: "Q1", value: 380 },
      { q: "Q2", value: 420 },
      { q: "Q3", value: 390 },
      { q: "Q4", value: 652 },
    ],
    name: "Vanguard",
    shares: "450 Shares",
  },
  {
    amount: "$928.40",
    data: [
      { q: "Q1", value: 180 },
      { q: "Q2", value: 210 },
      { q: "Q3", value: 320 },
      { q: "Q4", value: 218 },
    ],
    name: "S&P 500 VOO",
    shares: "112 Shares",
  },
  {
    amount: "$340.00",
    data: [
      { q: "Q1", value: 60 },
      { q: "Q2", value: 70 },
      { q: "Q3", value: 120 },
      { q: "Q4", value: 90 },
    ],
    name: "Apple AAPL",
    shares: "85 Shares",
  },
  {
    amount: "$1,139.50",
    data: [
      { q: "Q1", value: 240 },
      { q: "Q2", value: 260 },
      { q: "Q3", value: 280 },
      { q: "Q4", value: 360 },
    ],
    name: "Realty Income",
    shares: "320 Shares",
  },
];

export function DividendIncome() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Q2 Dividend Income</CardTitle>
        <CardDescription>
          Quarterly dividend payouts across your portfolio holdings.
        </CardDescription>
        <CardAction>
          <Button
            aria-label="Dismiss dividend income"
            className="bg-muted"
            size="icon-sm"
            variant="ghost"
          >
            <X strokeWidth={1.5} />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {HOLDINGS.map((holding) => (
            <Item key={holding.name} role="listitem" variant="muted">
              <ItemContent>
                <ItemTitle>{holding.name}</ItemTitle>
                <ItemDescription>{holding.shares}</ItemDescription>
              </ItemContent>
              <div
                aria-label={`${holding.name} quarterly dividends`}
                className="hidden h-8 w-24 items-end gap-1 md:flex"
                role="img"
              >
                {holding.data.map((item) => (
                  <div
                    className="min-h-1 flex-1 rounded-t-sm bg-chart-2"
                    key={item.q}
                    style={{
                      height: `${(item.value / Math.max(...holding.data.map((point) => point.value))) * 100}%`,
                    }}
                  />
                ))}
              </div>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
