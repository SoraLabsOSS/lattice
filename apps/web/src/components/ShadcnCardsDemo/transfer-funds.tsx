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
  FieldGroup,
  FieldLabel,
} from "@sora-lattice/ui/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@sora-lattice/ui/components/input-group";
import { Item, ItemContent } from "@sora-lattice/ui/components/item";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sora-lattice/ui/components/select";
import { Separator } from "@sora-lattice/ui/components/separator";
import { X } from "lucide-react";

const FROM_ACCOUNTS = [
  { label: "Main Checking (··8402) — $12,450.00", value: "checking" },
  { label: "Business (··7731) — $8,920.00", value: "business" },
];

const TO_ACCOUNTS = [
  { label: "High Yield Savings (··1192) — $42,100.00", value: "savings" },
  { label: "Investment (··3349) — $18,200.00", value: "investment" },
];

export function TransferFunds() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer Funds</CardTitle>
        <CardDescription>
          Move money between your connected accounts.
        </CardDescription>
        <CardAction>
          <Button
            aria-label="Dismiss transfer funds"
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
            <FieldLabel htmlFor="transfer-amount">
              Amount to Transfer
            </FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>$</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput defaultValue="1,200.00" id="transfer-amount" />
            </InputGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="from-account">From Account</FieldLabel>
            <Select defaultValue="checking" items={FROM_ACCOUNTS}>
              <SelectTrigger className="w-full" id="from-account">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {FROM_ACCOUNTS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="to-account">To Account</FieldLabel>
            <Select defaultValue="savings" items={TO_ACCOUNTS}>
              <SelectTrigger className="w-full" id="to-account">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {TO_ACCOUNTS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Item className="flex-col items-stretch" variant="muted">
            <ItemContent className="gap-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Estimated arrival
                </span>
                <span className="font-medium text-sm">Today, Apr 14</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Transaction fee
                </span>
                <span className="font-medium text-sm tabular-nums">$0.00</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Total amount</span>
                <span className="font-semibold text-sm tabular-nums">
                  $1,200.00
                </span>
              </div>
            </ItemContent>
          </Item>
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Confirm Transfer</Button>
      </CardFooter>
    </Card>
  );
}
