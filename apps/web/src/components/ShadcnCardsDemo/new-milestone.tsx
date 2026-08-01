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
  Field,
  FieldGroup,
  FieldLabel,
} from "@sora-lattice/ui/components/field";
import { Input } from "@sora-lattice/ui/components/input";

export function NewMilestone() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a new milestone</CardTitle>
        <CardDescription>
          Define your financial target and we&apos;ll help you pace your
          savings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="goal-name">Goal Name</FieldLabel>
            <Input
              id="goal-name"
              placeholder="e.g. New Car, Home Downpayment"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="target-amount">Target Amount</FieldLabel>
              <Input defaultValue="$15,000" id="target-amount" />
            </Field>
            <Field>
              <FieldLabel htmlFor="target-date">Target Date</FieldLabel>
              <Input defaultValue="Dec 2025" id="target-date" />
            </Field>
          </div>
        </FieldGroup>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button className="w-full">Create Goal</Button>
        <Button className="w-full" variant="outline">
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}
