import { Button } from "@sora-lattice/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sora-lattice/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@sora-lattice/ui/components/field";
import { Progress } from "@sora-lattice/ui/components/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sora-lattice/ui/components/select";
import { Textarea } from "@sora-lattice/ui/components/textarea";
import { X } from "lucide-react";

const CURRENCIES = [
  { label: "USD — United States Dollar", value: "usd" },
  { label: "EUR — Euro", value: "eur" },
  { label: "GBP — British Pound", value: "gbp" },
  { label: "JPY — Japanese Yen", value: "jpy" },
];

export function PayoutThreshold() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout Threshold</CardTitle>
        <CardDescription>
          Set the minimum balance required before a payout is triggered.
        </CardDescription>
        <CardAction>
          <Button
            aria-label="Dismiss payout threshold"
            className="bg-muted"
            size="icon-sm"
            variant="ghost"
          >
            <X strokeWidth={1.5} />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="preferred-currency">
              Preferred Currency
            </FieldLabel>
            <Select defaultValue="usd" items={CURRENCIES}>
              <SelectTrigger className="w-full" id="preferred-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {CURRENCIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <div className="flex items-baseline justify-between">
              <FieldLabel id="min-payout-label">
                Minimum Payout Amount
              </FieldLabel>
              <span className="font-semibold text-2xl tabular-nums">
                $2500.00
              </span>
            </div>
            <Progress
              aria-labelledby="min-payout-label"
              aria-valuetext="$2,500 of $10,000"
              value={25}
            />
            <div className="flex items-center justify-between">
              <FieldDescription>$50 (MIN)</FieldDescription>
              <FieldDescription>$10,000 (MAX)</FieldDescription>
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="payout-notes">Notes</FieldLabel>
            <Textarea
              className="min-h-[100px]"
              id="payout-notes"
              placeholder="Add any notes for this payout configuration..."
            />
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Save Threshold</Button>
      </CardFooter>
    </Card>
  );
}
