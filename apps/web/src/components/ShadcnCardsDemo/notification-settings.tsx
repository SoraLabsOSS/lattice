import { Button } from "@sora-lattice/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sora-lattice/ui/components/card";
import { Checkbox } from "@sora-lattice/ui/components/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@sora-lattice/ui/components/field";

const NOTIFICATIONS = [
  {
    defaultChecked: true,
    description: "Deposits, withdrawals, and transfers.",
    id: "transactions",
    label: "Transaction alerts",
  },
  {
    defaultChecked: true,
    description: "Login attempts and account changes.",
    id: "security",
    label: "Security alerts",
  },
  {
    defaultChecked: false,
    description: "Updates at 25%, 50%, 75%, and 100%.",
    id: "goals",
    label: "Goal milestones",
  },
  {
    defaultChecked: false,
    description: "Daily portfolio summary and price alerts.",
    id: "market",
    label: "Market updates",
  },
];

export function NotificationSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Choose which email and push alerts you want to receive.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {NOTIFICATIONS.map((n) => (
            <Field key={n.id} orientation="horizontal">
              <Checkbox
                defaultChecked={n.defaultChecked}
                id={`notify-${n.id}`}
              />
              <FieldContent>
                <FieldLabel htmlFor={`notify-${n.id}`}>{n.label}</FieldLabel>
                <FieldDescription>{n.description}</FieldDescription>
              </FieldContent>
            </Field>
          ))}
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Save Preferences</Button>
      </CardFooter>
    </Card>
  );
}
